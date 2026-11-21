"""CLI: indir → hesapla → yaz → önizle (SPEC §5)."""
from __future__ import annotations

import argparse
import json
import time as _time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

from bts import PIPELINE_VERSION
from bts.birth import birth_table
from bts.bodies import bodies_meta
from bts.catalog import index_of_hip, load_catalog
from bts.config import Config, load_config
from bts.fetch import fetch_all, require_black_marble
from bts.flight import closest_approaches, constellation_lines, galactic_axes_icrs, galaxies, path_direction
from bts.sky import (altaz_from_enu, choose_time, earth_location, ecliptic_pole_enu, enu_from_altaz,
                     icrs_to_enu_matrix, moon_info, moon_sun_alt, planets, star_altaz, sun_info, voyager1)
from bts.visibility import count_visible, visible_mask

SOURCES = ["HYG v4.1 (CC BY-SA 4.0)", "NASA SVS Deep Star Maps 2020", "NASA Black Marble 2016",
           "NASA Blue Marble Next Generation (Kasım 2004)", "NASA SVS 4720 / LRO (Ay)", "NASA/JPL/SSI Cassini PIA07782 (Jüpiter)",
           "IAU WGCCRE 2015 (dönme eksenleri)"]
MIN_MISS_LY = 0.5


@dataclass
class Model:
    """Hesaplanan her şey; JSON'lar ve testler bundan beslenir."""
    cfg: Config
    t: object
    df: pd.DataFrame
    alt: np.ndarray            # 3 ondalığa yuvarlanmış (JSON'daki değer)
    az: np.ndarray
    mag: np.ndarray            # 2 ondalığa yuvarlanmış
    dly: np.ndarray            # NaN = bilinmiyor
    R: np.ndarray
    sky: dict
    detail: dict
    icrs: dict
    closest: list
    dark_mask: np.ndarray


def _rv(v, nd=6):
    return [round(float(x), nd) for x in np.ravel(v)]


def _rm(m, nd=9):
    return [[round(float(x), nd) for x in row] for row in np.asarray(m)]


def _num(x, nd):
    return None if x is None or not np.isfinite(x) else round(float(x), nd)


def compute(cfg: Config, today_local: date | None = None, use_horizons=True, t=None) -> Model:
    loc = earth_location(cfg)
    tz = ZoneInfo(cfg.location.tz)
    if t is None:
        today_local = today_local or datetime.now(tz).date()
        t = choose_time(cfg, loc, today_local)
    warnings: list[str] = []

    df = load_catalog(cfg.path("raw/hygdata_v41.csv"), cfg.catalog.mag_limit)
    alt_raw, az_raw = star_altaz(df.ra_deg.values, df.dec.values, t, loc)
    alt, az = np.round(alt_raw, 3), np.round(az_raw, 3)
    mag = np.round(df.mag.values.astype(float), 2)
    dly = df.dly.values.astype(float)
    R = icrs_to_enu_matrix(t, loc)

    vis = cfg.visibility
    k = vis.extinction_k
    counts = {"city": count_visible(alt, mag, vis.sqm_city, vis.glow_city_mag, k),
              "dark": count_visible(alt, mag, vis.sqm_dark, vis.glow_dark_mag, k)}
    dark = visible_mask(alt, mag, vis.sqm_dark, vis.glow_dark_mag, k)
    dark_known = dark & np.isfinite(dly)
    stats = {"dark_dist_ly_p50": round(float(np.percentile(dly[dark_known], 50))),
             "dark_dist_ly_p95": round(float(np.percentile(dly[dark_known], 95))),
             "dark_nodist": int((dark & ~np.isfinite(dly)).sum()),
             "nodist_shell_ly": cfg.catalog.nodist_shell_ly}

    # Rota
    fl = cfg.flight
    u_cas = path_direction(df, alt, az, fl.path_constellation_hips)
    gal = galaxies(cfg, R)
    target = next(g for g in gal if g["key"] == fl.path_target)
    P = dly * enu_from_altaz(alt, az)                                   # 3×N ENU, ışık yılı
    ci, cs, cp = closest_approaches(P, u_cas)
    if cp.min() < MIN_MISS_LY:
        raise RuntimeError(f"Rota bir yıldıza {cp.min():.2f} ışık yılı yaklaşıyor (< {MIN_MISS_LY}).")
    closest = [{"i": int(i), "along_ly": round(float(s), 1), "miss_ly": round(float(p), 2)}
               for i, s, p in zip(ci, cs, cp)]

    obs_year = round(float(t.decimalyear), 3)
    sun, moon = sun_info(t, loc), moon_info(t, loc)
    bodies = planets(t, loc, use_horizons, warnings)
    voy = voyager1(cfg, t, R, use_horizons, warnings)
    birth = birth_table(df, dly, alt, obs_year, cfg.birth, cfg.location.lat_deg)
    if cfg.visibility.sqm_city == 18.0:
        warnings.append("sqm_city varsayılan 18,0 (yer tutucu): lightpollutionmap.info'dan Kızılay değerini oku")

    utc = t.to_datetime(timezone=timezone.utc)
    loc_cfg = cfg.location
    stars = [[float(a), float(z), float(m), int(r), int(g), int(b), _num(d, 1),
              None if not np.isfinite(h) else int(h)]
             for a, z, m, r, g, b, d, h in zip(alt, az, mag, df.r, df.g, df.b, dly, df.hip.values)]
    sky = {
        "version": 2,
        "meta": {
            "location": {"name": loc_cfg.name, "name_ablative": loc_cfg.name_ablative, "lat": loc_cfg.lat_deg,
                         "lon": loc_cfg.lon_deg, "height_m": loc_cfg.height_m},
            "time_utc": utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "time_local": t.to_datetime(timezone=ZoneInfo(loc_cfg.tz)).isoformat(),
            "obs_year_frac": obs_year,
            "tz": loc_cfg.tz,
            "sun": sun,
            "moon": moon,
            "visibility": {"sqm_city": vis.sqm_city, "sqm_dark": vis.sqm_dark, "glow_city_mag": vis.glow_city_mag,
                           "glow_dark_mag": vis.glow_dark_mag, "extinction_k": k},
            "counts": counts,
            "stats": stats,
            "view": {"az_deg": cfg.view.az_deg, "horizon_screen_y": cfg.view.horizon_screen_y,
                     "vfov_landscape_deg": cfg.view.vfov_landscape_deg, "vfov_portrait_deg": cfg.view.vfov_portrait_deg},
            "milkyway": {"projection": "altaz-equirect", "left_edge_az": 0, "top_alt": 90, "full_sphere": True},
            "milkyway_icrs": {"projection": "radec-equirect", "center_ra": 0, "ra_increases": "left", "top_dec": 90},
            "warnings": warnings,
            "sources": SOURCES,
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "pipeline_version": PIPELINE_VERSION,
        },
        "stars": {"fields": ["alt", "az", "mag", "r", "g", "b", "dly", "hip"], "data": stars},
        "names": [{"i": int(i), "name": n} for i, (n, ok) in enumerate(zip(df.display_name, df.named)) if ok],
        "labels": [index_of_hip(df, h) for h in fl.label_hips],
        "constellations": constellation_lines(df, fl.constellations),
        "frames": {"icrs_to_enu": _rm(R), "gal_to_enu": _rm(R @ galactic_axes_icrs()),
                   "ecliptic_pole_enu": _rv(ecliptic_pole_enu(R))},
        "path": {"u_cas": _rv(u_cas), "u_target": target["enu_dir"], "closest": closest},
        "bodies": bodies,
        "voyager1": voy,
        "galaxies": gal,
        "birth": {"first_year": cfg.birth.first_year, "rows": birth},
        "realism": bodies_meta(cfg, R),
    }
    detail = {"version": 1, "fields": ["ci", "con", "spect"],
              "data": [[_num(c, 2), con, (s.strip() if isinstance(s, str) and s.strip() else None)]
                       for c, con, s in zip(df.ci.values, df.con.values, df.spect.values)]}
    icrs = {"version": 1, "fields": ["ra", "dec"],
            "data": [[round(float(r), 4), round(float(d), 4)] for r, d in zip(df.ra_deg.values, df.dec.values)]}
    return Model(cfg, t, df, alt, az, mag, dly, R, sky, detail, icrs, closest, dark)


def write_json(obj, path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return path.stat().st_size


def summary(m: Model) -> None:
    s, meta = m.sky, m.sky["meta"]
    df = m.df
    name = lambda i: df.display_name[i] or "adsız"
    loc = earth_location(m.cfg)
    moon_alt, sun_alt = moon_sun_alt(m.t, loc)
    ua, uz = altaz_from_enu(np.array(s["path"]["u_cas"]))
    m31 = next(g for g in s["galaxies"] if g["key"] == "m31")
    rows = s["birth"]["rows"]
    cover = sum(1 for y, _, d in rows if 1946 <= y <= 2018 and abs(d) <= 1)
    kn = m.dark_mask & np.isfinite(m.dly)
    M = m.mag[kn] - 5 * np.log10(m.dly[kn] / 3.2616 / 10)
    obs = meta["obs_year_frac"]
    belt = {h: m.dly[index_of_hip(df, h)] for h in (26727, 26311, 25930)}
    print("\n══════ Özet ══════")
    print(f"Tarih: {meta['time_local']}  (obs_year_frac {obs})")
    print(f"Ay {moon_alt:.1f}° · Güneş {sun_alt:.1f}°")
    print(f"Sayımlar: şehir {meta['counts']['city']} · karanlık {meta['counts']['dark']}")
    print(f"Ay ışık süresi: {meta['moon']['light_time_s']} sn ({meta['moon']['distance_km']} km) · "
          f"Güneş {meta['sun']['dist_au']} AB")
    print(f"û_cas: alt {ua:.2f}°, az {uz:.2f}°")
    print("En yakın 5 geçiş: " + " · ".join(f"{name(c['i'])} {c['along_ly']} ly'de {c['miss_ly']}"
                                             for c in m.closest[:5]))
    print(f"M31 yüksekliği: {m31['alt']}°")
    print(f"Doğum tablosu: 1946–2018 arası |fark| ≤ 1 olan {cover}/73 yıl")
    print(f"Uzaklık: p50 {meta['stats']['dark_dist_ly_p50']} · p95 {meta['stats']['dark_dist_ly_p95']} · "
          f"uzaklıksız (karanlık) {meta['stats']['dark_nodist']}")
    print(f"Keşif: Güneş'ten parlak %{100 * (M < 4.83).mean():.1f} · dly > {obs - 1071:.1f}: "
          f"{int((m.dly[kn] > obs - 1071).sum())} · Avcı kemeri: Alnitak {belt[26727]}, "
          f"Alnilam {belt[26311]}, Mintaka {belt[25930]}")
    print("Uyarılar: " + ("; ".join(meta["warnings"]) or "yok"))


def main() -> None:
    ap = argparse.ArgumentParser(description="Beyond the Sky veri hattı")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--today", help="auto arama başlangıcı (YYYY-MM-DD); varsayılan bugün")
    ap.add_argument("--no-horizons", action="store_true", help="JPL Horizons'a bağlanma")
    ap.add_argument("--skip-images", action="store_true", help="Samanyolu/Dünya dokularını üretme")
    args = ap.parse_args()
    t0 = _time.time()
    cfg = load_config(args.config)
    raw = cfg.path("raw")
    fetch_all(raw)
    has_earth = require_black_marble(cfg.path(cfg.earth.source))

    today = date.fromisoformat(args.today) if args.today else None
    m = compute(cfg, today, use_horizons=not args.no_horizons)
    out = cfg.path(cfg.output_dir)
    sizes = {"sky.json": write_json(m.sky, out / "sky.json"),
             "catalog_detail.json": write_json(m.detail, out / "catalog_detail.json"),
             "stars_icrs.json": write_json(m.icrs, out / "stars_icrs.json")}
    altaz8 = None
    if not args.skip_images:
        from bts.milkyway import build_milkyway
        written, altaz8, _ = build_milkyway(cfg, m.R, out)
        if has_earth:
            from bts.earth import build_earth
            written += build_earth(cfg, out)
        from bts.bodies import build_bodies
        written += build_bodies(cfg, out)
        sizes.update({p.name: p.stat().st_size for p in written})
    from bts.preview import build_previews
    build_previews(m, cfg.path(cfg.preview_dir), altaz8)
    summary(m)
    print("\nÇıktılar: " + " · ".join(f"{k} {v / 1e6:.2f} MB" for k, v in sizes.items()))
    print(f"Süre: {_time.time() - t0:.1f} sn")


if __name__ == "__main__":
    main()
