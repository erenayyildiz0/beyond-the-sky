"""HYG okuma, filtre, renk, uzaklık, adlar (SPEC §3.6, §3.7, §5.4)."""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

PC_TO_LY = 3.261563777
NODIST_PC = 100000          # HYG: dist ≥ 100000 → paralaks ölçülemedi

GREEK = dict(Alp="α", Bet="β", Gam="γ", Del="δ", Eps="ε", Zet="ζ", Eta="η", The="θ", Iot="ι", Kap="κ",
             Lam="λ", Mu="μ", Nu="ν", Xi="ξ", Omi="ο", Pi="π", Rho="ρ", Sig="σ", Tau="τ", Ups="υ",
             Phi="φ", Chi="χ", Psi="ψ", Ome="ω")
SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
BF = re.compile(r"^(?P<fl>\d{1,3})?\s*(?P<bay>[A-Z][a-z]{1,2})?\s*(?P<sup>\d)?\s*(?P<con>[A-Z][A-Za-z]{2})$")


def display_name(proper, bf, hip, hd=None):
    if isinstance(proper, str) and proper.strip():
        return proper.strip()                                   # "Achird"
    if isinstance(bf, str):
        m = BF.match(bf.strip())
        if m:
            if m["bay"] in GREEK:
                return f'{GREEK[m["bay"]]}{(m["sup"] or "").translate(SUP)} {m["con"]}'   # "π³ Ori"
            if m["fl"]:
                return f'{int(m["fl"])} {m["con"]}'             # "29 Psc"
    if hip == hip and hip:                                      # NaN değil
        return f"HIP {int(hip)}"
    if hd == hd and hd:
        return f"HD {int(hd)}"
    return None


def name_from_catalog(proper, bf) -> bool:
    """Ad proper ya da bf'den mi geliyor (sky.json names listesine girer)?"""
    if isinstance(proper, str) and proper.strip():
        return True
    if isinstance(bf, str):
        m = BF.match(bf.strip())
        return bool(m and (m["bay"] in GREEK or m["fl"]))
    return False


def bv_to_kelvin(bv):
    """Ballesteros (2012)."""
    return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62))


def kelvin_to_rgb(T):
    """Tanner Helland (2012) yaklaşımı; vektör girdi."""
    t = np.asarray(T, dtype=float) / 100
    with np.errstate(invalid="ignore", divide="ignore"):
        r = np.where(t <= 66, 255.0, 329.698727446 * np.maximum(t - 60, 1e-9) ** -0.1332047592)
        g = np.where(t <= 66, 99.4708025861 * np.log(t) - 161.1195681661,
                     288.1221695283 * np.maximum(t - 60, 1e-9) ** -0.0755148492)
        b = np.where(t >= 66, 255.0,
                     np.where(t <= 19, 0.0, 138.5177312231 * np.log(np.maximum(t - 10, 1e-9)) - 305.0447927307))
    return np.clip(np.stack([r, g, b], axis=-1), 0, 255)


def star_rgb(bv, desat=0.4):
    """B−V → sRGB, %40 beyaza karıştırılmış (göz yıldız renklerini soluk görür)."""
    rgb = kelvin_to_rgb(bv_to_kelvin(np.asarray(bv, dtype=float)))
    return np.round(rgb * (1 - desat) + 255 * desat).astype(int)


def load_catalog(path: str | Path, mag_limit: float) -> pd.DataFrame:
    """Güneş hariç mag ≤ limit yıldızlar, parlaktan sönüğe sıralı, 0..N−1 indeksli."""
    df = pd.read_csv(path, low_memory=False)
    df = df[(df.id != 0) & (df.mag <= mag_limit)].copy()
    df = df.sort_values(["mag", "id"], kind="stable").reset_index(drop=True)
    df["ra_deg"] = df.ra * 15.0
    known = df.dist < NODIST_PC
    df["nodist"] = ~known
    df["dly"] = np.where(known, (df.dist * PC_TO_LY).round(1), np.nan)
    df["bv"] = df.ci.fillna(0.6)
    rgb = star_rgb(df.bv.values)
    df["r"], df["g"], df["b"] = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    df["display_name"] = [display_name(p, b, h, d) for p, b, h, d in zip(df.proper, df.bf, df.hip, df.hd)]
    df["named"] = [name_from_catalog(p, b) for p, b in zip(df.proper, df.bf)]
    return df


def index_of_hip(df: pd.DataFrame, hip: int) -> int:
    idx = df.index[df.hip == hip]
    if len(idx) == 0:
        raise KeyError(f"HIP {hip} katalogda yok")
    return int(idx[0])
