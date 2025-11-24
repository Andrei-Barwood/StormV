#!/usr/bin/env zsh
# fix_project.zsh
# Script para reparar y completar la estructura del proyecto Amarr-Stormomon
# Autor: Aviation Safety Team
# Fecha: 2025-11-23

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║         AMARR-STORMOMON PROJECT REPAIR SCRIPT           ║
║              🔧 Fixing Missing Files 🔧                  ║
╚══════════════════════════════════════════════════════════╝
EOF
echo "${NC}"

# Detectar si estamos en el directorio correcto
if [ -d "microburst-detection" ]; then
    echo "${BLUE}📂 Detectado proyecto en:${NC} microburst-detection/"
    cd microburst-detection
elif [ -f "pyproject.toml" ] && [ -d "src/microburst_detection" ]; then
    echo "${GREEN}✓${NC} Ya estás en el directorio del proyecto"
else
    echo "${RED}✗ Error:${NC} No se encontró el directorio del proyecto"
    echo "${YELLOW}Ejecuta este script desde el directorio que contiene 'microburst-detection/'${NC}"
    exit 1
fi

PROJECT_ROOT=$(pwd)
echo "${GREEN}✓${NC} Directorio del proyecto: ${PROJECT_ROOT}\n"

CREATED_COUNT=0

# Función para crear archivo con contenido
create_python_file() {
    local filepath=$1
    local content=$2
    
    if [ ! -f "$filepath" ]; then
        echo "$content" > "$filepath"
        echo "${GREEN}✓${NC} Creado: ${filepath}"
        ((CREATED_COUNT++))
    else
        echo "${YELLOW}⚠${NC} Ya existe: ${filepath}"
    fi
}

echo "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[1/8] Creando archivos __init__.py${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# __init__.py files
create_python_file "src/microburst_detection/__init__.py" '"""Amarr-Stormomon: Professional microburst detection system."""
__version__ = "1.0.0"
__author__ = "Aviation Safety Team"
'

create_python_file "src/microburst_detection/core/__init__.py" '"""Core detection algorithms and models."""
from .models import (
    LidarData,
    DopplerRadarData,
    AnemometerData,
    MicroburstDetection,
    SeverityLevel,
    DetectionMethod
)
from .detector import MicroburstDetector

__all__ = [
    "LidarData",
    "DopplerRadarData",
    "AnemometerData",
    "MicroburstDetection",
    "SeverityLevel",
    "DetectionMethod",
    "MicroburstDetector"
]
'

create_python_file "src/microburst_detection/sensors/__init__.py" '"""Sensor adapters for LIDAR, radar, and anemometer."""
'

create_python_file "src/microburst_detection/fusion/__init__.py" '"""Multi-sensor data fusion."""
from .data_fusion import SensorFusion

__all__ = ["SensorFusion"]
'

create_python_file "src/microburst_detection/api/__init__.py" '"""FastAPI server and routes."""
'

create_python_file "src/microburst_detection/utils/__init__.py" '"""Utility functions and configuration."""
from .config import Settings

__all__ = ["Settings"]
'

create_python_file "src/microburst_detection/cli/__init__.py" '"""Command-line interface."""
'

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[2/8] Creando adaptadores de sensores (stubs)${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Sensor adapters (stubs básicos)
create_python_file "src/microburst_detection/sensors/lidar.py" '# src/microburst_detection/sensors/lidar.py
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
'

create_python_file "src/microburst_detection/sensors/doppler_radar.py" '# src/microburst_detection/sensors/doppler_radar.py
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
'

create_python_file "src/microburst_detection/sensors/anemometer.py" '# src/microburst_detection/sensors/anemometer.py
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
'

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[3/8] Creando Kalman filter${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

create_python_file "src/microburst_detection/fusion/kalman_filter.py" '# src/microburst_detection/fusion/kalman_filter.py
"""Kalman filter implementation for sensor fusion."""

import numpy as np
from typing import Tuple


class KalmanFilter:
    """
    Standard Kalman filter for state estimation.
    
    State vector: [vertical_velocity, wind_shear]
    """
    
    def __init__(
        self,
        state_dim: int = 2,
        measurement_dim: int = 2,
        process_noise: float = 0.1,
        measurement_noise: float = 0.5
    ) -> None:
        """Initialize Kalman filter with dimensions and noise parameters."""
        self.state_dim = state_dim
        self.measurement_dim = measurement_dim
        
        # Initialize state and covariance
        self.x = np.zeros(state_dim)  # State vector
        self.P = np.eye(state_dim) * 10.0  # State covariance
        
        # Process noise covariance
        self.Q = np.eye(state_dim) * process_noise
        
        # Measurement noise covariance
        self.R = np.eye(measurement_dim) * measurement_noise
        
        # State transition matrix (constant velocity model)
        self.F = np.eye(state_dim)
        
        # Measurement matrix (direct observation)
        self.H = np.eye(measurement_dim)
    
    def predict(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prediction step.
        
        Returns:
            Tuple of (predicted_state, predicted_covariance)
        """
        # Predict state
        self.x = self.F @ self.x
        
        # Predict covariance
        self.P = self.F @ self.P @ self.F.T + self.Q
        
        return self.x, self.P
    
    def update(self, measurement: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Update step with new measurement.
        
        Args:
            measurement: Measurement vector
            
        Returns:
            Tuple of (updated_state, updated_covariance)
        """
        # Innovation (measurement residual)
        y = measurement - (self.H @ self.x)
        
        # Innovation covariance
        S = self.H @ self.P @ self.H.T + self.R
        
        # Kalman gain
        K = self.P @ self.H.T @ np.linalg.inv(S)
        
        # Update state
        self.x = self.x + K @ y
        
        # Update covariance
        I = np.eye(self.state_dim)
        self.P = (I - K @ self.H) @ self.P
        
        return self.x, self.P
    
    def reset(self) -> None:
        """Reset filter to initial state."""
        self.x = np.zeros(self.state_dim)
        self.P = np.eye(self.state_dim) * 10.0
'

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[4/8] Creando sistema de logging${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

create_python_file "src/microburst_detection/utils/logger.py" '# src/microburst_detection/utils/logger.py
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
    """
    Configure application logging.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for logging
        json_format: Use JSON format for logs
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger("microburst_detection")
    logger.setLevel(getattr(logging, level.upper()))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    if json_format:
        # JSON format for production
        formatter = logging.Formatter(
            "{\"time\": \"%(asctime)s\", \"level\": \"%(levelname)s\", "
            "\"module\": \"%(name)s\", \"message\": \"%(message)s\"}"
        )
    else:
        # Human-readable format for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler if specified
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger
'

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[5/8] Creando API routes${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

create_python_file "src/microburst_detection/api/routes.py" '# src/microburst_detection/api/routes.py
"""Additional API routes (if needed)."""

from fastapi import APIRouter

router = APIRouter()

# Additional routes can be added here
# These will be included in server.py with app.include_router(router)
'

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[6/8] Verificando archivos descargados${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Lista de archivos que el usuario debe haber descargado
DOWNLOAD_FILES=(
    "detector.py:src/microburst_detection/core/"
    "microburst_models.py:src/microburst_detection/core/models.py"
    "microburst_algorithms.py:src/microburst_detection/core/algorithms.py"
    "microburst_fastapi_server.py:src/microburst_detection/api/server.py"
    "schemas.py:src/microburst_detection/api/"
    "data_fusion.py:src/microburst_detection/fusion/"
    "config.py:src/microburst_detection/utils/"
    "microburst_cli.py:src/microburst_detection/cli/main.py"
)

echo "${MAGENTA}📥 Archivos que debes copiar manualmente:${NC}\n"

for item in "${DOWNLOAD_FILES[@]}"; do
    source_file="${item%%:*}"
    dest_path="${item#*:}"
    
    # Si dest_path termina en /, añadir el nombre del archivo
    if [[ "$dest_path" == */ ]]; then
        dest_path="${dest_path}${source_file}"
    fi
    
    if [ ! -f "$dest_path" ]; then
        echo "${YELLOW}⚠${NC} Falta: ${dest_path}"
        echo "   ${BLUE}→${NC} Copiar desde: ~/Downloads/${source_file}"
        echo "   ${BLUE}→${NC} Comando: cp ~/Downloads/${source_file} ${dest_path}"
        echo ""
    else
        echo "${GREEN}✓${NC} Presente: ${dest_path}"
    fi
done

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[7/8] Creando archivos de configuración faltantes${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Verificar pyproject.toml
if [ ! -f "pyproject.toml" ]; then
    echo "${YELLOW}⚠ pyproject.toml faltante - debería haber sido creado por setup_project.zsh${NC}"
fi

# Verificar .gitignore
if [ ! -f ".gitignore" ]; then
    echo "${YELLOW}⚠ .gitignore faltante - debería haber sido creado por setup_project.zsh${NC}"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[8/8] Resumen final${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

echo "${BLUE}📊 Archivos creados:${NC} ${GREEN}${CREATED_COUNT}${NC}"
echo "${BLUE}📂 Proyecto:${NC} ${PROJECT_ROOT}\n"

echo "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║              ✨ REPARACIÓN COMPLETADA ✨                  ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo "${CYAN}📝 Próximos pasos:${NC}"
echo "  1. ${BLUE}Copiar archivos descargados${NC} según la lista arriba"
echo "  2. ${BLUE}cd ${PROJECT_ROOT}${NC}"
echo "  3. ${BLUE}python3.11 -m venv venv${NC}"
echo "  4. ${BLUE}source venv/bin/activate${NC}"
echo "  5. ${BLUE}pip install -e \".[dev,ml,viz]\"${NC}"
echo "  6. ${BLUE}pytest tests/${NC}"
echo "  7. ${BLUE}microburst-detect server --reload${NC}\n"

echo "${YELLOW}💡 Tip:${NC} Ejecuta ${GREEN}./verify_structure.zsh${NC} de nuevo para verificar\n"
