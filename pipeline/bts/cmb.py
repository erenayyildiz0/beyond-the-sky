"""Gözlemlenebilir evrenin sınırı (docs/EXTRAS.md R5): Planck kozmik mikrodalga arka plan haritası.

Kaynak: ESA and the Planck Collaboration, "Planck CMB" (2013), CC BY-SA 3.0 IGO —
https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB. Galaktik koordinatlarda Mollweide (merkez l = 0,
l sola doğru artar). Galaktik eşdikdörtgene çevrilir: sütun u → l = u·360° (sağa doğru artar), satır v → b = 90° − v·180°.
Renkler sıcaklık farkının temsilidir (mikrodalga; gözle görünmez).
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

CMB_URL = ("https://media.esa.int/legacy/web/images/esa_multimedia/images/2013/03/planck_cmb/"
           "12583930-4-eng-GB/Planck_CMB.jpg")


def mollweide_theta(b):
    """2θ + sin 2θ = π sin b (Newton)"""
    th = np.array(b, float)
    target = np.pi * np.sin(b)
    for _ in range(30):
        f = 2 * th + np.sin(2 * th) - target
        th -= f / np.maximum(2 + 2 * np.cos(2 * th), 1e-9)
    return th


def mollweide_pixel(l_deg, b_deg, W, H):
    lam = np.radians(((np.asarray(l_deg) + 180) % 360) - 180)
    th = mollweide_theta(np.radians(b_deg))
    x = -(2 * np.sqrt(2) / np.pi) * lam * np.cos(th)          # l sola doğru artar
    y = np.sqrt(2) * np.sin(th)
    k = 0.99                                                   # elipsin kenarındaki beyaz arka planı örnekleme
    return (k * x / (2 * np.sqrt(2)) + 1) / 2 * (W - 1), (1 - k * y / np.sqrt(2)) / 2 * (H - 1)


def build_cmb(cfg, out_dir: Path) -> list[Path]:
    src = np.asarray(Image.open(cfg.path("raw/Planck_CMB.jpg")).convert("RGB"), np.float32)
    H, W, _ = src.shape
    ow, oh = 2048, 1024
    l = (np.arange(ow) + 0.5) / ow * 360.0
    b = 90.0 - (np.arange(oh) + 0.5) / oh * 180.0
    L, B = np.meshgrid(l, b)
    px, py = mollweide_pixel(L.ravel(), B.ravel(), W, H)
    x0 = np.clip(np.floor(px).astype(int), 0, W - 2); y0 = np.clip(np.floor(py).astype(int), 0, H - 2)
    fx = (px - x0)[:, None]; fy = (py - y0)[:, None]
    c = (src[y0, x0] * (1 - fx) + src[y0, x0 + 1] * fx) * (1 - fy) + (src[y0 + 1, x0] * (1 - fx) + src[y0 + 1, x0 + 1] * fx) * fy
    p = out_dir / "cmb_2k.jpg"
    Image.fromarray(np.clip(c, 0, 255).reshape(oh, ow, 3).astype(np.uint8)).save(p, "JPEG", quality=88, optimize=True)
    return [p]
