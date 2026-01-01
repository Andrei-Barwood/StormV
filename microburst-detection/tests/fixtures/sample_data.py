"""Sample data fixtures for testing."""

from datetime import datetime
from microburst_detection.core.models import (
    LidarData,
    DopplerRadarData,
    AnemometerData
)


def sample_lidar_data():
    """Generate sample LIDAR data."""
    return LidarData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=1200.0,
        vertical_velocity=-8.5,
        backscatter=0.45,
        range_resolution=30.0
    )


def sample_radar_data():
    """Generate sample radar data."""
    return DopplerRadarData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=1500.0,
        reflectivity=45.2,
        radial_velocity=-12.5,
        spectrum_width=3.2
    )


def sample_anemometer_data():
    """Generate sample anemometer data."""
    return AnemometerData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=10.0,
        wind_speed=25.5,
        wind_direction=245.0,
        temperature=18.3,
        pressure=1013.25
    )

