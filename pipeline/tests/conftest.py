import sys
from datetime import date
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bts.config import load_config  # noqa: E402

RAW = ROOT / "raw"
needs_raw = pytest.mark.skipif(not (RAW / "hygdata_v41.csv").exists(),
                               reason="raw/ boş: önce python build.py çalıştır")


@pytest.fixture(scope="session")
def cfg():
    return load_config(ROOT / "config.yaml")


@pytest.fixture(scope="session")
def model(cfg):
    """SPEC'teki doğrulama gecesi: 21.11.2026'dan başlayan auto arama (29.11.2026 21:00). Horizons kapalı."""
    if not (RAW / "hygdata_v41.csv").exists():
        pytest.skip("raw/ boş: önce python build.py çalıştır")
    from build import compute
    return compute(cfg, date(2026, 11, 21), use_horizons=False)
