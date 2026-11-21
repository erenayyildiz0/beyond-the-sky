import json
from datetime import date

import astropy.units as u
import numpy as np
import pytest
from astropy.coordinates import SkyCoord

from bts.catalog import index_of_hip
from bts.sky import altaz_frame, choose_time, earth_location, enu_from_altaz, moon_sun_alt
from conftest import ROOT, needs_raw


def _angle_deg(a, b):
    a = a / np.linalg.norm(a, axis=0); b = b / np.linalg.norm(b, axis=0)
    return np.degrees(np.arccos(np.clip((a * b).sum(axis=0), -1, 1)))


def test_auto_time(cfg):
    loc = earth_location(cfg)
    t = choose_time(cfg, loc, date(2026, 11, 21))
    moon, sun = moon_sun_alt(t, loc)
    assert moon < -10 and sun < -18
    assert t.to_datetime().strftime("%Y-%m-%d %H:%M") == "2026-11-29 18:00"   # UTC = 21:00 TSİ
    assert round(t.decimalyear, 3) == pytest.approx(2026.912)


@needs_raw
def test_polaris(model, cfg):
    i = index_of_hip(model.df, 11767)
    assert abs(model.alt[i] - cfg.location.lat_deg) < 1


@needs_raw
def test_rotation_matrix(model):
    R = model.R
    assert np.linalg.det(R) == pytest.approx(1.0, abs=1e-9)
    rng = np.random.default_rng(7)
    ra = rng.uniform(0, 360, 1000); dec = np.degrees(np.arcsin(rng.uniform(-1, 1, 1000)))
    c = SkyCoord(ra=ra * u.deg, dec=dec * u.deg)
    h = c.transform_to(altaz_frame(model.t, earth_location(model.cfg)))
    err = _angle_deg(R @ c.cartesian.xyz.value, enu_from_altaz(h.alt.deg, h.az.deg))
    assert err.max() < 0.02


@needs_raw
def test_3d_positions(model):
    df = model.df
    ok = ~df.nodist.values
    xyz = df[["x", "y", "z"]].values[ok].T
    P = model.dly[ok] * enu_from_altaz(model.alt[ok], model.az[ok])
    assert _angle_deg(model.R @ xyz, P).max() < 0.02
    assert np.abs(np.linalg.norm(xyz, axis=0) - df.dist.values[ok]).max() < 0.01


@needs_raw
def test_counts(model, cfg):
    from bts.visibility import count_visible
    c = model.sky["meta"]["counts"]
    assert c["city"] < c["dark"]
    assert abs(c["city"] - 111) <= 2 and abs(c["dark"] - 3189) <= 10
    k, g = cfg.visibility.extinction_k, cfg.visibility.glow_city_mag
    counts = [count_visible(model.alt, model.mag, s, g, k) for s in (17.5, 18.0, 18.5, 19.0)]
    assert counts == sorted(counts) and len(set(counts)) == 4


@needs_raw
def test_distance_stats(model):
    s = model.sky["meta"]["stats"]
    assert abs(s["dark_dist_ly_p50"] - 390) <= 5
    assert abs(s["dark_dist_ly_p95"] - 1426) <= 15
    assert abs(s["dark_nodist"] - 73) <= 2


@needs_raw
def test_solar_system(model):
    meta = model.sky["meta"]
    assert meta["sun"]["dist_au"] == pytest.approx(0.986, abs=0.002)
    assert meta["moon"]["light_time_s"] == pytest.approx(1.242, abs=0.002)
    nep = next(b for b in model.sky["bodies"] if b["key"] == "neptune")
    assert nep["dist_au"] == pytest.approx(29.46, abs=0.05)
    assert len(model.sky["bodies"]) == 7


@needs_raw
def test_label_stars_up(model):
    assert len(model.sky["labels"]) == 8
    assert all(model.alt[i] > 10 for i in model.sky["labels"])


@needs_raw
def test_json_schema(model, tmp_path):
    from build import write_json
    from bts.visibility import count_visible
    sky = model.sky
    for key in ("version", "meta", "stars", "names", "labels", "constellations", "frames", "path",
                "bodies", "voyager1", "galaxies", "birth"):
        assert key in sky
    assert sky["stars"]["fields"] == ["alt", "az", "mag", "r", "g", "b", "dly", "hip"]
    size = write_json(sky, tmp_path / "sky.json")
    assert size < 1_000_000
    # sayımlar JSON'a yazılan yuvarlanmış değerlerden
    data = json.loads((tmp_path / "sky.json").read_text())
    alt = np.array([r[0] for r in data["stars"]["data"]]); mag = np.array([r[2] for r in data["stars"]["data"]])
    v = data["meta"]["visibility"]
    assert count_visible(alt, mag, v["sqm_city"], v["glow_city_mag"], v["extinction_k"]) == data["meta"]["counts"]["city"]
    assert count_visible(alt, mag, v["sqm_dark"], v["glow_dark_mag"], v["extinction_k"]) == data["meta"]["counts"]["dark"]
    assert 3000 <= len(sky["names"]) <= 3200


@needs_raw
def test_detail_file(model, tmp_path):
    from build import write_json
    d = model.detail
    assert len(d["data"]) == len(model.sky["stars"]["data"])
    i = index_of_hip(model.df, 24608)
    assert d["data"][i][1] == "Aur"
    assert all(row[1] for row in d["data"])
    assert write_json(d, tmp_path / "catalog_detail.json") < 500_000
    assert len(model.icrs["data"]) == len(d["data"])


def test_written_outputs_in_budget():
    out = ROOT.parent / "web" / "public" / "data"
    if not (out / "sky.json").exists():
        pytest.skip("çıktılar henüz yok")
    budget = {"sky.json": 1e6, "catalog_detail.json": 5e5, "milkyway_altaz_4k.webp": 4e6,
              "milkyway_icrs_4k.webp": 4e6, "earth_night_8k.jpg": 8e6}
    for name, b in budget.items():
        p = out / name
        if p.exists():
            assert p.stat().st_size < b, name
