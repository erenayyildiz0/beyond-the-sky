"""Gerçekçilik paketi R3 (docs/EXTRAS.md): 2MRS galaksi kataloğundan kozmik ölçek.

2MRS: Huchra ve ark. 2012, ApJS 199, 26 (tdc-www.harvard.edu/2mrs) — 43.533 galaksi, Ks ≤ 11,75, kırmızıya kayma ölçülmüş.
Uzaklık d = cz / H0 (Hubble yasası). Yakın galaksilerde özhız baskın olduğundan cz < 500 km/s olanlar atlanır;
Yerel Grup ayrıca çizilir. Kümelerde kırmızıya kayma yönünde uzama ("Tanrı parmakları") düzeltilmez; README'de belirtilir.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord

H0 = 70.0                       # km/s/Mpc — yaygın uzlaşı değeri (Planck 2018: 67,4; SH0ES 2022: 73,0)
MPC_TO_MLY = 3.261563777        # 1 Mpc = 3,2616 milyon ışık yılı
CZ_MIN, CZ_MAX = 500.0, 30_000.0

# Bilinen kümeler (RA/Dec derece, uzaklık Mpc). Başak ve Fornaks: bağımsız uzaklık ölçümleri; diğerleri NED ortalama
# hızından cz/H0. Kaynaklar: Mei ve ark. 2007 ApJ 655, 144 (Başak 16,5 Mpc); Blakeslee ve ark. 2009 ApJ 694, 556
# (Fornaks 20,0 Mpc); Struble & Rood 1999 ApJS 125, 35 (Abell kümelerinin hızları).
CLUSTERS = [
    ("virgo", "Başak Kümesi", "Virgo Cluster", 187.70, 12.39, 16.5),
    ("fornax", "Fornaks Kümesi", "Fornax Cluster", 54.62, -35.45, 20.0),
    ("centaurus", "Erboğa Kümesi", "Centaurus Cluster", 192.20, -41.31, 3418 / H0),
    ("hydra", "Suyılanı Kümesi", "Hydra Cluster", 159.18, -27.53, 3777 / H0),
    ("norma", "Gönye Kümesi · Büyük Çekici", "Norma Cluster · Great Attractor", 243.59, -60.87, 4871 / H0),
    ("perseus", "Perseus Kümesi", "Perseus Cluster", 49.95, 41.51, 5366 / H0),
    ("coma", "Saç Kümesi", "Coma Cluster", 194.95, 27.98, 6925 / H0),
    ("shapley", "Shapley Üstkümesi", "Shapley Supercluster", 201.99, -31.50, 14500 / H0),
]


def galaxy_kind(t: str) -> int:
    """ZCAT tür kodu → 0 eliptik/mercimek, 1 sarmal, 2 düzensiz, 3 bilinmiyor."""
    m = re.match(r"\s*(-?\d+)", str(t))
    if not m:
        return 3
    c = int(m.group(1))
    if c <= 0 and c >= -7:
        return 0
    if 1 <= c <= 9 or c == 20:
        return 1
    if c in (10, 11, 16):
        return 2
    return 3


def pretty_name(catid: str) -> str | None:
    s = str(catid).strip()
    if not s or s.lower() in ("none", "--"):
        return None
    s = s.replace("MESSIER_", "M").replace("_", " ")
    s = re.sub(r"^(NGC|IC|UGC|ESO|PGC) 0*(\d)", r"\1 \2", s)
    return s


def build_cosmic(cfg, R, out_dir: Path) -> tuple[list[Path], dict]:
    import warnings
    from astropy.table import Table
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        t = Table.read(cfg.path("raw/2mrs/catalog/2mrs_1175_done.fits"))
    v = np.asarray(t["V"], float)
    keep = (v >= CZ_MIN) & (v <= CZ_MAX)
    t = t[keep]; v = v[keep]
    d_mpc = v / H0
    c = SkyCoord(ra=np.asarray(t["RA"], float) * u.deg, dec=np.asarray(t["DEC"], float) * u.deg)
    enu = R @ c.cartesian.xyz.value                                   # 3×N birim
    pos = (enu * (d_mpc * MPC_TO_MLY)).T                              # N×3, milyon ışık yılı
    k = np.asarray(t["MKC"], float)
    mk = k - 5 * np.log10(d_mpc * 1e5)                                # mutlak Ks (Mpc → 10 pc)
    # Görsel boyut (temsili): Samanyolu M_K ≈ −24 → 50 bin ışık yılı yarıçap; L^0,5 ile ölçekli
    r_kly = np.clip(50 * 10 ** (-0.2 * (mk + 24)), 3, 250)
    kind = np.array([galaxy_kind(x) for x in t["TYPE"]], np.float32)
    ba = np.clip(np.nan_to_num(np.asarray(t["BA"], float), nan=0.7), 0.1, 1.0)
    data = np.column_stack([pos, r_kly, kind, ba]).astype(np.float32)
    p = out_dir / "cosmic.bin"
    p.write_bytes(data.tobytes())

    # Adlar: yalnızca parlak galaksiler (Ks < 9), satır indeksiyle
    names = [{"i": int(i), "name": n} for i, (kk, cid) in enumerate(zip(k, t["CATID"]))
             if kk < 9.0 and (n := pretty_name(cid))]
    pn = out_dir / "cosmic_names.json"
    pn.write_text(json.dumps(names, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    clusters = []
    for key, tr, en, ra, dec, dmpc in CLUSTERS:
        e = R @ SkyCoord(ra=ra * u.deg, dec=dec * u.deg).cartesian.xyz.value
        clusters.append({"key": key, "name_tr": tr, "name_en": en,
                         "enu_mly": [round(float(x), 3) for x in e * dmpc * MPC_TO_MLY], "dist_mly": round(dmpc * MPC_TO_MLY, 1)})
    meta = {"count": int(len(data)), "fields": ["x", "y", "z", "r_kly", "kind", "ba"], "h0": H0,
            "cz_range": [CZ_MIN, CZ_MAX], "max_mly": round(float(np.linalg.norm(pos, axis=1).max()), 0), "clusters": clusters}
    return [p, pn], meta
