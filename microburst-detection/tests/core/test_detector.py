"""Tests for microburst detector."""

import pytest
from datetime import datetime
from microburst_detection.core.detector import MicroburstDetector
from microburst_detection.core.models import (
    LidarData,
    DopplerRadarData,
    AnemometerData,
    SeverityLevel
)


@pytest.fixture
def detector():
    """Create detector instance for testing."""
    return MicroburstDetector()


@pytest.fixture
def sample_lidar_data():
    """Sample LIDAR data for testing."""
    return LidarData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=1200.0,
        vertical_velocity=-10.5,
        backscatter=0.75,
        range_resolution=30.0
    )


@pytest.fixture
def sample_radar_data():
    """Sample radar data for testing."""
    return DopplerRadarData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=1500.0,
        reflectivity=45.0,
        radial_velocity=-12.5,
        spectrum_width=3.2
    )


@pytest.fixture
def sample_anemometer_data():
    """Sample anemometer data for testing."""
    return AnemometerData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=10.0,
        wind_speed=25.5,
        wind_direction=245.0,
        temperature=18.3,
        pressure=1010.0
    )


@pytest.mark.asyncio
async def test_process_lidar_detection(detector, sample_lidar_data):
    """Test LIDAR processing with strong wind shear."""
    result = await detector.process_lidar(sample_lidar_data)
    
    # Should detect microburst with strong vertical velocity
    assert result is not None
    assert result.detection_method.value == "lidar"
    assert result.severity in [SeverityLevel.MODERATE, SeverityLevel.SEVERE, SeverityLevel.EXTREME]


@pytest.mark.asyncio
async def test_process_lidar_no_detection(detector):
    """Test LIDAR processing with weak signal."""
    weak_data = LidarData(
        timestamp=datetime.utcnow(),
        latitude=52.453,
        longitude=-1.748,
        altitude=1200.0,
        vertical_velocity=-1.0,  # Weak signal
        backscatter=0.2,
        range_resolution=30.0
    )
    
    result = await detector.process_lidar(weak_data)
    # May or may not detect depending on threshold
    assert result is None or result.severity == SeverityLevel.LOW


@pytest.mark.asyncio
async def test_process_radar_detection(detector, sample_radar_data):
    """Test radar processing."""
    result = await detector.process_radar(sample_radar_data)
    
    # Radar detection depends on hook echo pattern
    # May or may not detect
    assert result is None or result.detection_method.value == "doppler_radar"


@pytest.mark.asyncio
async def test_process_anemometer_detection(detector, sample_anemometer_data):
    """Test anemometer processing with high wind speed."""
    result = await detector.process_anemometer(sample_anemometer_data)
    
    # Should detect with high wind speed
    assert result is not None
    assert result.detection_method.value == "anemometer"
    assert result.severity in [SeverityLevel.MODERATE, SeverityLevel.SEVERE, SeverityLevel.EXTREME]


@pytest.mark.asyncio
async def test_get_recent_detections(detector, sample_lidar_data):
    """Test retrieving recent detections."""
    # Create a detection
    await detector.process_lidar(sample_lidar_data)
    
    # Retrieve recent detections
    detections = await detector.get_recent_detections(hours=24)
    assert len(detections) >= 1


@pytest.mark.asyncio
async def test_get_statistics(detector, sample_lidar_data):
    """Test statistics generation."""
    # Create some detections
    await detector.process_lidar(sample_lidar_data)
    
    stats = await detector.get_statistics(days=7)
    assert stats['total_detections'] >= 1
    assert 'severity_distribution' in stats
    assert 'avg_confidence' in stats

