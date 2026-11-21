import astropy.units as u
import numpy as np
import pytest
from astropy.coordinates import SkyCoord
from PIL import Image

from bts.milkyway import radec_to_svs_pixel, read_exr_rgb
from conftest import RAW, needs_raw


def _hits(img, ra, dec):
    H, W = img.shape
    xs, ys = radec_to_svs_pixel(ra, dec, W, H)
    thr = np.percentile(img, 99)
    n = 0
    for x, y in zip(xs, ys):
        x0, y0 = int(x), int(min(max(y, 2), H - 3))
        cols = [(x0 + dx) % W for dx in range(-2, 3)]
        if img[y0 - 2:y0 + 3][:, cols].max() > thr:
            n += 1
    return n


@needs_raw
def test_svs_orientation(model):
    img = np.asarray(Image.open(RAW / "starmap_2020_4k_print.jpg").convert("L"), float)
    df = model.df.nsmallest(30, "mag")
    hits = _hits(img, df.ra_deg.values, df.dec.values)
    mirrored = _hits(img, (360 - df.ra_deg.values) % 360 + 180, df.dec.values)   # RA sağa artsaydı
    assert hits >= 24
    assert mirrored < hits - 10


@needs_raw
def test_galactic_plane_brighter():
    src = read_exr_rgb(RAW / "milkyway_2020_4k.exr")
    H, W, _ = src.shape
    L = src.mean(axis=2)
    ys, xs = np.mgrid[0:H:8, 0:W:8]
    ra = (180.0 - (xs + 0.5) / W * 360.0) % 360.0
    dec = 90.0 - (ys + 0.5) / H * 180.0
    b = SkyCoord(ra=ra.ravel() * u.deg, dec=dec.ravel() * u.deg).galactic.b.deg
    vals = L[ys.ravel(), xs.ravel()]
    assert vals[np.abs(b) < 5].mean() >= 3 * vals[np.abs(b) > 40].mean()


def test_svs_pixel_convention():
    xs, ys = radec_to_svs_pixel(np.array([0.0, 90.0]), np.array([90.0, 0.0]), 360, 180)
    assert xs[0] == pytest.approx(180) and ys[0] == pytest.approx(0)
    assert xs[1] == pytest.approx(90)                                  # RA sola artar
