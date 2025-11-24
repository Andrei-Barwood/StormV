# src/microburst_detection/api/schemas.py
"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Re-export models for API use
from ..core.models import (
    LidarData,
    DopplerRadarData,
    AnemometerData,
    MicroburstDetection,
    SeverityLevel,
    DetectionMethod
)

# API-specific schemas
class LidarDataSchema(LidarData):
    """LIDAR data schema for API requests."""
    pass


class RadarDataSchema(DopplerRadarData):
    """Radar data schema for API requests."""
    pass


class AnemometerDataSchema(AnemometerData):
    """Anemometer data schema for API requests."""
    pass


class DetectionResponseSchema(BaseModel):
    """Detection response schema."""
    event_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    altitude: float
    severity: SeverityLevel
    detection_method: DetectionMethod
    max_wind_shear: float
    vertical_velocity: float
    confidence: float
    radius: float
    duration_seconds: int
    alert_level: str
    additional_data: Optional[dict] = None


class HealthCheckSchema(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="System status")
    version: str = Field(..., description="API version")
    active_connections: int = Field(default=0, description="Active WebSocket connections")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatisticsSchema(BaseModel):
    """Statistics response schema."""
    total_detections: int
    severity_distribution: dict
    avg_confidence: float
    avg_wind_shear: float
    period_days: int
