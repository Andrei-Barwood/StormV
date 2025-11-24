# Desde microburst-detection/

# 1. Crear anemometer.py
cat > src/microburst_detection/sensors/anemometer.py << 'ANEM_END'
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
ANEM_END

# 2. Crear kalman_filter.py
cat > src/microburst_detection/fusion/kalman_filter.py << 'KALMAN_END'
"""Kalman filter implementation for sensor fusion."""

import numpy as np
from typing import Tuple


class KalmanFilter:
    """Standard Kalman filter for state estimation."""
    
    def __init__(
        self,
        state_dim: int = 2,
        measurement_dim: int = 2,
        process_noise: float = 0.1,
        measurement_noise: float = 0.5
    ) -> None:
        """Initialize Kalman filter."""
        self.state_dim = state_dim
        self.measurement_dim = measurement_dim
        self.x = np.zeros(state_dim)
        self.P = np.eye(state_dim) * 10.0
        self.Q = np.eye(state_dim) * process_noise
        self.R = np.eye(measurement_dim) * measurement_noise
        self.F = np.eye(state_dim)
        self.H = np.eye(measurement_dim)
    
    def predict(self) -> Tuple[np.ndarray, np.ndarray]:
        """Prediction step."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        return self.x, self.P
    
    def update(self, measurement: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Update step with new measurement."""
        y = measurement - (self.H @ self.x)
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S)
        self.x = self.x + K @ y
        I = np.eye(self.state_dim)
        self.P = (I - K @ self.H) @ self.P
        return self.x, self.P
    
    def reset(self) -> None:
        """Reset filter to initial state."""
        self.x = np.zeros(self.state_dim)
        self.P = np.eye(self.state_dim) * 10.0
KALMAN_END

# 3. Crear logger.py
cat > src/microburst_detection/utils/logger.py << 'LOGGER_END'
"""Logging configuration for the application."""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logging(
    level: str = "INFO",
    log_file: Optional[Path] = None,
    json_format: bool = False
) -> logging.Logger:
    """Configure application logging."""
    logger = logging.getLogger("microburst_detection")
    logger.setLevel(getattr(logging, level.upper()))
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    if json_format:
        formatter = logging.Formatter(
            '{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"module": "%(name)s", "message": "%(message)s"}'
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger
LOGGER_END

# 4. Crear routes.py
cat > src/microburst_detection/api/routes.py << 'ROUTES_END'
"""Additional API routes."""

from fastapi import APIRouter

router = APIRouter()
ROUTES_END

echo "✅ Archivos faltantes creados"
