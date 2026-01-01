"""Tests for detection algorithms."""

import pytest
import numpy as np
from microburst_detection.core.algorithms import WindShearDetector


def test_calculate_wind_shear():
    """Test wind shear calculation."""
    altitudes = np.linspace(0, 3000, 100)
    vertical_velocities = np.sin(np.linspace(0, 4*np.pi, 100)) * 10
    
    wind_shear, severity = WindShearDetector.calculate_wind_shear(altitudes, vertical_velocities)
    
    assert len(wind_shear) == len(altitudes) - 1
    assert len(severity) == len(altitudes) - 1
    assert np.all(wind_shear >= 0)  # Wind shear should be non-negative


def test_calculate_wind_shear_insufficient_points():
    """Test wind shear with insufficient altitude points."""
    altitudes = np.array([0, 100])
    vertical_velocities = np.array([0, 5])
    
    with pytest.raises(ValueError, match="at least 3"):
        WindShearDetector.calculate_wind_shear(altitudes, vertical_velocities)

