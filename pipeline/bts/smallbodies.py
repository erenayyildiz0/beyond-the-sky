"""Gerçekçilik: asteroit kuşağı, Jüpiter Truvalıları ve Kuiper kuşağı — gözlem gecesindeki gerçek konumlar.

Kaynak: NASA/JPL Small-Body Database Query API (ssd-api.jpl.nasa.gov/sbdb_query.api). Oskülatör yörünge elemanları
(güneş merkezli, ekliptik J2000) iki cisim Kepler çözümüyle gözlem anına taşınır; birkaç aylık taşımada gezegen
pertürbasyonlarının etkisi görselde fark edilmez. Parlaklık sınırı (H) yalnızca nokta sayısını sınırlar.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import requests

from bts.sky import OBLIQUITY_DEG

API = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
FIELDS = "a,e,i,om,w,ma,epoch,H"
# (anahtar, SBDB sınıfları, H üst sınırı) — sınıflar: IMB/MBA/OMB iç/ana/dış kuşak, TJN Jüpiter Truvalıları, TNO Neptün ötesi
GROUPS = [
    ("main", "IMB,MBA,OMB", 15.0),
    ("trojan", "TJN", 14.0),
    ("kuiper", "TNO", None),
]
GAUSS_K_DEG = 0.9856076686           # Gauss yerçekimi sabiti: n = k / a^1,5 (derece/gün, a AB)


def fetch_group(raw: Path, key: str, classes: str, hmax: float | None) -> dict:
    """SBDB'den indirir; raw/sbdb_<key>.json varsa yeniden indirmez."""
    path = raw / f"sbdb_{key}.json"
    if not path.exists():
        params = {"fields": FIELDS, "sb-class": classes}
        if hmax is not None:
            params["sb-cdata"] = json.dumps({"AND": [f"H|LT|{hmax:g}"]})
        print(f"İndiriliyor: SBDB {classes} (H < {hmax})")
        r = requests.get(API, params=params, timeout=300)
        r.raise_for_status()
        path.write_text(r.text, encoding="utf-8")
    return json.loads(path.read_text(encoding="utf-8"))


def elements(d: dict) -> np.ndarray:
    """SBDB yanıtı → N×7 (a, e, i, Ω, ω, M, epoch_jd); eksik ya da kapalı olmayan yörüngeler atlanır."""
    idx = [d["fields"].index(f) for f in ("a", "e", "i", "om", "w", "ma", "epoch")]
    rows = []
    for r in d["data"]:
        try:
            v = [float(r[j]) for j in idx]
        except (TypeError, ValueError):
            continue
        if v[0] > 0 and 0 <= v[1] < 1:
            rows.append(v)
    return np.array(rows, dtype=float).reshape(-1, 7)


def solve_kepler(M: np.ndarray, e: np.ndarray) -> np.ndarray:
    """E − e sin E = M (radyan), Newton."""
    E = np.where(e < 0.8, M, np.pi * np.ones_like(M))
    for _ in range(30):
        dE = (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
        E -= dE
        if np.max(np.abs(dE)) < 1e-12:
            break
    return E


def helio_ecliptic(el: np.ndarray, jd: float) -> np.ndarray:
    """Güneş merkezli ekliptik J2000 konumlar (AB), N×3."""
    a, e, i, om, w, ma, ep = el.T
    n = GAUSS_K_DEG / a ** 1.5
    M = np.radians(np.mod(ma + n * (jd - ep), 360.0))
    E = solve_kepler(M, e)
    x = a * (np.cos(E) - e)
    y = a * np.sqrt(1 - e * e) * np.sin(E)
    i, om, w = np.radians(i), np.radians(om), np.radians(w)
    co, so, cw, sw, ci, si = np.cos(om), np.sin(om), np.cos(w), np.sin(w), np.cos(i), np.sin(i)
    X = (co * cw - so * sw * ci) * x + (-co * sw - so * cw * ci) * y
    Y = (so * cw + co * sw * ci) * x + (-so * sw + co * cw * ci) * y
    Z = (sw * si) * x + (cw * si) * y
    return np.stack([X, Y, Z], axis=1)


def ecliptic_to_icrs(p: np.ndarray) -> np.ndarray:
    eps = np.radians(OBLIQUITY_DEG)
    c, s = np.cos(eps), np.sin(eps)
    return np.stack([p[:, 0], c * p[:, 1] - s * p[:, 2], s * p[:, 1] + c * p[:, 2]], axis=1)


def build_smallbodies(cfg, t, R: np.ndarray, out_dir: Path) -> tuple[list[Path], dict]:
    """smallbodies.bin: N×3 float32 (güneş merkezli ENU, AB) + N uint8 (grup sırası). Meta sky.json'a gider."""
    raw = cfg.path("raw")
    jd = float(t.tdb.jd)
    pos, cls, groups = [], [], []
    for k, (key, classes, hmax) in enumerate(GROUPS):
        d = fetch_group(raw, key, classes, hmax)
        el = elements(d)
        enu = ecliptic_to_icrs(helio_ecliptic(el, jd)) @ R.T
        pos.append(enu)
        cls.append(np.full(len(enu), k, np.uint8))
        r = np.linalg.norm(enu, axis=1)
        groups.append({"key": key, "sbdb_class": classes, "h_max": hmax, "n": int(len(enu)),
                       "r_au_p50": round(float(np.median(r)), 2)})
    P = np.concatenate(pos).astype(np.float32)
    C = np.concatenate(cls)
    path = out_dir / "smallbodies.bin"
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(P.tobytes())
        f.write(C.tobytes())
    meta = {"count": int(len(P)), "groups": groups, "frame": "heliocentric ENU (AB)", "jd_tdb": round(jd, 5),
            "source": "NASA/JPL Small-Body Database (SBDB Query API), iki cisim Kepler taşıması"}
    return [path], meta
