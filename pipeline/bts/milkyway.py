"""EXR okuma, reprojeksiyon, ton eşleme (SPEC §5.8)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

from .sky import enu_from_altaz


def read_exr_rgb(path):
    import OpenEXR
    with OpenEXR.File(str(path)) as f:
        ch = f.channels()
        rgb = ch["RGB"].pixels if "RGB" in ch else np.dstack([ch[c].pixels for c in ("R", "G", "B")])
    return rgb.astype(np.float32)        # doğrusal renk


def bilinear(img, x, y):
    """x'te sarmalı (wrap), y'de kenara kıstırılmış çift doğrusal örnekleme."""
    H, W, _ = img.shape
    x0 = np.floor(x).astype(np.int64); y0 = np.floor(y).astype(np.int64)
    fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    x0 %= W; x1 = (x0 + 1) % W
    y0c = np.clip(y0, 0, H - 1); y1c = np.clip(y0 + 1, 0, H - 1)
    a, b = img[y0c, x0], img[y0c, x1]
    c, d = img[y1c, x0], img[y1c, x1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def radec_to_svs_pixel(ra_deg, dec_deg, Ws, Hs):
    xs = (Ws / 2.0 - ra_deg / 360.0 * Ws) % Ws       # merkez 0h, RA sola artar
    ys = (90.0 - dec_deg) / 180.0 * Hs               # üst = +90°
    return xs, ys


def reproject_to_altaz(src, R, out_w, out_h, chunk_rows=256):
    Hs, Ws, _ = src.shape
    az = (np.arange(out_w) + 0.5) / out_w * 360.0
    out = np.zeros((out_h, out_w, 3), np.float32)
    for r0 in range(0, out_h, chunk_rows):
        rows = np.arange(r0, min(out_h, r0 + chunk_rows))
        alt = 90.0 - (rows + 0.5) / out_h * 180.0
        AZ, ALT = np.meshgrid(az, alt)
        h = enu_from_altaz(ALT.ravel(), AZ.ravel())             # 3×N ENU
        e = R.T @ h                                             # 3×N ICRS
        ra = np.degrees(np.arctan2(e[1], e[0])) % 360.0
        dec = np.degrees(np.arcsin(np.clip(e[2], -1.0, 1.0)))
        xs, ys = radec_to_svs_pixel(ra, dec, Ws, Hs)
        out[rows] = bilinear(src, xs - 0.5, ys - 0.5).reshape(len(rows), out_w, 3)
    return out


def tonemap_scale(lin, valid_mask=None):
    L = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    sel = L if valid_mask is None else L[valid_mask]
    return 1.0 / max(float(np.percentile(sel, 99.5)), 1e-12)


def tonemap_to_srgb8(lin, valid_mask=None, exposure=1.5, scale=None):
    if scale is None:
        scale = tonemap_scale(lin, valid_mask)
    m = 1.0 - np.exp(-exposure * lin * scale)                    # yumuşak omuz
    s = np.where(m <= 0.0031308, 12.92 * m, 1.055 * np.power(np.maximum(m, 0), 1 / 2.4) - 0.055)
    return (np.clip(s, 0, 1) * 255 + 0.5).astype(np.uint8)


def save_webp(srgb8, path: Path, size, quality):
    img = Image.fromarray(srgb8)
    if img.size != tuple(size):
        img = img.resize(tuple(size), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)
    return path


def build_milkyway(cfg, R, out_dir: Path):
    """Ufuk koordinatlarında (SPEC) ve göksel koordinatlarda (konum özelliği) dokular yazar."""
    src = read_exr_rgb(cfg.path(cfg.milkyway.source))
    sizes = cfg.milkyway.out_sizes
    W, H = sizes[0]
    lin = reproject_to_altaz(src, R, W, H)
    scale = tonemap_scale(src)                    # iki projeksiyonda aynı ton eşleme
    altaz8 = tonemap_to_srgb8(lin, scale=scale)
    icrs8 = tonemap_to_srgb8(src, scale=scale)
    written = []
    for (w, h), tag in zip(sizes, ("4k", "2k")):
        written.append(save_webp(altaz8, out_dir / f"milkyway_altaz_{tag}.webp", (w, h), cfg.milkyway.webp_quality))
        written.append(save_webp(icrs8, out_dir / f"milkyway_icrs_{tag}.webp", (w, h), cfg.milkyway.webp_quality))
    return written, altaz8, src
