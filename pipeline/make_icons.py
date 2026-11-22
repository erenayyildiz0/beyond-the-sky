"""Uygulama simgeleri (PWA): yıldızlı gece göğü, Samanyolu bandı ve ışıkları yanan bir şehir silueti.

Çalıştır: python make_icons.py  →  web/public/icons/*.png
Deterministik (sabit tohum); simgeler git'e girer, CI bunu çalıştırmaz.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "icons"
S = 1024  # çizim boyutu; küçükler bundan örneklenir


def draw(maskable: bool) -> Image.Image:
    rng = np.random.default_rng(29_11_2026)
    y, x = np.mgrid[0:S, 0:S] / S
    # Gökyüzü: tepede neredeyse siyah, ufka doğru koyu lacivert
    top, bottom = np.array([2, 4, 10]), np.array([14, 24, 52])
    sky = top + (bottom - top) * (y[..., None] ** 1.6)
    # Samanyolu: köşegen, yumuşak kenarlı sıcak-beyaz bant ve toz şeridi
    d = (x - y * 0.9 - 0.08) / 0.16
    band = np.exp(-d ** 2) * (1 - y) ** 0.4
    dust = np.exp(-((x - y * 0.9 - 0.1) / 0.035) ** 2) * 0.55
    glow = np.clip(band - dust * band, 0, 1)[..., None]
    sky = sky + glow * np.array([95, 88, 110])
    img = Image.fromarray(np.clip(sky, 0, 255).astype(np.uint8), "RGB")

    # Yıldızlar: bantta daha sık, parlaklık kuvvet yasasıyla (çoğu sönük)
    stars = Image.new("RGB", (S, S))
    sd = ImageDraw.Draw(stars)
    for _ in range(900):
        sx, sy = rng.random() * S, rng.random() * S * 0.78
        near = np.exp(-((sx / S - sy / S * 0.9 - 0.08) / 0.2) ** 2)
        if rng.random() > 0.35 + 0.65 * near:
            continue
        m = rng.random() ** 3
        r = 0.8 + 3.2 * m
        warm = rng.random()
        c = (int(200 + 55 * warm), int(210 + 35 * m), int(255 - 40 * warm))
        a = int(90 + 165 * m)
        sd.ellipse([sx - r, sy - r, sx + r, sy + r], fill=tuple(int(v * a / 255) for v in c))
    img = Image.composite(Image.new("RGB", (S, S), "white"), img, Image.new("L", (S, S), 0))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(stars.filter(ImageFilter.GaussianBlur(0.6)), float) * 1.4, 0, 255).astype(np.uint8))

    # Birkaç parlak yıldız (yıldız ışıltısı)
    bright = Image.new("RGB", (S, S))
    bd = ImageDraw.Draw(bright)
    for sx, sy, r in [(0.74, 0.17, 9), (0.3, 0.3, 7), (0.86, 0.46, 6)]:
        cx, cy = sx * S, sy * S
        bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 250, 235))
        bd.line([cx - r * 4, cy, cx + r * 4, cy], fill=(150, 160, 200), width=2)
        bd.line([cx, cy - r * 4, cx, cy + r * 4], fill=(150, 160, 200), width=2)
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(bright.filter(ImageFilter.GaussianBlur(2.5)), float) * 1.8, 0, 255).astype(np.uint8))

    # Şehir silueti: rastgele yükseklikte binalar, birkaç pencere hâlâ yanıyor
    city = ImageDraw.Draw(img)
    base = S * 0.80
    xpos = 0.0
    while xpos < S:
        w = rng.uniform(0.06, 0.13) * S
        h = rng.uniform(0.05, 0.19) * S
        city.rectangle([xpos, base - h, xpos + w, S], fill=(3, 5, 9))
        for wy in np.arange(base - h + 18, S - 10, 26):
            for wx in np.arange(xpos + 12, xpos + w - 14, 22):
                if rng.random() < 0.16:
                    city.rectangle([wx, wy, wx + 9, wy + 12], fill=(255, 196, 110))
        xpos += w + rng.uniform(0, 0.012) * S
    city.rectangle([0, base + S * 0.02, S, S], fill=(3, 5, 9))

    if not maskable:
        # Köşeleri yuvarlatılmış simge (maskable olmayan: tarayıcı sekmesi, masaüstü)
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return img.convert("RGBA")  # maskable: tam kare, işletim sistemi kendisi keser (önemli kısım ortadaki %80'de)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plain, mask = draw(False), draw(True)
    for size in (192, 512):
        plain.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)
    mask.resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png", optimize=True)
    mask.convert("RGB").resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)   # iOS kendisi yuvarlar
    plain.resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png", optimize=True)
    for f in sorted(OUT.iterdir()):
        print(f"{f.name}: {f.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
