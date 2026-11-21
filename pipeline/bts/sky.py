"""Zaman seçimi, alt/az, dönme matrisi, Ay, Güneş, gezegenler, Voyager (SPEC §3.1, §5.5–§5.7)."""
from __future__ import annotations

import warnings
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import astropy.units as u
import numpy as np
from astropy.coordinates import AltAz, EarthLocation, SkyCoord, get_body, get_sun
from astropy.time import Time
from astropy.utils import iers

iers.conf.auto_download = False              # çevrimdışı çalış; UT1 belirsizliği < 1 sn, önemsiz
iers.conf.iers_degraded_accuracy = "warn"

OBLIQUITY_DEG = 23.4392911                   # J2000 ekliptik eğikliği

PLANETS = [
    # anahtar, TR, EN, Horizons id, yaklaşık V (bağlantı yoksa), renk
    ("mercury", "Merkür", "Mercury", "199", 0.0, (235, 230, 220)),
    ("venus", "Venüs", "Venus", "299", -4.2, (255, 250, 240)),
    ("mars", "Mars", "Mars", "499", 1.0, (255, 170, 120)),
    ("jupiter", "Jüpiter", "Jupiter", "599", -2.3, (255, 245, 230)),
    ("saturn", "Satürn", "Saturn", "699", 0.8, (255, 236, 200)),
    ("uranus", "Uranüs", "Uranus", "799", 5.7, (200, 235, 240)),
    ("neptune", "Neptün", "Neptune", "899", 7.8, (170, 190, 255)),
]


def enu_from_altaz(alt_deg, az_deg):
    """ENU: x = Doğu, y = Kuzey, z = Yukarı (SPEC §3.1)."""
    alt, az = np.radians(alt_deg), np.radians(az_deg)
    return np.stack([np.cos(alt) * np.sin(az),   # x: Doğu
                     np.cos(alt) * np.cos(az),   # y: Kuzey
                     np.sin(alt)])               # z: Yukarı


def altaz_from_enu(v):
    v = np.asarray(v, dtype=float)
    v = v / np.linalg.norm(v, axis=0)
    alt = np.degrees(np.arcsin(np.clip(v[2], -1, 1)))
    az = np.degrees(np.arctan2(v[0], v[1])) % 360.0
    return alt, az


def earth_location(cfg) -> EarthLocation:
    loc = cfg.location
    return EarthLocation(lat=loc.lat_deg * u.deg, lon=loc.lon_deg * u.deg, height=loc.height_m * u.m)


def altaz_frame(t, loc):
    return AltAz(obstime=t, location=loc)    # pressure=0 → kırılma yok


def moon_sun_alt(t, loc):
    fr = altaz_frame(t, loc)
    moon = get_body("moon", t, loc).transform_to(fr).alt.deg
    sun = get_sun(t).transform_to(fr).alt.deg
    return moon, sun


def choose_time(cfg, loc, today_local: date, force=False) -> Time:
    tz = ZoneInfo(cfg.location.tz)
    obs = cfg.observation
    if obs.time != "auto":
        t = Time(datetime.fromisoformat(obs.time))          # ofsetli ISO → UTC
        moon, sun = moon_sun_alt(t, loc)
        if (moon >= obs.max_moon_alt_deg or sun >= obs.max_sun_alt_deg) and not force:
            raise ValueError(f"Ay {moon:.1f}°, Güneş {sun:.1f}°: karanlık değil. --force ile zorla.")
        return t
    for d in range(obs.auto_search_days):
        local = datetime.combine(today_local + timedelta(days=d), time(obs.auto_local_hour), tzinfo=tz)
        t = Time(local)
        moon, sun = moon_sun_alt(t, loc)
        if moon < obs.max_moon_alt_deg and sun < obs.max_sun_alt_deg:
            return t
    raise RuntimeError("Arama aralığında aysız gece bulunamadı.")


def icrs_to_enu_matrix(t, loc, n=2000, seed=1):
    """B ≈ R @ A olacak şekilde en iyi dönme matrisi (Procrustes). A: ICRS, B: ENU birim vektörleri."""
    rng = np.random.default_rng(seed)
    ra = rng.uniform(0, 360, n)
    dec = np.degrees(np.arcsin(rng.uniform(-1, 1, n)))
    c = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")    # mesafesiz (birim küre)
    h = c.transform_to(altaz_frame(t, loc))
    A = c.cartesian.xyz.value                                     # 3×n
    B = enu_from_altaz(h.alt.deg, h.az.deg)                       # 3×n
    U, _, Vt = np.linalg.svd(B @ A.T)
    D = np.diag([1.0, 1.0, np.sign(np.linalg.det(U @ Vt))])
    return U @ D @ Vt


def star_altaz(ra_deg, dec_deg, t, loc):
    c = SkyCoord(ra=np.asarray(ra_deg) * u.deg, dec=np.asarray(dec_deg) * u.deg, frame="icrs")
    h = c.transform_to(altaz_frame(t, loc))
    return h.alt.deg, h.az.deg


def body_altaz(name, t, loc):
    h = get_body(name, t, loc).transform_to(altaz_frame(t, loc))
    return float(h.alt.deg), float(h.az.deg), h.distance


def sun_info(t, loc):
    alt, az, dist = body_altaz("sun", t, loc)
    return {"alt": round(alt, 2), "az": round(az, 2), "dist_au": round(float(dist.to(u.au).value), 5)}


def moon_info(t, loc):
    fr = altaz_frame(t, loc)
    moon = get_body("moon", t, loc)
    sun = get_body("sun", t, loc)
    h = moon.transform_to(fr)
    elong = moon.separation(sun).rad
    dist_km = float(h.distance.to(u.km).value)
    c = 299792.458
    return {"alt": round(float(h.alt.deg), 2), "az": round(float(h.az.deg), 2),
            "illum": round((1 - np.cos(elong)) / 2, 3),
            "distance_km": int(round(dist_km)), "light_time_s": round(dist_km / c, 3)}


def ecliptic_pole_enu(R):
    e = np.radians(OBLIQUITY_DEG)
    return R @ np.array([0.0, -np.sin(e), np.cos(e)])


def _horizons_vmag(hid, t, warnings_out):
    try:
        from astroquery.jplhorizons import Horizons
        loc = {"lon": 32.8541, "lat": 39.9208, "elevation": 0.890}
        eph = Horizons(id=hid, location=loc, epochs=t.jd).ephemerides()
        return float(eph["V"][0])
    except Exception as e:  # ağ yok, servis hatası
        warnings_out.append(f"Horizons V kadiri alınamadı ({hid}): {e.__class__.__name__}; yaklaşık değer kullanıldı")
        return None


def planets(t, loc, use_horizons=True, warnings_out=None):
    warnings_out = warnings_out if warnings_out is not None else []
    out = []
    for key, tr, en, hid, vmag, rgb in PLANETS:
        alt, az, dist = body_altaz(key, t, loc)
        mag = _horizons_vmag(hid, t, warnings_out) if use_horizons else None
        if mag is None:
            mag = vmag
            if not use_horizons:
                warnings_out.append(f"{tr}: Horizons kapalı, yaklaşık V = {vmag}")
        out.append({"key": key, "name_tr": tr, "name_en": en, "alt": round(alt, 2), "az": round(az, 2),
                    "dist_au": round(float(dist.to(u.au).value), 4), "mag": round(mag, 1), "rgb": list(rgb)})
    return out


def voyager1(cfg, t, R, use_horizons=True, warnings_out=None):
    warnings_out = warnings_out if warnings_out is not None else []
    v = cfg.flight.voyager1
    ra, dec, dist, src = v.ra_deg, v.dec_deg, v.dist_au, "config"
    if use_horizons:
        try:
            from astroquery.jplhorizons import Horizons
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                eph = Horizons(id="-31", location="500", epochs=t.jd).ephemerides()
            ra, dec, dist, src = float(eph["RA"][0]), float(eph["DEC"][0]), float(eph["delta"][0]), "horizons"
        except Exception as e:
            warnings_out.append(f"Voyager 1 Horizons'tan alınamadı ({e.__class__.__name__}); config değeri kullanıldı")
    n = SkyCoord(ra=ra * u.deg, dec=dec * u.deg).cartesian.xyz.value
    d = R @ n
    return {"enu_dir": [round(float(x), 6) for x in d], "dist_au": round(dist, 2), "source": src,
            "ra_deg": round(ra, 4), "dec_deg": round(dec, 4)}
