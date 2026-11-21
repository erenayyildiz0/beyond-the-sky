import json

import numpy as np

from bts.cosmic import CLUSTERS, H0, MPC_TO_MLY, galaxy_kind, pretty_name
from conftest import ROOT

OUT = ROOT.parent / "web" / "public" / "data"


def _load():
    sky = json.loads((OUT / "sky.json").read_text())
    data = np.fromfile(OUT / "cosmic.bin", np.float32).reshape(-1, 6)
    return sky["cosmic"], data


def test_counts_and_range():
    meta, data = _load()
    assert len(data) == meta["count"] > 43_000
    d = np.linalg.norm(data[:, :3], axis=1)
    assert d.max() <= 30_000 / H0 * MPC_TO_MLY + 50                # cz ≤ 30.000 km/s
    assert meta["fog_members"] > 500


def test_virgo_distance_and_fog_compression():
    meta, data = _load()
    v = next(c for c in meta["clusters"] if c["key"] == "virgo")
    assert abs(v["dist_mly"] - 16.5 * MPC_TO_MLY) < 0.5              # Mei ve ark. 2007
    u = np.array(v["enu_mly"]) / np.linalg.norm(v["enu_mly"])
    d = np.linalg.norm(data[:, :3], axis=1)
    cosang = (data[:, :3] @ u) / d
    proj = np.sqrt(np.clip(1 - cosang ** 2, 0, None)) * v["dist_mly"]
    m = (proj < 2.0 * MPC_TO_MLY) & (np.abs(d - v["dist_mly"]) < 40)
    assert m.sum() > 200
    assert d[m].std() < 3 * MPC_TO_MLY                               # sıkıştırma: ~10 Mpc'lik parmak yok


def test_helpers():
    assert galaxy_kind(" 3A2s") == 1 and galaxy_kind("-2__P") == 0 and galaxy_kind("10") == 2 and galaxy_kind("98") == 3
    assert pretty_name("MESSIER_031") == "M31"
    assert pretty_name("MESSIER_101") == "M101"
    assert pretty_name("NGC_0253") == "NGC 253"
    assert len(CLUSTERS) == 8
