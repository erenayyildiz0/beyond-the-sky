import numpy as np
import pytest

from bts.visibility import airmass, count_visible, nelm


def test_nelm_values():
    assert nelm(18.0) == pytest.approx(3.97, abs=0.01)
    assert nelm(22.0) == pytest.approx(6.62, abs=0.01)
    s = np.linspace(16, 22.5, 50)
    assert np.all(np.diff(nelm(s)) > 0)


def test_airmass():
    assert airmass(90) == pytest.approx(1.000, abs=0.001)
    assert airmass(30) == pytest.approx(1.994, abs=0.01)
    assert airmass(0) == pytest.approx(37.9, abs=0.2)
    assert airmass(-5) == airmass(0)


def test_count_ignores_below_horizon():
    alt = np.array([-1.0, 45.0])
    mag = np.array([0.0, 0.0])
    assert count_visible(alt, mag, 18.0, 1.5, 0.25) == 1
