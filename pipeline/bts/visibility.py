"""Görünürlük modeli (SPEC §3.3). web/src/science/visibility.ts ve GLSL ile birebir aynı."""
import numpy as np


def nelm(sqm):
    """Schaefer (1990) tabanlı SQM → çıplak göz limit kadiri."""
    return 7.93 - 5 * np.log10(10 ** (4.316 - sqm / 5) + 1)


def airmass(alt_deg):
    """Kasten & Young (1989) hava kütlesi; alt < 0 ise 0 alınır."""
    a = np.maximum(alt_deg, 0.0)
    return 1 / (np.sin(np.radians(a)) + 0.50572 * (a + 6.07995) ** -1.6364)


def effective_mag(mag, alt_deg, k):
    return mag + k * (airmass(alt_deg) - 1)


def local_sqm(sqm_zenith, alt_deg, glow_mag):
    s = 1 - np.sin(np.radians(np.maximum(alt_deg, 0.0)))
    return sqm_zenith - glow_mag * s * s


def limit_mag(sqm_zenith, alt_deg, glow_mag):
    return nelm(local_sqm(sqm_zenith, alt_deg, glow_mag))


def visible_mask(alt, mag, sqm_zenith, glow_mag, k):
    """Sert eşik (sayaç için): alt > 0 ve m_eff < m_lim."""
    meff = mag + k * (airmass(alt) - 1)
    return (alt > 0) & (meff < nelm(local_sqm(sqm_zenith, alt, glow_mag)))


def count_visible(alt, mag, sqm_zenith, glow_mag, k):
    return int(visible_mask(alt, mag, sqm_zenith, glow_mag, k).sum())
