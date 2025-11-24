"""Anemometer sensor adapter."""

from typing import Optional
from ..core.models import AnemometerData


class AnemometerAdapter:
    """Adapter for surface anemometer stations."""
    
    def __init__(self, station_id: str = "anem_001") -> None:
        """Initialize anemometer adapter."""
        self.station_id = station_id
    
    async def read_measurement(self) -> Optional[AnemometerData]:
        """Read single anemometer measurement."""
        raise NotImplementedError("Connect to actual anemometer")
