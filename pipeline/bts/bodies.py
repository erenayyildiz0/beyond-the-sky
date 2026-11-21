"""Gerçekçilik paketi R1 (docs/EXTRAS.md): Dünya gündüz, Ankara yüksek çözünürlüklü gece karosu, Ay, Jüpiter dokuları
ve gök cisimlerinin dönme eksenleri."""
from __future__ import annotations

from pathlib import Path

import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord
from PIL import Image

# Black Marble 2016 karoları: 4 sütun (A: −180…−90, B: −90…0, C: 0…90, D: 90…180) × 2 satır (1: 90…0 K, 2: 0…90 G);
# her karo 21600² piksel = 90° → 240 piksel/derece (~463 m). Ankara C1'de.
TILE_DEG = 90.0
TILE_PX = 21600

# Dönme ekseni kuzey kutbu (ICRS RA/Dec, derece): IAU WGCCRE 2015 (Archinal ve ark. 2018, Celest. Mech. Dyn. Astr. 130:22), J2000 değerleri
POLES = {
    "sun": (286.13, 63.87),
    "moon": (266.86, 65.64),
    "mercury": (281.0103, 61.4155),
    "venus": (272.76, 67.16),
    "mars": (317.68143, 52.88650),
    "jupiter": (268.056595, 64.495303),
    "saturn": (40.589, 83.537),
    "uranus": (257.311, -15.175),
    "neptune": (299.36, 43.46),
}


# Diğer gezegenler: Solar System Scope dokuları (CC BY 4.0) — Merkür MESSENGER, Mars Viking/MGS, Venüs bulutları,
# Satürn Cassini, Uranüs ve Neptün Voyager 2 görüntülerinden derlenmiş (Neptün'deki Büyük Karanlık Leke 1989'daki hâli)
PLANET_MAPS = {"mercury": "sss_2k_mercury.jpg", "venus": "sss_2k_venus_atmosphere.jpg", "mars": "sss_2k_mars.jpg",
               "saturn": "sss_2k_saturn.jpg", "uranus": "sss_2k_uranus.jpg", "neptune": "sss_2k_neptune.jpg"}


def resize_save(src: Image.Image, path: Path, size, quality=85):
    path.parent.mkdir(parents=True, exist_ok=True)
    src.resize(tuple(size), Image.LANCZOS).save(path, "JPEG", quality=quality, optimize=True)
    return path


def ankara_patch_bounds(lat: float, lon: float, half_lat=4.0):
    """Ankara çevresinde yaklaşık kare (km cinsinden) bir enlem/boylam kutusu."""
    half_lon = half_lat / np.cos(np.radians(lat))
    return {"lat_min": lat - half_lat, "lat_max": lat + half_lat, "lon_min": lon - half_lon, "lon_max": lon + half_lon}


def crop_tile(tile: Image.Image, tile_lon0: float, tile_lat_top: float, b: dict) -> Image.Image:
    ppd = TILE_PX / TILE_DEG
    x0 = int(round((b["lon_min"] - tile_lon0) * ppd)); x1 = int(round((b["lon_max"] - tile_lon0) * ppd))
    y0 = int(round((tile_lat_top - b["lat_max"]) * ppd)); y1 = int(round((tile_lat_top - b["lat_min"]) * ppd))
    return tile.crop((x0, y0, x1, y1))


def pole_enu(R, ra, dec):
    v = SkyCoord(ra=ra * u.deg, dec=dec * u.deg).cartesian.xyz.value
    return [round(float(x), 6) for x in R @ v]


def bodies_meta(cfg, R) -> dict:
    """sky.json'a yazılan: Ankara karosunun sınırları ve gök cisimlerinin dönme eksenleri (ENU)."""
    b = ankara_patch_bounds(cfg.location.lat_deg, cfg.location.lon_deg)
    return {"ankara_patch": {k: round(v, 4) for k, v in b.items()},
            "poles_enu": {k: pole_enu(R, *v) for k, v in POLES.items()}}


def build_bodies(cfg, out_dir: Path) -> list[Path]:
    Image.MAX_IMAGE_PIXELS = None                                    # güvenilir NASA dosyaları
    raw = cfg.path("raw")
    written: list[Path] = []

    day = Image.open(raw / "world.200411.3x21600x10800.jpg").convert("RGB")
    written += [resize_save(day, out_dir / "earth_day_8k.jpg", (8192, 4096)),
                resize_save(day, out_dir / "earth_day_4k.jpg", (4096, 2048))]

    b = ankara_patch_bounds(cfg.location.lat_deg, cfg.location.lon_deg)
    tile = Image.open(raw / "BlackMarble_2016_C1.jpg").convert("RGB")
    patch = crop_tile(tile, 0.0, 90.0, b)
    w = 2048
    h = int(round(w * patch.height / patch.width))
    patch = patch.resize((w, h), Image.LANCZOS)
    p = out_dir / "ankara_night_2k.jpg"
    patch.save(p, "JPEG", quality=90, optimize=True)
    written.append(p)

    moon = Image.open(raw / "lroc_color_poles_4k.tif").convert("RGB")
    written += [resize_save(moon, out_dir / "moon_4k.jpg", (4096, 2048), 88),
                resize_save(moon, out_dir / "moon_2k.jpg", (2048, 1024), 88)]

    jup = Image.open(raw / "PIA07782.jpg").convert("RGB")
    written.append(resize_save(jup, out_dir / "planet_jupiter.jpg", (2048, 1024), 88))
    for key, src in PLANET_MAPS.items():
        written.append(resize_save(Image.open(raw / src).convert("RGB"), out_dir / f"planet_{key}.jpg", (2048, 1024), 88))
    return written
