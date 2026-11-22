"""Tarih çapaları görselleri (docs/EXTRAS.md T1): her görselin lisansı ve emeği geçeni yazılı, yalnızca özgür kaynaklar."""
from urllib.parse import urlparse

from bts.history import HISTORY_IMAGES

FREE = {"kamu malı", "CC0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0"}


def test_lisans_ve_kaynak():
    assert len(HISTORY_IMAGES) >= 10
    for key, (url, credit, lic) in HISTORY_IMAGES.items():
        assert credit, key
        assert lic in FREE, key
        assert urlparse(url).hostname in {"images-assets.nasa.gov", "commons.wikimedia.org"}, key
        # NASA görselleri kamu malı; Commons'takilerin lisansı tek tek doğrulandı
        if "nasa.gov" in url:
            assert lic == "kamu malı", key
