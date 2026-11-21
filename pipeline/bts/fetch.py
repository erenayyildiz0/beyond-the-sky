"""İndirme + SHA256 (SPEC §5.3)."""
from __future__ import annotations

import hashlib
from pathlib import Path

import requests

HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv"
SVS_BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/"
DOWNLOADS = {
    "hygdata_v41.csv": HYG_URL,
    "milkyway_2020_4k.exr": SVS_BASE + "milkyway_2020_4k.exr",
    "starmap_2020_4k_print.jpg": SVS_BASE + "starmap_2020_4k_print.jpg",
}
NASA_ASSETS = "https://assets.science.nasa.gov/content/dam/science/"
# Gerçekçilik paketi (docs/EXTRAS.md R1): Dünya gündüz, Ankara yüksek çözünürlüklü gece, Ay, Jüpiter
DOWNLOADS_R1 = {
    "world.200411.3x21600x10800.jpg": NASA_ASSETS + "esd/eo/images/bmng/bmng-base/november/world.200411.3x21600x10800.jpg",
    "BlackMarble_2016_C1.jpg": NASA_ASSETS + "esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_C1.jpg",
    "lroc_color_poles_4k.tif": "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.tif",
    "PIA07782.jpg": NASA_ASSETS + "psd/photojournal/pia/pia07/pia07782/PIA07782.jpg",
}
BLACK_MARBLE_PAGE = "https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps"
# Sayfadaki "2016 Color → Global → 13500x6750 (3km) JPEG" bağlantısı (21.11.2026'da çalıştı)
BLACK_MARBLE_URL = ("https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/"
                    "144000/144898/BlackMarble_2016_3km.jpg")


class FetchError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def download(url: str, dest: Path, timeout: float = 60) -> Path:
    """Dosya varsa yeniden indirmez. Akışla indirir, yarım kalanı siler."""
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"İndiriliyor: {url}")
    try:
        with requests.get(url, stream=True, timeout=timeout) as r:
            r.raise_for_status()
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 20):
                    f.write(chunk)
        tmp.rename(dest)
    except (requests.RequestException, OSError) as e:
        tmp.unlink(missing_ok=True)
        raise FetchError(
            f"{dest.name} indirilemedi ({e.__class__.__name__}: {e}).\n"
            f"Bağlantını kontrol et ya da dosyayı elle indirip {dest} olarak kaydet:\n  {url}"
        ) from e
    print(f"  {dest.name}: {dest.stat().st_size / 1e6:.1f} MB · SHA256 {sha256(dest)}")
    return dest


def fetch_all(raw_dir: Path) -> dict[str, Path]:
    return {name: download(url, raw_dir / name, timeout=180) for name, url in {**DOWNLOADS, **DOWNLOADS_R1}.items()}


def require_black_marble(path: Path) -> bool:
    """Black Marble'ı bilinen bağlantıdan indirmeyi dener; olmazsa ne yapılacağını yazdırır ve False döner."""
    if path.exists():
        return True
    try:
        download(BLACK_MARBLE_URL, path, timeout=120)
        return True
    except FetchError as e:
        print(e)
    print(
        "\n[Black Marble] Dünya gece dokusu bulunamadı: " + str(path) + "\n"
        f"  1) {BLACK_MARBLE_PAGE} sayfasını aç.\n"
        "  2) '2016 Color → Global → 13500x6750 (3km) JPEG' dosyasını indir.\n"
        f"  3) {path} olarak kaydet (ya da config.yaml → earth.source'u dosya adına göre düzelt).\n"
        "  Dünya dokusu olmadan diğer çıktılar yine üretilir.\n"
    )
    return False
