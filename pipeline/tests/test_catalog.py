import numpy as np

from bts.catalog import display_name, index_of_hip, star_rgb
from conftest import needs_raw


def test_display_name_examples():
    assert display_name(None, "24Eta Cas", None) == "η Cas"
    assert display_name(None, "1Pi 3Ori", None) == "π³ Ori"
    assert display_name(None, "19Phi2Cet", None) == "φ² Cet"
    assert display_name(None, "Alp CMa", None) == "α CMa"
    assert display_name(None, "29    Psc", None) == "29 Psc"
    assert display_name("Achird", "24Eta Cas", 3821) == "Achird"
    assert display_name(None, None, 1234.0) == "HIP 1234"
    assert display_name(None, None, float("nan"), 5.0) == "HD 5"


def test_star_colors():
    rigel, aldebaran = star_rgb([-0.03, 1.54])
    assert rigel[2] >= rigel[0]          # mavimsi
    assert aldebaran[0] > aldebaran[2]   # turuncu


@needs_raw
def test_catalog_rows(model):
    df = model.df
    assert len(df) == 15598
    assert not (df.proper == "Sol").any()
    assert int(df.nodist.sum()) == 431
    assert np.all(np.diff(df.mag.values) >= 0)          # parlaktan sönüğe


@needs_raw
def test_names(model):
    df = model.df
    bf = df[df.bf.notna()]
    assert all(display_name(None, b, None) is not None for b in bf.bf)
    assert df.display_name.isna().sum() <= 29


@needs_raw
def test_explore_numbers(model):
    kn = model.dark_mask & np.isfinite(model.dly)
    M = model.mag[kn] - 5 * np.log10(model.dly[kn] / 3.2616 / 10)
    assert abs(100 * (M < 4.83).mean() - 99.3) <= 0.1
    assert abs(int((model.dly[kn] > 955.9).sum()) - 380) <= 5
    assert abs(model.dly[index_of_hip(model.df, 26311)] - 1977) <= 5          # Alnilam
    for h in (54061, 53910, 58001, 59774, 62956, 65378, 67301):               # Büyükayı
        index_of_hip(model.df, h)
