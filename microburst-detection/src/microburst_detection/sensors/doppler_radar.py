"""Doppler radar sensor adapter."""

from typing import Optional
from ..core.models import DopplerRadarData


class DopplerRadarAdapter:
    """Adapter for Doppler weather radar data."""
    
    def __init__(self, radar_id: str = "radar_001") -> None:
        """Initialize radar adapter."""
        self.radar_id = radar_id
    
    async def read_measurement(self) -> Optional[DopplerRadarData]:
        """Read single radar measurement."""
        raise NotImplementedError("Connect to actual radar system")
