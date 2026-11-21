"""PNG önizlemeler (SPEC §5.12). Yalnızca kontrol içindir; web kullanmaz."""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

from .catalog import index_of_hip  # noqa: E402
from .milkyway import radec_to_svs_pixel  # noqa: E402
from .sky import altaz_from_enu, enu_from_altaz  # noqa: E402
from .visibility import airmass, effective_mag, limit_mag  # noqa: E402

SKY = {"city": ("#161B26", "#4A3427"), "dark": ("#020409", "#0B1220")}   # §3.5 (zenit, ufuk)


def _hex(c):
    return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], float) / 255


def _smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def orientation_check(m, out: Path):
    img = np.asarray(Image.open(m.cfg.path(m.cfg.milkyway.orientation_check_image)).convert("RGB"))
    H, W, _ = img.shape
    df = m.df.nsmallest(30, "mag")
    xs, ys = radec_to_svs_pixel(df.ra_deg.values, df.dec.values, W, H)
    fig, ax = plt.subplots(figsize=(W / 100, H / 100), dpi=150)
    ax.imshow(img)
    ax.scatter(xs, ys, s=60, facecolors="none", edgecolors="#4CF", linewidths=0.8)
    for x, y, n in zip(xs, ys, df.display_name):
        ax.text(x + 6, y - 6, n, color="#4CF", fontsize=4)
    ax.set_axis_off()
    fig.savefig(out / "orientation_check.png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)


def _sky_render(m, altaz8, dirs, sqm, glow, k):
    """dirs: (h, w, 3) ENU birim vektörleri → arka plan RGB (0..1), §3.4–§3.5 sezgileriyle."""
    alt, az = altaz_from_enu(dirs.reshape(-1, 3).T)
    q = (sqm - m.cfg.visibility.sqm_city) / (m.cfg.visibility.sqm_dark - m.cfg.visibility.sqm_city)
    zen = _hex(SKY["city"][0]) * (1 - q) + _hex(SKY["dark"][0]) * q
    hor = _hex(SKY["city"][1]) * (1 - q) + _hex(SKY["dark"][1]) * q
    h = (1 - np.clip(alt, 0, 90) / 90) ** 2.5
    rgb = zen[None] * (1 - h[:, None]) + hor[None] * h[:, None]
    if altaz8 is not None:
        Hm, Wm, _ = altaz8.shape
        u = np.clip((az / 360 * Wm).astype(int), 0, Wm - 1)
        v = np.clip(((90 - alt) / 180 * Hm).astype(int), 0, Hm - 1)
        mw = (altaz8[v, u] / 255.0) ** 2.2                       # sRGB → doğrusal (kabaca)
        op = _smooth(20.3, 21.7, sqm) ** 1.2
        ext = 10 ** (-0.4 * k * (airmass(alt) - 1))
        rgb = rgb + mw * (op * ext)[:, None]
    rgb[alt < 0] = 0
    return np.clip(rgb, 0, 1).reshape(dirs.shape)


def _star_layer(m, sqm, glow, k):
    alt, mag = m.alt, m.mag
    meff = effective_mag(mag, alt, k)
    mlim = limit_mag(sqm, alt, glow)
    t = np.clip((meff - (mlim - 0.25)) / 0.5, 0, 1)
    vis = np.where(alt > 0, 1 - t * t * (3 - 2 * t), 0)
    return vis, meff


def perspective(m, altaz8, az0, w, h, vfov, state, out: Path):
    vcfg = m.cfg.visibility
    sqm, glow = (vcfg.sqm_city, vcfg.glow_city_mag) if state == "city" else (vcfg.sqm_dark, vcfg.glow_dark_mag)
    k = vcfg.extinction_k
    hs = m.cfg.view.horizon_screen_y
    alt0 = np.degrees(np.arctan((2 * hs - 1) * np.tan(np.radians(vfov / 2))))
    f = enu_from_altaz(alt0, az0)
    r = np.cross(f, [0, 0, 1.0]); r /= np.linalg.norm(r)
    up = np.cross(r, f)
    tv = np.tan(np.radians(vfov / 2)); th = tv * w / h
    xs = (np.arange(w) + 0.5) / w * 2 - 1
    ys = 1 - (np.arange(h) + 0.5) / h * 2
    X, Y = np.meshgrid(xs * th, ys * tv)
    d = f[None, None] + X[..., None] * r[None, None] + Y[..., None] * up[None, None]
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    bg = _sky_render(m, altaz8, d, sqm, glow, k)

    fig = plt.figure(figsize=(w / 100, h / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.imshow(bg, extent=[-1, 1, -1, 1], origin="upper", aspect="auto")
    vis, meff = _star_layer(m, sqm, glow, k)
    v = enu_from_altaz(m.alt, m.az)
    vf = f @ v
    ok = (vf > 0) & (vis > 0.02)
    px = (r @ v)[ok] / vf[ok] / th
    py = (up @ v)[ok] / vf[ok] / tv
    rgb = np.stack([m.df.r.values, m.df.g.values, m.df.b.values], 1)[ok] / 255
    size = np.clip(1.6 * 10 ** (-0.2 * (meff[ok] - 6.0)), 1, 9) ** 2 * 0.6
    ax.scatter(px, py, s=size, c=rgb, alpha=np.clip(vis[ok], 0, 1), linewidths=0)
    ax.axhline(2 * (1 - hs) - 1, color="#222", lw=0.5)
    ax.text(-0.98, 0.94, f"az {az0}° · {state} · görünür {int(((m.alt > 0) & (meff < limit_mag(sqm, m.alt, glow))).sum())}",
            color="w", fontsize=8)
    ax.set_xlim(-1, 1); ax.set_ylim(-1, 1); ax.set_axis_off()
    orient = "landscape" if w >= h else "portrait"
    fig.savefig(out / f"view_{orient}_az{az0:03d}_{state}.png")
    plt.close(fig)


def altaz_dark(m, altaz8, out: Path):
    fig, ax = plt.subplots(figsize=(16, 4.6), dpi=110)
    if altaz8 is not None:
        Hm = altaz8.shape[0]
        ax.imshow(altaz8[: Hm // 2], extent=[0, 360, 0, 90], aspect="auto")
    else:
        ax.set_facecolor("black")
    sel = m.dark_mask
    ax.scatter(m.az[sel], m.alt[sel], s=np.clip(6 - m.mag[sel], 0.2, 8) ** 1.6 * 0.4, c="w", linewidths=0)
    for i in np.where(sel & (m.mag < 1.5))[0]:
        ax.text(m.az[i] + 1, m.alt[i] + 1, m.df.display_name[i], color="#FD8", fontsize=7)
    m31 = next(g for g in m.sky["galaxies"] if g["key"] == "m31")
    ax.plot(m31["az"], m31["alt"], "o", mfc="none", mec="#F6A", ms=12)
    ax.text(m31["az"] + 2, m31["alt"] - 4, "M31", color="#F6A", fontsize=8)
    ua, uz = altaz_from_enu(np.array(m.sky["path"]["u_cas"]))
    ax.plot(uz, ua, "+", color="#4CF", ms=14)
    ax.text(uz + 2, ua - 4, "û_cas", color="#4CF", fontsize=8)
    ax.set_xticks(range(0, 361, 45)); ax.set_xlim(0, 360); ax.set_ylim(0, 90)
    ax.set_xlabel("azimut (K=0, D=90)"); ax.set_ylabel("yükseklik")
    ax.set_title(f"Karanlık gökyüzü · {m.sky['meta']['time_local']} · {m.sky['meta']['counts']['dark']} yıldız")
    fig.savefig(out / "altaz_dark.png", bbox_inches="tight")
    plt.close(fig)


def path_side(m, out: Path):
    u = np.array(m.sky["path"]["u_cas"])
    P = m.dly * enu_from_altaz(m.alt, m.az)
    s = u @ P
    perp_v = P - np.outer(u, s)
    # Rota düzlemine dik bakış: dik bileşeni tek bir eksende (zenite dik) göster
    e = np.cross(u, [0, 0, 1.0]); e /= np.linalg.norm(e)
    y = e @ perp_v
    dist = np.linalg.norm(perp_v, axis=0)
    ok = np.isfinite(s) & (s > -20) & (s < 800) & (dist < 60)
    fig, ax = plt.subplots(figsize=(14, 4), dpi=110)
    ax.set_facecolor("#05060A")
    ax.scatter(s[ok], y[ok], s=np.clip(7 - m.mag[ok], 0.3, 8) ** 1.5 * 0.5, c="#AAB", linewidths=0)
    ax.axhline(0, color="#4CF", lw=0.8)
    ax.plot(0, 0, "o", color="#FD5", ms=8); ax.text(2, 3, "Güneş", color="#FD5", fontsize=8)
    for h in m.cfg.flight.path_constellation_hips:
        i = index_of_hip(m.df, h)
        ax.plot(s[i], y[i], "*", color="#F6A", ms=10)
        ax.text(s[i] + 4, y[i] + 2, m.df.display_name[i], color="#F6A", fontsize=8)
    for c in m.closest[:5]:
        i = c["i"]
        ax.plot(s[i], y[i], "o", mfc="none", mec="#4CF", ms=10)
        ax.text(s[i] + 4, y[i] - 6, f"{m.df.display_name[i]} ({c['miss_ly']} ly)", color="#4CF", fontsize=7)
    ax.set_xlim(-20, 800); ax.set_ylim(-60, 60)
    ax.set_xlabel("rota boyunca (ışık yılı)"); ax.set_ylabel("dik uzaklık (ışık yılı)")
    ax.set_title("Kraliçe rotası (0–800 ışık yılı), yandan")
    fig.savefig(out / "path_side.png", bbox_inches="tight")
    plt.close(fig)


def build_previews(m, out: Path, altaz8=None):
    out.mkdir(parents=True, exist_ok=True)
    orientation_check(m, out)
    altaz_dark(m, altaz8, out)
    path_side(m, out)
    v = m.cfg.view
    for az0 in (80, 295):
        for state in ("city", "dark"):
            perspective(m, altaz8, az0, 1280, 720, v.vfov_landscape_deg, state, out)
            perspective(m, altaz8, az0, 540, 960, v.vfov_portrait_deg, state, out)
