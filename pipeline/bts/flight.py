"""Rota (û_cas, û_m31), en yakın geçişler, galaktik çerçeve, Yerel Grup, takımyıldız çizgileri (SPEC §3.9, §3.13, §5.10)."""
from __future__ import annotations

import astropy.units as u
import numpy as np
from astropy.coordinates import Galactic, SkyCoord

from .catalog import index_of_hip
from .sky import altaz_from_enu, enu_from_altaz


def path_direction(df, alt, az, hips):
    idx = [index_of_hip(df, h) for h in hips]
    v = enu_from_altaz(alt[idx], az[idx]).mean(axis=1)
    return v / np.linalg.norm(v)                                  # 29 Kasım: alt 69,27°, az 5,25°


def closest_approaches(P_ly, u_dir, s_max=800, n=12):
    """P_ly: 3×N ENU konumlar (uzaklığı bilinmeyenler NaN). Düz çizgi boyunca en yakın geçişler."""
    s = u_dir @ P_ly
    perp = np.linalg.norm(P_ly - np.outer(u_dir, s), axis=0)
    ok = np.isfinite(s) & (s > 0) & (s < s_max)
    order = np.argsort(perp[ok])[:n]
    return np.where(ok)[0][order], s[ok][order], perp[ok][order]


def galactic_axes_icrs():
    g = SkyCoord(l=[0, 90, 0] * u.deg, b=[0, 0, 90] * u.deg, frame=Galactic).icrs
    return g.cartesian.xyz.value                                  # 3×3, sütunlar = x̂, ŷ, ẑ


def _sky_basis(ra_deg, dec_deg):
    n = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg).cartesian.xyz.value
    e = np.cross([0.0, 0.0, 1.0], n)
    e /= np.linalg.norm(e)                                        # doğu
    nn = np.cross(n, e)                                           # kuzey
    return n, e, nn


def major_axis_icrs(ra_deg, dec_deg, pa_deg):
    n, e, nn = _sky_basis(ra_deg, dec_deg)
    pa = np.radians(pa_deg)
    return np.cos(pa) * nn + np.sin(pa) * e


def disk_normal_icrs(ra_deg, dec_deg, incl_deg, pa_deg):
    n, _, _ = _sky_basis(ra_deg, dec_deg)
    a = major_axis_icrs(ra_deg, dec_deg, pa_deg)
    m = np.cross(n, a)
    i = np.radians(incl_deg)
    return np.cos(i) * n + np.sin(i) * m


def galaxies(cfg, R):
    out = []
    for g in cfg.flight.galaxies:
        n = SkyCoord(ra=g.ra_deg * u.deg, dec=g.dec_deg * u.deg).cartesian.xyz.value
        d = R @ n
        alt, az = altaz_from_enu(d)
        row = {"key": g.key, "enu_dir": _r(d), "dist_ly": g.dist_ly, "alt": round(float(alt), 2),
               "az": round(float(az), 2), "draw_radius_ly": g.draw_radius_ly}
        if g.incl_deg is not None and g.pa_deg is not None:
            row["normal_enu"] = _r(R @ disk_normal_icrs(g.ra_deg, g.dec_deg, g.incl_deg, g.pa_deg))
            row["major_enu"] = _r(R @ major_axis_icrs(g.ra_deg, g.dec_deg, g.pa_deg))
            row["incl_deg"], row["pa_deg"] = g.incl_deg, g.pa_deg
        out.append(row)
    return out


def constellation_lines(df, constellations: dict):
    return {key: [[index_of_hip(df, a), index_of_hip(df, b)] for a, b in pairs]
            for key, pairs in constellations.items()}


def _r(v, nd=6):
    return [round(float(x), nd) for x in v]
