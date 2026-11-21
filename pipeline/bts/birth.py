"""Doğum yılı tablosu (SPEC §3.12, §5.10)."""
import numpy as np


def birth_table(df, dly, alt, obs_year, cfg, lat_deg):
    ok = np.isfinite(dly) & (df.mag.values <= cfg.mag_limit) & (dly < cfg.max_ly) \
         & (df.dec.values > lat_deg - 90 + cfg.min_peak_alt_deg)
    ia = np.where(ok)[0]
    iu = np.where(ok & (alt > cfg.up_alt_deg))[0]
    rows = []
    for Y in range(cfg.first_year, int(obs_year) + 1):
        a = obs_year - (Y + 0.5)
        ju = iu[np.argmin(np.abs(dly[iu] - a))]
        j = ju if abs(dly[ju] - a) <= cfg.prefer_up_tolerance_ly else ia[np.argmin(np.abs(dly[ia] - a))]
        rows.append([Y, int(j), round(float(dly[j] - a), 2)])
    return rows                                                    # [yıl, yıldız indeksi, fark]
