#!/usr/bin/env zsh
# setup_project.zsh
# Script para crear la estructura completa del proyecto Microburst Detection System
# Autor: Aviation Safety Team
# Fecha: 2025-11-23

set -e  # Detener ejecución si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║   MICROBURST DETECTION SYSTEM - PROJECT SETUP           ║
║   Professional Aviation Safety Solution                 ║
╚══════════════════════════════════════════════════════════╝
EOF
echo "${NC}"

# Verificar que estamos en el directorio correcto
PROJECT_NAME="microburst-detection"
echo "${BLUE}[1/6]${NC} Configurando proyecto: ${GREEN}${PROJECT_NAME}${NC}"

# Crear directorio raíz si no existe
if [ ! -d "$PROJECT_NAME" ]; then
    mkdir -p "$PROJECT_NAME"
    echo "${GREEN}✓${NC} Directorio raíz creado: ${PROJECT_NAME}/"
else
    echo "${YELLOW}⚠${NC} Directorio ${PROJECT_NAME}/ ya existe"
fi

cd "$PROJECT_NAME"

# Estructura de directorios principal
echo "\n${BLUE}[2/6]${NC} Creando estructura de directorios..."

# Array de directorios a crear
directories=(
    # Código fuente
    "src/microburst_detection"
    "src/microburst_detection/core"
    "src/microburst_detection/sensors"
    "src/microburst_detection/fusion"
    "src/microburst_detection/api"
    "src/microburst_detection/utils"
    "src/microburst_detection/cli"
    
    # Tests
    "tests"
    "tests/core"
    "tests/sensors"
    "tests/fusion"
    "tests/api"
    "tests/fixtures"
    
    # Web interface
    "web_interface"
    "web_interface/assets"
    "web_interface/assets/js"
    "web_interface/assets/css"
    "web_interface/assets/img"
    
    # Documentación
    "docs"
    "docs/api"
    "docs/guides"
    "docs/examples"
    "docs/architecture"
    
    # Deployment
    "deployment"
    "deployment/docker"
    "deployment/kubernetes"
    "deployment/terraform"
    
    # Data y configuración
    "data"
    "data/samples"
    "data/test_data"
    "config"
    
    # Scripts auxiliares
    "scripts"
    "scripts/data_generation"
    "scripts/deployment"
    
    # Logs y output
    "logs"
    "output"
)

# Crear cada directorio
for dir in "${directories[@]}"; do
    if mkdir -p "$dir" 2>/dev/null; then
        echo "${GREEN}✓${NC} Creado: ${dir}"
    else
        echo "${YELLOW}⚠${NC} Ya existe: ${dir}"
    fi
done

# Crear archivos __init__.py para paquetes Python
echo "\n${BLUE}[3/6]${NC} Creando archivos __init__.py..."

init_files=(
    "src/microburst_detection/__init__.py"
    "src/microburst_detection/core/__init__.py"
    "src/microburst_detection/sensors/__init__.py"
    "src/microburst_detection/fusion/__init__.py"
    "src/microburst_detection/api/__init__.py"
    "src/microburst_detection/utils/__init__.py"
    "src/microburst_detection/cli/__init__.py"
    "tests/__init__.py"
    "tests/core/__init__.py"
    "tests/sensors/__init__.py"
    "tests/fusion/__init__.py"
    "tests/api/__init__.py"
)

for init_file in "${init_files[@]}"; do
    if [ ! -f "$init_file" ]; then
        cat > "$init_file" << 'INIT_EOF'
"""Package initialization."""
__version__ = "1.0.0"
INIT_EOF
        echo "${GREEN}✓${NC} Creado: ${init_file}"
    else
        echo "${YELLOW}⚠${NC} Ya existe: ${init_file}"
    fi
done

# Crear archivos de configuración base
echo "\n${BLUE}[4/6]${NC} Creando archivos de configuración..."

# .gitignore
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'GITIGNORE_EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
venv/
ENV/
env/
.venv

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.hypothesis/

# Logs
logs/
*.log

# Environment variables
.env
.env.local

# Data files
data/*.csv
data/*.json
!data/samples/*.json

# Output
output/
*.pkl
*.h5

# Documentation builds
docs/_build/
docs/.doctrees/

# Database
*.db
*.sqlite3

# Docker
.dockerignore
GITIGNORE_EOF
    echo "${GREEN}✓${NC} Creado: .gitignore"
fi

# .env.example
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'ENV_EOF'
# Environment Configuration
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API Configuration
API_TITLE=Microburst Detection System
API_VERSION=1.0.0
SERVER_HOST=0.0.0.0
SERVER_PORT=8000

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Detection Thresholds
WIND_SHEAR_THRESHOLD_MS=3.0
REFLECTIVITY_THRESHOLD_DBZ=40.0
CONFIDENCE_THRESHOLD=0.75

# Database (optional)
DATABASE_URL=sqlite:///./microburst.db

# Monitoring (optional)
SENTRY_DSN=
PROMETHEUS_PORT=9090
ENV_EOF
    echo "${GREEN}✓${NC} Creado: .env.example"
fi

# Dockerfile
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim

LABEL maintainer="team@microburstdetection.com"
LABEL description="Microburst Detection System - Aviation Safety"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libhdf5-dev \
    netcdf-bin \
    libnetcdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY pyproject.toml .
COPY README.md .
COPY src/ ./src/

# Install Python dependencies
RUN pip install --no-cache-dir -e ".[prod]"

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 mbuser && chown -R mbuser:mbuser /app
USER mbuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["microburst-detect", "server", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
DOCKER_EOF
    echo "${GREEN}✓${NC} Creado: Dockerfile"
fi

# docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  api:
    build: .
    container_name: microburst-api
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
      - WORKERS=4
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    networks:
      - microburst-network

  prometheus:
    image: prom/prometheus:latest
    container_name: microburst-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./deployment/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - microburst-network

  grafana:
    image: grafana/grafana:latest
    container_name: microburst-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - microburst-network

volumes:
  prometheus-data:
  grafana-data:

networks:
  microburst-network:
    driver: bridge
COMPOSE_EOF
    echo "${GREEN}✓${NC} Creado: docker-compose.yml"
fi

# Makefile
if [ ! -f "Makefile" ]; then
    cat > Makefile << 'MAKEFILE_EOF'
.PHONY: help install dev test lint format clean docker-build docker-run

help:
	@echo "Microburst Detection System - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  install       - Install production dependencies"
	@echo "  dev           - Install development dependencies"
	@echo "  test          - Run test suite"
	@echo "  lint          - Run linters (ruff, mypy)"
	@echo "  format        - Format code with black"
	@echo "  clean         - Remove build artifacts"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  serve         - Start development server"

install:
	pip install -e .

dev:
	pip install -e ".[dev,ml,viz]"

test:
	pytest tests/ -v --cov=src/microburst_detection --cov-report=html

lint:
	ruff check src/ tests/
	mypy src/

format:
	black src/ tests/
	ruff check --fix src/ tests/

clean:
	rm -rf build/ dist/ *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache/ .coverage htmlcov/

docker-build:
	docker build -t microburst-detection:latest .

docker-run:
	docker run -p 8000:8000 microburst-detection:latest

serve:
	microburst-detect server --reload --port 8000
MAKEFILE_EOF
    echo "${GREEN}✓${NC} Creado: Makefile"
fi

# README.md básico
if [ ! -f "README.md" ]; then
    cat > README.md << 'README_EOF'
# Microburst Detection System

Professional aviation safety solution for detecting microbursts using LIDAR, Doppler radar, and multi-sensor fusion.

## Quick Start

```bash
# Install
pip install -e ".[dev]"

# Run tests
pytest tests/

# Start server
microburst-detect server --reload
```

See [docs/](docs/) for full documentation.
README_EOF
    echo "${GREEN}✓${NC} Creado: README.md"
fi

# Crear archivo de ejemplo de datos
echo "\n${BLUE}[5/6]${NC} Creando archivos de ejemplo..."

if [ ! -f "data/samples/lidar_sample.json" ]; then
    cat > data/samples/lidar_sample.json << 'JSON_EOF'
{
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 1500.0,
  "vertical_velocity": -8.5,
  "backscatter": 0.45,
  "range_resolution": 30.0
}
JSON_EOF
    echo "${GREEN}✓${NC} Creado: data/samples/lidar_sample.json"
fi

if [ ! -f "data/samples/radar_sample.json" ]; then
    cat > data/samples/radar_sample.json << 'JSON_EOF'
{
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 1200.0,
  "reflectivity": 65.2,
  "radial_velocity": -12.5,
  "spectrum_width": 3.2
}
JSON_EOF
    echo "${GREEN}✓${NC} Creado: data/samples/radar_sample.json"
fi

# Crear script de verificación
if [ ! -f "scripts/verify_setup.sh" ]; then
    cat > scripts/verify_setup.sh << 'VERIFY_EOF'
#!/bin/bash
# Script para verificar la instalación

echo "Verificando instalación..."

# Verificar Python
python --version || { echo "Python no encontrado"; exit 1; }

# Verificar paquete instalado
python -c "import microburst_detection" 2>/dev/null && \
    echo "✓ Paquete instalado correctamente" || \
    echo "⚠ Paquete no instalado. Ejecuta: pip install -e ."

# Verificar dependencias
python -c "import fastapi, pydantic, numpy" 2>/dev/null && \
    echo "✓ Dependencias principales instaladas" || \
    echo "⚠ Faltan dependencias. Ejecuta: pip install -e .[dev]"

echo "Verificación completa."
VERIFY_EOF
    chmod +x scripts/verify_setup.sh
    echo "${GREEN}✓${NC} Creado: scripts/verify_setup.sh"
fi

# Resumen final
echo "\n${BLUE}[6/6]${NC} Generando resumen..."

# Contar archivos y directorios
total_dirs=$(find . -type d | wc -l)
total_files=$(find . -type f | wc -l)

echo "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║            PROYECTO CREADO EXITOSAMENTE                  ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

echo "\n${CYAN}Estructura del Proyecto:${NC}"
echo "  ${YELLOW}●${NC} Directorios creados: ${total_dirs}"
echo "  ${YELLOW}●${NC} Archivos creados: ${total_files}"

echo "\n${CYAN}Próximos pasos:${NC}"
echo "  1. ${GREEN}cd ${PROJECT_NAME}${NC}"
echo "  2. ${GREEN}cp .env.example .env${NC}  ${YELLOW}# Opcional: ajustar configuración${NC}"
echo "  3. ${GREEN}python3.11 -m venv venv${NC}"
echo "  4. ${GREEN}source venv/bin/activate${NC}  ${YELLOW}# En Windows: venv\\Scripts\\activate${NC}"
echo "  5. ${GREEN}pip install -e \".[dev,ml,viz]\"${NC}"
echo "  6. ${GREEN}./scripts/verify_setup.sh${NC}  ${YELLOW}# Verificar instalación${NC}"
echo "  7. ${GREEN}pytest tests/${NC}  ${YELLOW}# Ejecutar tests${NC}"
echo "  8. ${GREEN}microburst-detect server --reload${NC}  ${YELLOW}# Iniciar servidor${NC}"

echo "\n${CYAN}Documentación:${NC}"
echo "  • README: ${BLUE}README.md${NC}"
echo "  • API: ${BLUE}http://localhost:8000/api/docs${NC}"
echo "  • Dashboard: ${BLUE}http://localhost:8000/web${NC}"

echo "\n${CYAN}Scripts útiles:${NC}"
echo "  • Verificar setup: ${BLUE}./scripts/verify_setup.sh${NC}"
echo "  • Makefile: ${BLUE}make help${NC}"

echo "\n${GREEN}✨ Proyecto listo para desarrollo ✨${NC}\n"

# Crear archivo de resumen
cat > PROJECT_STRUCTURE.txt << 'STRUCTURE_EOF'
microburst-detection/
├── src/
│   └── microburst_detection/
│       ├── __init__.py
│       ├── core/                    # Algoritmos de detección
│       │   ├── __init__.py
│       │   ├── detector.py
│       │   ├── algorithms.py
│       │   └── models.py
│       ├── sensors/                 # Adaptadores de sensores
│       │   ├── __init__.py
│       │   ├── lidar.py
│       │   ├── doppler_radar.py
│       │   └── anemometer.py
│       ├── fusion/                  # Fusión multi-sensor
│       │   ├── __init__.py
│       │   ├── kalman_filter.py
│       │   └── data_fusion.py
│       ├── api/                     # FastAPI server
│       │   ├── __init__.py
│       │   ├── server.py
│       │   ├── routes.py
│       │   └── schemas.py
│       ├── utils/                   # Utilidades
│       │   ├── __init__.py
│       │   ├── logger.py
│       │   └── config.py
│       └── cli/                     # Command-line interface
│           ├── __init__.py
│           └── main.py
├── tests/                           # Test suite
│   ├── __init__.py
│   ├── core/
│   ├── sensors/
│   ├── fusion/
│   ├── api/
│   └── fixtures/
├── web_interface/                   # Dashboard web
│   ├── index.html
│   ├── assets/
│   │   ├── js/
│   │   ├── css/
│   │   └── img/
├── docs/                            # Documentación
│   ├── api/
│   ├── guides/
│   ├── examples/
│   └── architecture/
├── deployment/                      # Deployment configs
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── data/                            # Datos de muestra
│   ├── samples/
│   └── test_data/
├── config/                          # Configuraciones
├── scripts/                         # Scripts auxiliares
│   ├── data_generation/
│   └── deployment/
├── logs/                            # Logs del sistema
├── output/                          # Salidas generadas
├── pyproject.toml                   # Configuración del proyecto
├── Dockerfile                       # Docker image
├── docker-compose.yml               # Multi-container setup
├── Makefile                         # Comandos útiles
├── .gitignore                       # Git ignore rules
├── .env.example                     # Variables de entorno
└── README.md                        # Documentación principal
STRUCTURE_EOF

echo "${GREEN}✓${NC} Archivo de estructura creado: ${BLUE}PROJECT_STRUCTURE.txt${NC}"
