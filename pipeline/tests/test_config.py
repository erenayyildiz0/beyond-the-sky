from conftest import ROOT
from bts.config import load_config


def test_config_loads():
    cfg = load_config(ROOT / "config.yaml")
    assert cfg.location.name == "Ankara"
    assert cfg.flight.path_target == "m31"
    assert len(cfg.flight.galaxies) == 4
