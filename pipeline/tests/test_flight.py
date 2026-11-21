import astropy.units as u
import numpy as np
import pytest
from astropy.coordinates import Galactic, SkyCoord

from bts.flight import disk_normal_icrs, galactic_axes_icrs
from bts.sky import altaz_frame, altaz_from_enu, earth_location, enu_from_altaz
from conftest import needs_raw


@needs_raw
def test_path_direction(model):
    alt, az = altaz_from_enu(np.array(model.sky["path"]["u_cas"]))
    assert alt == pytest.approx(69.27, abs=0.1)
    assert az == pytest.approx(5.25, abs=0.2)


@needs_raw
def test_closest_approaches(model):
    c = model.closest
    assert model.df.hip[c[0]["i"]] == 3821                      # Achird
    assert c[0]["miss_ly"] == pytest.approx(0.97, abs=0.05)
    assert all(x["miss_ly"] >= 0.5 for x in c)


@needs_raw
def test_m31(model):
    m31 = next(g for g in model.sky["galaxies"] if g["key"] == "m31")
    assert m31["alt"] == pytest.approx(88.5, abs=0.2)


def test_disk_normal():
    for ra, dec, i, pa in [(10.6846, 41.2692, 77, 38), (23.4621, 30.6602, 55, 23)]:
        nrm = disk_normal_icrs(ra, dec, i, pa)
        n = SkyCoord(ra=ra * u.deg, dec=dec * u.deg).cartesian.xyz.value
        assert np.linalg.norm(nrm) == pytest.approx(1.0, abs=1e-12)
        assert np.degrees(np.arccos(nrm @ n)) == pytest.approx(i, abs=0.01)


def test_galactic_axes_match_spec():
    G = galactic_axes_icrs()
    spec = np.array([[-0.054876, 0.494109, -0.867666],
                     [-0.873437, -0.444830, -0.198076],
                     [-0.483835, 0.746982, 0.455984]])
    assert np.abs(G - spec).max() < 1e-5


@needs_raw
def test_galactic_frame(model):
    M = np.array(model.sky["frames"]["gal_to_enu"])
    assert np.abs(M.T @ M - np.eye(3)).max() < 1e-8           # 9 ondalığa yuvarlandı
    gc = SkyCoord(l=0 * u.deg, b=0 * u.deg, frame=Galactic).transform_to(
        altaz_frame(model.t, earth_location(model.cfg)))
    v = enu_from_altaz(gc.alt.deg, gc.az.deg)
    assert np.degrees(np.arccos(np.clip(M[:, 0] @ v, -1, 1))) < 0.02
