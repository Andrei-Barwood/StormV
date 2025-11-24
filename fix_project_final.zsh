#!/usr/bin/env zsh
# fix_project_final.zsh
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
MAGENTA='\033[0;35m'
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

echo "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[1/6] Creando adaptadores de sensores${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# LIDAR adapter
if [ ! -f "src/microburst_detection/sensors/lidar.py" ]; then
cat > "src/microburst_detection/sensors/lidar.py" << 'LIDAR_END'
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
        raise NotImplementedError("Connect to actual LIDAR hardware")
    
    async def start_stream(self) -> None:
        """Start continuous LIDAR data stream."""
        raise NotImplementedError("Implement streaming logic")
LIDAR_END
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/sensors/lidar.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/sensors/lidar.py"
fi

# Doppler radar adapter
if [ ! -f "src/microburst_detection/sensors/doppler_radar.py" ]; then
cat > "src/microburst_detection/sensors/doppler_radar.py" << 'RADAR_END'
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
RADAR_END
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/sensors/doppler_radar.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/sensors/doppler_radar.py"
fi

# Anemometer adapter
if [ ! -f "src/microburst_detection/sensors/anemometer.py" ]; then
cat > "src/microburst_detection/sensors/anemometer.py" << 'ANEM_END'
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
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/sensors/anemometer.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/sensors/anemometer.py"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[2/6] Creando Kalman filter${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

if [ ! -f "src/microburst_detection/fusion/kalman_filter.py" ]; then
cat > "src/microburst_detection/fusion/kalman_filter.py" << 'KALMAN_END'
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
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/fusion/kalman_filter.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/fusion/kalman_filter.py"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[3/6] Creando sistema de logging${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

if [ ! -f "src/microburst_detection/utils/logger.py" ]; then
cat > "src/microburst_detection/utils/logger.py" << 'LOGGER_END'
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
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/utils/logger.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/utils/logger.py"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[4/6] Creando API routes${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

if [ ! -f "src/microburst_detection/api/routes.py" ]; then
cat > "src/microburst_detection/api/routes.py" << 'ROUTES_END'
"""Additional API routes."""

from fastapi import APIRouter

router = APIRouter()
ROUTES_END
    echo "${GREEN}✓${NC} Creado: src/microburst_detection/api/routes.py"
    ((CREATED_COUNT++))
else
    echo "${YELLOW}⚠${NC} Ya existe: src/microburst_detection/api/routes.py"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[5/6] Verificando archivos descargados${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

MISSING_COUNT=0

echo "${MAGENTA}📥 Archivos que debes copiar manualmente:${NC}\n"

check_downloaded_file() {
    local source=$1
    local dest=$2
    
    if [ ! -f "$dest" ]; then
        echo "${YELLOW}⚠ FALTA:${NC} ${dest}"
        echo "   ${BLUE}→ Copiar desde:${NC} ~/Downloads/${source}"
        echo "   ${BLUE}→ Comando:${NC} cp ~/Downloads/${source} ${dest}"
        echo ""
        ((MISSING_COUNT++))
    else
        echo "${GREEN}✓ Presente:${NC} ${dest}"
    fi
}

check_downloaded_file "detector.py" "src/microburst_detection/core/detector.py"
check_downloaded_file "microburst_models.py" "src/microburst_detection/core/models.py"
check_downloaded_file "microburst_algorithms.py" "src/microburst_detection/core/algorithms.py"
check_downloaded_file "microburst_fastapi_server.py" "src/microburst_detection/api/server.py"
check_downloaded_file "schemas.py" "src/microburst_detection/api/schemas.py"
check_downloaded_file "data_fusion.py" "src/microburst_detection/fusion/data_fusion.py"
check_downloaded_file "config.py" "src/microburst_detection/utils/config.py"
check_downloaded_file "microburst_cli.py" "src/microburst_detection/cli/main.py"

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[6/6] Resumen final${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

echo "${BLUE}📊 Archivos creados por el script:${NC} ${GREEN}${CREATED_COUNT}${NC}"
echo "${BLUE}📥 Archivos faltantes para copiar:${NC} ${YELLOW}${MISSING_COUNT}${NC}"
echo "${BLUE}📂 Proyecto:${NC} ${PROJECT_ROOT}\n"

if [ $MISSING_COUNT -eq 0 ]; then
    echo "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo "${GREEN}║       ✨ TODOS LOS ARCHIVOS PRESENTES ✨                 ║${NC}"
    echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"
else
    echo "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo "${YELLOW}║  ⚠️  FALTAN ${MISSING_COUNT} ARCHIVOS - Ver lista arriba           ║${NC}"
    echo "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}\n"
fi

echo "${CYAN}📝 Próximos pasos:${NC}"
echo "  1. ${BLUE}Copiar archivos faltantes${NC} (ver comandos arriba)"
echo "  2. ${BLUE}python3.11 -m venv venv${NC}"
echo "  3. ${BLUE}source venv/bin/activate${NC}"
echo "  4. ${BLUE}pip install -e \".[dev,ml,viz]\"${NC}"
echo "  5. ${BLUE}pytest tests/${NC}"
echo "  6. ${BLUE}microburst-detect server --reload${NC}\n"

echo "${YELLOW}💡 Tip:${NC} Ejecuta ${GREEN}../verify_structure.zsh${NC} para verificar estructura completa\n"
