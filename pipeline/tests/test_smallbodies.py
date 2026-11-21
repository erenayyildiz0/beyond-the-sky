import json

import numpy as np

from bts.smallbodies import GROUPS, ecliptic_to_icrs, helio_ecliptic, solve_kepler
from conftest import ROOT

OUT = ROOT.parent / "web" / "public" / "data"


def test_kepler_solver():
    M = np.linspace(0, 2 * np.pi, 50)
    for e in (0.0, 0.3, 0.9):
        E = solve_kepler(M.copy(), np.full_like(M, e))
        assert np.allclose(E - e * np.sin(E), M, atol=1e-10)


def test_ceres_matches_horizons():
    """JPL Horizons (1 Ceres, @sun, ekliptik J2000, JD 2461374,25): elemanlar → konum."""
    el = np.array([[2.766444397684538, 0.0798542595171655, 10.586585109145, 80.24813089261842, 73.10324631769544,
                    311.8449831680603, 2461374.25]])
    p = helio_ecliptic(el, 2461374.25)[0]
    assert np.linalg.norm(p - [-0.348709527374806, 2.602322832784308, 0.1466169715802853]) < 1e-6


def test_ecliptic_to_icrs_pole():
    """Ekliptik kuzey kutbu ICRS'de RA 270°, Dec 66,56°."""
    v = ecliptic_to_icrs(np.array([[0.0, 0.0, 1.0]]))[0]
    assert abs(np.degrees(np.arcsin(v[2])) - 66.5607) < 1e-3 and v[0] == 0 and v[1] < 0


def test_output_belts():
    sky = json.loads((OUT / "sky.json").read_text())
    meta = sky["smallbodies"]
    raw = (OUT / "smallbodies.bin").read_bytes()
    n = meta["count"]
    assert len(raw) == n * 13
    P = np.frombuffer(raw[: n * 12], np.float32).reshape(-1, 3)
    C = np.frombuffer(raw[n * 12:], np.uint8)
    assert [g["key"] for g in meta["groups"]] == [g[0] for g in GROUPS]
    r = np.linalg.norm(P, axis=1)
    main, trojan, kuiper = (C == 0), (C == 1), (C == 2)
    assert main.sum() > 50_000 and 2.2 < np.median(r[main]) < 3.3 and np.percentile(r[main], 99) < 4.5   # dış kuşak Hilda grubunu (~4 AB) da içerir
    assert 4.8 < np.median(r[trojan]) < 5.6
    assert kuiper.sum() > 5_000 and 35 < np.median(r[kuiper]) < 48
    # Kuşak ekliptiğe yakın: ekliptik enlemin ortanca mutlak değeri < 10°
    pole = np.array(sky["frames"]["ecliptic_pole_enu"])
    lat = np.degrees(np.arcsin(P[main] @ pole / r[main]))
    assert np.median(np.abs(lat)) < 10
