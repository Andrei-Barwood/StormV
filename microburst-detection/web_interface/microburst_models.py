# src/microburst_detection/core/models.py
"""Data models for microburst detection system using Pydantic v2."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, ConfigDict


class SeverityLevel(str, Enum):
    """Severity classification for microburst events."""
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    SEVERE = "severe"
    EXTREME = "extreme"


class DetectionMethod(str, Enum):
    """Available detection methods for microbursts."""
    LIDAR = "lidar"
    DOPPLER_RADAR = "doppler_radar"
    ANEMOMETER = "anemometer"
    FUSION = "fusion"


class SensorData(BaseModel):
    """Base sensor data model."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-11-23T21:03:00Z",
                "latitude": 52.453,
                "longitude": -1.748,
                "altitude": 1200.5
            }
        }
    )
    
    timestamp: datetime
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    altitude: float = Field(..., ge=0, description="Altitude in meters")
    
    @field_validator('timestamp')
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        """Ensure timestamp is not in the future."""
        if v > datetime.utcnow():
            raise ValueError('Timestamp cannot be in the future')
        return v


class LidarData(SensorData):
    """LIDAR sensor measurement data."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-11-23T21:03:00Z",
                "latitude": 52.453,
                "longitude": -1.748,
                "altitude": 1200.5,
                "vertical_velocity": -8.5,
                "backscatter": 0.45,
                "range_resolution": 30.0
            }
        }
    )
    
    vertical_velocity: float = Field(..., description="Vertical velocity in m/s")
    backscatter: float = Field(..., ge=0, le=1, description="Backscatter coefficient [0,1]")
    range_resolution: float = Field(default=30.0, description="Range resolution in meters")


class DopplerRadarData(SensorData):
    """Doppler weather radar measurement data."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-11-23T21:03:00Z",
                "latitude": 52.453,
                "longitude": -1.748,
                "altitude": 1200.5,
                "reflectivity": 45.2,
                "radial_velocity": -12.5,
                "spectrum_width": 3.2
            }
        }
    )
    
    reflectivity: float = Field(..., ge=-40, le=80, description="Reflectivity in dBZ")
    radial_velocity: float = Field(..., description="Radial velocity in m/s")
    spectrum_width: float = Field(..., ge=0, description="Spectrum width in m/s")


class AnemometerData(SensorData):
    """Surface anemometer (ground station) data."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-11-23T21:03:00Z",
                "latitude": 52.453,
                "longitude": -1.748,
                "altitude": 10.0,
                "wind_speed": 25.5,
                "wind_direction": 245.0,
                "temperature": 18.3,
                "pressure": 1013.25
            }
        }
    )
    
    wind_speed: float = Field(..., ge=0, description="Wind speed in m/s")
    wind_direction: float = Field(..., ge=0, le=360, description="Wind direction in degrees")
    temperature: float = Field(..., description="Temperature in Celsius")
    pressure: float = Field(..., ge=800, le=1100, description="Pressure in hPa")


class MicroburstDetection(BaseModel):
    """Microburst detection result."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_id": "evt_20251123_1",
                "timestamp": "2025-11-23T21:03:15Z",
                "latitude": 52.453,
                "longitude": -1.748,
                "altitude": 1200.5,
                "severity": "severe",
                "detection_method": "fusion",
                "max_wind_shear": 8.5,
                "vertical_velocity": -9.2,
                "confidence": 0.94,
                "radius": 1500.0,
                "duration_seconds": 180,
                "alert_level": "WINDSHEAR_ALERT"
            }
        }
    )
    
    event_id: str = Field(..., description="Unique event identifier")
    timestamp: datetime
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: float = Field(..., ge=0)
    severity: SeverityLevel
    detection_method: DetectionMethod
    max_wind_shear: float = Field(..., ge=0, description="Maximum wind shear in m/s")
    vertical_velocity: float = Field(..., description="Peak vertical velocity in m/s")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence [0,1]")
    radius: float = Field(..., ge=0, description="Microburst radius in meters")
    duration_seconds: int = Field(..., ge=0)
    alert_level: str = Field(..., description="Alert classification for pilots")
    additional_data: Optional[dict] = Field(default=None)


class FusedSensorData(BaseModel):
    """Multi-sensor fused data for robust detection."""
    
    timestamp: datetime
    location: tuple[float, float] = Field(..., description="(latitude, longitude)")
    altitude: float
    
    # Fused estimates
    fused_vertical_velocity: float
    fused_wind_shear: float
    estimation_covariance: float = Field(ge=0, description="Kalman filter covariance")
    
    # Contributing sensors
    lidar_available: bool = False
    radar_available: bool = False
    anemometer_available: bool = False
    
    fusion_quality: float = Field(ge=0, le=1, description="Overall data quality metric")
