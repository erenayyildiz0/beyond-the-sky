"""Black Marble yeniden boyutlandırma (SPEC §5.9)."""
from pathlib import Path

from PIL import Image


def build_earth(cfg, out_dir: Path):
    Image.MAX_IMAGE_PIXELS = None        # 13500×6750 güvenilir NASA dosyası; decompression bomb uyarısını kapat
    src = Image.open(cfg.path(cfg.earth.source)).convert("RGB")
    written = []
    for (w, h), tag in zip(cfg.earth.out_sizes, ("8k", "4k")):
        p = out_dir / f"earth_night_{tag}.jpg"
        src.resize((w, h), Image.LANCZOS).save(p, "JPEG", quality=cfg.earth.jpeg_quality, optimize=True)
        written.append(p)
    return written
