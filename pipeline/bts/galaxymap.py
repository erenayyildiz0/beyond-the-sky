"""Gerçekçilik paketi R2 (docs/EXTRAS.md): yüz-üstü galaksi haritaları (temsili görünüm; ölçüler yayımlanmış değerlerden).

RGBA çıktı: RGB = yüz-üstü yüzey parlaklığı (eski yıldızlar sıcak, kollar mavi-beyaz, HII bölgeleri pembe; sRGB),
A = toz optik derinliği (0..1 ↔ τ 0..3). Web bu haritayı galaksi düzleminde üst üste ince katmanlar olarak çizer.

Samanyolu ölçüleri:
- ince disk ölçek uzunluğu 2,6 kpc ≈ 8,5 bin ışık yılı (Bland-Hawthorn & Gerhard 2016, ARA&A 54, 529)
- çubuk yarı uzunluğu ~5 kpc, Güneş–merkez doğrultusuyla ~27° (Wegg, Gerhard & Portail 2015, MNRAS 450, 4050)
- 4 kol, sarmal eğimi ~12° (Vallée 2017; SPEC §3.13 ile aynı eğim), bir kol Güneş'ten geçer (§3.13 φ0)
- Güneş merkeze göre (−26,7; 0) bin ışık yılı (GRAVITY 2019; SPEC §3.13)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image

OLD = np.array([1.00, 0.84, 0.64])
YOUNG = np.array([0.72, 0.84, 1.00])
HII = np.array([1.00, 0.42, 0.62])


@dataclass
class GalaxySpec:
    key: str
    half_kly: float                 # haritanın yarı genişliği (bin ışık yılı)
    scale_len: float                # disk ölçek uzunluğu
    r_max: float                    # disk kesimi
    pitch_deg: float
    arms: list = field(default_factory=list)          # [(faz ofseti rad, genlik)]
    phi0: float = 0.0
    arm_width: float = 1.2          # kol genişliği (bin ışık yılı, Gauss σ)
    interarm: float = 0.35
    bar: tuple | None = None        # (yarı uzunluk σ, kalınlık σ, açı derece)
    bulge_sigma: float = 3.0
    bulge_amp: float = 2.5
    ring: tuple | None = None       # (yarıçap, genişlik σ, genlik)
    hii: int = 900
    dust: float = 1.0
    flocculent: float = 0.0         # 0: düzenli kollar, >0: parçalı (M33)
    irregular: bool = False
    arm_start: float = 0.0          # kollar bu yarıçaptan sonra başlar (çubuğun ucu)
    clump: float = 0.6              # kollardaki topaklanma (yıldız bulutları)
    seed: int = 1


def _wrap(a):
    return (a + np.pi) % (2 * np.pi) - np.pi


def _fbm(size, base_cells, rng, octaves=5, gain=0.5):
    """Yumuşak çok oktavlı gürültü (0..1): küçük rastgele ızgaraların bicubic büyütülmesi."""
    acc = np.zeros((size, size), np.float32); amp = 1.0; tot = 0.0; cells = base_cells
    for _ in range(octaves):
        g = rng.random((cells, cells)).astype(np.float32)
        acc += amp * np.asarray(Image.fromarray(g, "F").resize((size, size), Image.BICUBIC))
        tot += amp; amp *= gain; cells *= 2
    return np.clip(acc / tot, 0, 1)


def _value_noise(shape, scale, rng):
    """Basit değer gürültüsü (düzensiz galaksiler ve parçalı kollar için)."""
    h, w = shape
    gh, gw = max(2, int(h / scale)), max(2, int(w / scale))
    g = rng.random((gh + 1, gw + 1))
    y = np.linspace(0, gh, h, endpoint=False); x = np.linspace(0, gw, w, endpoint=False)
    yi, xi = y.astype(int), x.astype(int)
    fy, fx = (y - yi)[:, None], (x - xi)[None, :]
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = g[yi][:, xi]; b = g[yi][:, xi + 1]; c = g[yi + 1][:, xi]; d = g[yi + 1][:, xi + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def render_map(s: GalaxySpec, size=2048):
    rng = np.random.default_rng(s.seed)
    t = (np.arange(size) + 0.5) / size * 2 - 1
    X, Y = np.meshgrid(t * s.half_kly, -t * s.half_kly)            # +y üstte
    r = np.hypot(X, Y)
    th = np.arctan2(Y, X)
    disk = np.exp(-r / s.scale_len) * (1 - np.clip((r - 0.85 * s.r_max) / (0.15 * s.r_max), 0, 1)) ** 2

    arms = np.zeros_like(r)
    dust = np.zeros_like(r)
    k = 1 / np.tan(np.radians(s.pitch_deg))
    sp = np.sin(np.radians(s.pitch_deg))                            # yay uzunluğu → kola dik uzaklık
    rr = np.maximum(r, 1.0)
    start = np.clip((r - s.arm_start) / 4.0, 0, 1) ** 2 if s.arm_start > 0 else 1.0
    for off, amp in s.arms:
        th_arm = s.phi0 + off + np.log(rr / 4.0) * k
        d = _wrap(th - th_arm) * rr * sp                             # kola dik uzaklık (bin ışık yılı)
        arms += amp * start * np.exp(-0.5 * (d / (s.arm_width * (0.7 + 0.02 * rr))) ** 2)
        # toz: kolun iç (içbükey) kenarında, biraz önde
        dd = _wrap(th - th_arm - 0.9 * s.arm_width / (rr * sp)) * rr * sp
        dust += amp * start * np.exp(-0.5 * (dd / (0.45 * s.arm_width)) ** 2)
    if s.flocculent > 0:
        n = _fbm(size, 30, rng, 5) ** 2
        arms = arms * (1 - s.flocculent) + s.flocculent * 2.2 * n
        dust += 0.6 * s.flocculent * n
    if s.ring:
        R0, w, a = s.ring
        ring = a * np.exp(-0.5 * ((r - R0) / w) ** 2)
        arms += ring
        dust += 1.2 * ring

    clumps = _fbm(size, 24, rng, 5)
    grain = _fbm(size, 90, rng, 3)
    arms = arms * (1 - s.clump + 2 * s.clump * clumps ** 1.5)
    dust = dust * (0.5 + clumps)
    old = disk * (0.42 + 0.58 * np.minimum(arms, 1.5)) * (0.85 + 0.3 * grain)
    young = disk * arms ** 1.4 * (r > 2.5) * (0.6 + 0.8 * grain)
    if s.bar:
        L, W, ang = s.bar
        a = np.radians(ang)
        xb, yb = X * np.cos(a) + Y * np.sin(a), -X * np.sin(a) + Y * np.cos(a)
        old = old + 1.4 * np.exp(-0.5 * ((xb / L) ** 2 + (yb / W) ** 2))
        dust += 0.5 * np.exp(-0.5 * ((xb / (L * 0.9)) ** 2 + ((np.abs(yb) - W) / (0.4 * W)) ** 2))
    old = old + s.bulge_amp * np.exp(-0.5 * (r / s.bulge_sigma) ** 2)
    if s.irregular:
        n = _fbm(size, 6, rng, 6)
        blob = np.exp(-0.5 * (r / (0.3 * s.r_max)) ** 2) ** 1.3
        old = blob * (0.4 + n)
        young = blob * np.clip(n - 0.45, 0, None) * 3
        dust = blob * np.clip(_fbm(size, 10, rng, 5) - 0.5, 0, None) * 2

    # HII bölgeleri: kollar boyunca pembe düğümler
    hii = np.zeros_like(r)
    if s.hii and not s.irregular:
        p = (young / young.max()).ravel() ** 2
        idx = rng.choice(p.size, size=s.hii, p=p / p.sum())
        ys, xs = np.unravel_index(idx, r.shape)
        img = np.zeros_like(r)
        np.add.at(img, (ys, xs), rng.uniform(0.5, 1.0, s.hii))
        kern = np.exp(-0.5 * (np.arange(-4, 5) / 1.4) ** 2)
        img = np.apply_along_axis(lambda v: np.convolve(v, kern, "same"), 0, img)
        hii = np.apply_along_axis(lambda v: np.convolve(v, kern, "same"), 1, img)

    rgb = old[..., None] * OLD + 2.2 * young[..., None] * YOUNG + 0.9 * hii[..., None] * HII
    # asinh germesi (astronomi görüntülerindeki gibi): sönük dış kollar görünür, çekirdek doymaz
    rgb /= rgb.max()
    beta = 60.0
    m = np.arcsinh(beta * rgb) / np.arcsinh(beta)
    srgb = np.where(m <= 0.0031308, 12.92 * m, 1.055 * np.power(np.maximum(m, 0), 1 / 2.4) - 0.055)
    tau = s.dust * dust * disk / max(disk.max(), 1e-9) * 3.0
    alpha = np.clip(tau / 3.0, 0, 1)
    out = np.dstack([np.clip(srgb, 0, 1), alpha])
    return (out * 255 + 0.5).astype(np.uint8)


def _mw_phi0():
    # SPEC §3.13: bir kolun Güneş'ten (r = 26,7, θ = π) geçmesi için
    return np.pi - np.log(26.7 / 4) / np.tan(np.radians(12))


SPECS = [
    GalaxySpec("mw", half_kly=60, scale_len=8.5, r_max=55, pitch_deg=12, phi0=_mw_phi0(),
               arms=[(0, 1.0), (np.pi, 1.0), (np.pi / 2, 0.55), (3 * np.pi / 2, 0.55)],
               bar=(8.0, 2.5, 27.0), bulge_sigma=3.2, bulge_amp=2.6, hii=1600, arm_start=9.0, arm_width=1.6, seed=7),
    GalaxySpec("m31", half_kly=120, scale_len=17.0, r_max=110, pitch_deg=7, phi0=0.4,
               arms=[(0, 0.8), (np.pi, 0.8)], arm_width=1.8, ring=(33.0, 3.5, 1.3), arm_start=12.0,
               bulge_sigma=6.5, bulge_amp=3.2, hii=1200, seed=31),
    GalaxySpec("m33", half_kly=32, scale_len=4.6, r_max=30, pitch_deg=20, phi0=1.0,
               arms=[(0, 0.9), (np.pi, 0.9)], arm_width=0.9, flocculent=0.55,
               bulge_sigma=0.9, bulge_amp=1.2, hii=900, seed=33),
    GalaxySpec("lmc", half_kly=8, scale_len=3, r_max=7, pitch_deg=20, bar=(2.0, 0.6, 10.0),
               bulge_sigma=0.1, bulge_amp=0, irregular=True, seed=51),
    GalaxySpec("smc", half_kly=4, scale_len=1.5, r_max=3.5, pitch_deg=20,
               bulge_sigma=0.1, bulge_amp=0, irregular=True, seed=52),
]


def build_galaxy_maps(out_dir: Path) -> list[Path]:
    written = []
    for s in SPECS:
        size = 2048 if s.key == "mw" else 1024
        arr = render_map(s, size)
        p = out_dir / f"galaxy_{s.key}.webp"
        # exact: alfa (toz) 0 olan yerlerde de RGB korunsun (yoksa WebP orayı bozar)
        Image.fromarray(arr, "RGBA").save(p, "WEBP", quality=92, method=6, exact=True)
        written.append(p)
    return written


def galaxy_meta() -> dict:
    """Web'e: harita yarı genişliği ve dikey yapı (bin ışık yılı). Disk kalınlıkları: ince disk ~300 pc (≈1 bin ışık yılı)."""
    v = {"mw": (60, 1.0, 3.0, 6.0), "m31": (120, 1.5, 6.0, 12.0), "m33": (32, 0.6, 0.8, 2.0),
         "lmc": (8, 0.8, 0.0, 1.0), "smc": (4, 0.8, 0.0, 1.0)}
    return {k: {"half_kly": a, "h_disk_kly": b, "h_bulge_kly": c, "r_bulge_kly": d} for k, (a, b, c, d) in v.items()}
