# src/microburst_detection/sensors/lidar.py
"""LIDAR sensor adapter."""

from typing import Optional
from ..core.models import LidarData


class LidarAdapter:
    """Adapter for LIDAR sensor data streams."""
    
    def __init__(self, sensor_id: str = "lidar_001") -> None:
        """Initialize LIDAR adapter."""
        self.sensor_id = sensor_id
    
    async def read_measurement(self) -> Optional[LidarData]:
        """Read single LIDAR measurement."""
        # Implementación específica del hardware
        raise NotImplementedError("Connect to actual LIDAR hardware")
    
    async def start_stream(self) -> None:
        """Start continuous LIDAR data stream."""
        raise NotImplementedError("Implement streaming logic")

