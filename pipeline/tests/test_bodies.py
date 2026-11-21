import numpy as np
from PIL import Image

from bts.bodies import POLES, ankara_patch_bounds
from conftest import ROOT, needs_raw

OUT = ROOT.parent / "web" / "public" / "data"


def _px(img, lat, lon, b=None):
    """Eşdikdörtgen (ya da kutu) görüntüde enlem/boylamın pikseli."""
    w, h = img.size
    if b is None:
        x = (lon + 180) / 360 * w; y = (90 - lat) / 180 * h
    else:
        x = (lon - b["lon_min"]) / (b["lon_max"] - b["lon_min"]) * w
        y = (b["lat_max"] - lat) / (b["lat_max"] - b["lat_min"]) * h
    return int(x), int(y)


def test_patch_bounds_square_km(cfg):
    b = ankara_patch_bounds(cfg.location.lat_deg, cfg.location.lon_deg)
    assert b["lat_min"] < cfg.location.lat_deg < b["lat_max"]
    km_lat = (b["lat_max"] - b["lat_min"]) * 111.2
    km_lon = (b["lon_max"] - b["lon_min"]) * 111.2 * np.cos(np.radians(cfg.location.lat_deg))
    assert abs(km_lat - km_lon) < 1


@needs_raw
def test_ankara_bright_in_patch(cfg, model):
    p = OUT / "ankara_night_2k.jpg"
    img = Image.open(p).convert("L")
    b = model.sky["realism"]["ankara_patch"]
    x, y = _px(img, cfg.location.lat_deg, cfg.location.lon_deg, b)
    center = np.asarray(img.crop((x - 15, y - 15, x + 15, y + 15)), float).mean()
    overall = np.asarray(img, float).mean()
    assert center > 4 * overall                         # şehir merkezi çevresinden çok parlak


def test_moon_map_orientation():
    img = Image.open(OUT / "moon_2k.jpg").convert("L")
    def mean(lat, lon):
        x, y = _px(img, lat, lon)
        return np.asarray(img.crop((x - 10, y - 10, x + 10, y + 10)), float).mean()
    # Mare Imbrium (~33° K, 16° B) koyu; güneydeki yaylalar (~−30°, 10° D) aydınlık; harita boylam 0'da ortalı
    assert mean(33, -16) < 0.8 * mean(-30, 10)


def test_poles_unit_vectors(model):
    for k, v in model.sky["realism"]["poles_enu"].items():
        assert abs(np.linalg.norm(v) - 1) < 1e-4, k
    assert set(POLES) <= set(model.sky["realism"]["poles_enu"])


def test_milky_way_map_sun_on_arm():
    """Galaksi haritası: Güneş'in yeri (−26,7; 0) bin ışık yılı, aynı yarıçaptaki çemberin ortancasından parlak (bir kolun üstünde)."""
    img = np.asarray(Image.open(OUT / "galaxy_mw.webp").convert("RGBA"), float)[..., :3].mean(axis=2)
    n = img.shape[0]
    half = 60.0
    def px(x, y):
        return int((x / half + 1) / 2 * n), int((1 - y / half) / 2 * n)
    sx, sy = px(-26.7, 0.0)
    sun = img[sy - 3:sy + 4, sx - 3:sx + 4].mean()
    ring = [img[py, pxx] for a in np.linspace(0, 2 * np.pi, 360, endpoint=False)
            for pxx, py in [px(26.7 * np.cos(a), 26.7 * np.sin(a))]]
    assert sun > np.median(ring)


def test_cmb_mollweide_orientation():
    """Planck Mollweide: l = 0 merkezde, l = 90° solda (l sola doğru artar), kuzey kutbu üstte"""
    from bts.cmb import mollweide_pixel
    x, y = mollweide_pixel(np.array([0.0, 90.0, 270.0, 0.0]), np.array([0.0, 0.0, 0.0, 89.9]), 1920, 960)
    assert abs(x[0] - 959.5) < 1 and abs(y[0] - 479.5) < 1
    assert x[1] < x[0] < x[2]
    assert y[3] < 10
    assert (OUT / "cmb_2k.jpg").exists()
