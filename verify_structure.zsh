#!/usr/bin/env zsh
# verify_structure.zsh
# Script para verificar la estructura del proyecto y detectar archivos faltantes
# Autor: Aviation Safety Team
# Fecha: 2025-11-23

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║      AMARR-STORMOMON PROJECT STRUCTURE VERIFICATION     ║
║                  🌩️ Structure Inspector 🌩️               ║
╚══════════════════════════════════════════════════════════╝
EOF
echo "${NC}"

PROJECT_ROOT=$(pwd)
echo "${BLUE}📂 Analizando estructura en:${NC} ${GREEN}${PROJECT_ROOT}${NC}\n"

# Verificar si existe el comando tree
if command -v tree &> /dev/null; then
    HAS_TREE=true
    echo "${GREEN}✓${NC} Comando 'tree' disponible\n"
else
    HAS_TREE=false
    echo "${YELLOW}⚠${NC} Comando 'tree' no disponible, usando 'ls' recursivo\n"
fi

# Función para verificar archivos
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo "${GREEN}✓${NC} ${file} ${BLUE}(${description})${NC}"
        return 0
    else
        echo "${RED}✗${NC} ${file} ${YELLOW}FALTANTE${NC} - ${description}"
        return 1
    fi
}

# Función para verificar directorios
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo "${GREEN}✓${NC} ${dir}/ ${BLUE}(${description})${NC}"
        return 0
    else
        echo "${RED}✗${NC} ${dir}/ ${YELLOW}FALTANTE${NC} - ${description}"
        return 1
    fi
}

# Crear reporte de estructura
REPORT_FILE="STRUCTURE_REPORT_$(date +%Y%m%d_%H%M%S).txt"

echo "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[1/5] VISUALIZACIÓN COMPLETA DE LA ESTRUCTURA${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

if [ "$HAS_TREE" = true ]; then
    # Usar tree con colores y opciones completas
    tree -L 4 -I '__pycache__|*.pyc|.pytest_cache|.git|venv|node_modules' --dirsfirst -F
    
    # Guardar en archivo
    tree -L 4 -I '__pycache__|*.pyc|.pytest_cache|.git|venv|node_modules' --dirsfirst > "$REPORT_FILE"
else
    # Usar ls recursivo como fallback
    find . -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/__pycache__/*" \
         -not -path "*.pyc" -type d -o -type f | sort | sed 's|^\./||' | head -n 200
    
    # Guardar en archivo
    find . -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/__pycache__/*" \
         -not -path "*.pyc" | sort > "$REPORT_FILE"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[2/5] VERIFICACIÓN DE ARCHIVOS CRÍTICOS DEL CORE${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

MISSING_COUNT=0

# Core files
echo "${MAGENTA}📦 Core Package:${NC}"
check_file "src/microburst_detection/__init__.py" "Package root" || ((MISSING_COUNT++))
check_file "src/microburst_detection/core/__init__.py" "Core init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/core/models.py" "Pydantic models" || ((MISSING_COUNT++))
check_file "src/microburst_detection/core/algorithms.py" "Detection algorithms" || ((MISSING_COUNT++))
check_file "src/microburst_detection/core/detector.py" "Main detector" || ((MISSING_COUNT++))

echo "\n${MAGENTA}📡 Sensors Package:${NC}"
check_file "src/microburst_detection/sensors/__init__.py" "Sensors init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/sensors/lidar.py" "LIDAR adapter" || ((MISSING_COUNT++))
check_file "src/microburst_detection/sensors/doppler_radar.py" "Radar adapter" || ((MISSING_COUNT++))
check_file "src/microburst_detection/sensors/anemometer.py" "Anemometer adapter" || ((MISSING_COUNT++))

echo "\n${MAGENTA}🔗 Fusion Package:${NC}"
check_file "src/microburst_detection/fusion/__init__.py" "Fusion init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/fusion/kalman_filter.py" "Kalman filter" || ((MISSING_COUNT++))
check_file "src/microburst_detection/fusion/data_fusion.py" "Data fusion" || ((MISSING_COUNT++))

echo "\n${MAGENTA}🌐 API Package:${NC}"
check_file "src/microburst_detection/api/__init__.py" "API init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/api/server.py" "FastAPI server" || ((MISSING_COUNT++))
check_file "src/microburst_detection/api/routes.py" "API routes" || ((MISSING_COUNT++))
check_file "src/microburst_detection/api/schemas.py" "API schemas" || ((MISSING_COUNT++))

echo "\n${MAGENTA}⚙️  Utils Package:${NC}"
check_file "src/microburst_detection/utils/__init__.py" "Utils init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/utils/config.py" "Configuration" || ((MISSING_COUNT++))
check_file "src/microburst_detection/utils/logger.py" "Logging setup" || ((MISSING_COUNT++))

echo "\n${MAGENTA}💻 CLI Package:${NC}"
check_file "src/microburst_detection/cli/__init__.py" "CLI init" || ((MISSING_COUNT++))
check_file "src/microburst_detection/cli/main.py" "CLI main" || ((MISSING_COUNT++))

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[3/5] VERIFICACIÓN DE ARCHIVOS DE CONFIGURACIÓN${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

echo "${MAGENTA}⚙️  Configuration Files:${NC}"
check_file "pyproject.toml" "Project config" || ((MISSING_COUNT++))
check_file ".gitignore" "Git ignore rules" || ((MISSING_COUNT++))
check_file ".env.example" "Environment template" || ((MISSING_COUNT++))
check_file "Dockerfile" "Docker image" || ((MISSING_COUNT++))
check_file "docker-compose.yml" "Docker compose" || ((MISSING_COUNT++))
check_file "Makefile" "Make commands" || ((MISSING_COUNT++))
check_file "README.md" "Documentation" || ((MISSING_COUNT++))

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[4/5] VERIFICACIÓN DE DIRECTORIOS${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

echo "${MAGENTA}📁 Essential Directories:${NC}"
check_dir "src/microburst_detection" "Source code" || ((MISSING_COUNT++))
check_dir "tests" "Test suite" || ((MISSING_COUNT++))
check_dir "web_interface" "Web dashboard" || ((MISSING_COUNT++))
check_dir "docs" "Documentation" || ((MISSING_COUNT++))
check_dir "data/samples" "Sample data" || ((MISSING_COUNT++))
check_dir "scripts" "Utility scripts" || ((MISSING_COUNT++))
check_dir "deployment" "Deployment configs" || ((MISSING_COUNT++))

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}[5/5] ANÁLISIS DE CONTENIDO DE ARCHIVOS${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Función para contar líneas y mostrar info del archivo
analyze_file() {
    local file=$1
    if [ -f "$file" ]; then
        local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "0")
        echo "  📄 ${file}: ${lines} líneas, ${size}"
    fi
}

echo "${MAGENTA}📊 Python Source Files:${NC}"
for file in src/microburst_detection/**/*.py(N); do
    analyze_file "$file"
done

echo "\n${MAGENTA}🧪 Test Files:${NC}"
for file in tests/**/*.py(N); do
    analyze_file "$file"
done

echo "\n${MAGENTA}🌐 Web Files:${NC}"
for file in web_interface/**/*.{html,css,js}(N); do
    analyze_file "$file"
done

# Resumen final
echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}                    RESUMEN FINAL                      ${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Estadísticas
TOTAL_PY_FILES=$(find src -name "*.py" 2>/dev/null | wc -l)
TOTAL_TEST_FILES=$(find tests -name "*.py" 2>/dev/null | wc -l)
TOTAL_DIRS=$(find . -type d -not -path "*/\.*" -not -path "*/venv/*" 2>/dev/null | wc -l)
TOTAL_FILES=$(find . -type f -not -path "*/\.*" -not -path "*/venv/*" 2>/dev/null | wc -l)

echo "${BLUE}📊 Estadísticas del Proyecto:${NC}"
echo "  Total de directorios: ${GREEN}${TOTAL_DIRS}${NC}"
echo "  Total de archivos: ${GREEN}${TOTAL_FILES}${NC}"
echo "  Archivos Python (src): ${GREEN}${TOTAL_PY_FILES}${NC}"
echo "  Archivos de test: ${GREEN}${TOTAL_TEST_FILES}${NC}"

if [ $MISSING_COUNT -eq 0 ]; then
    echo "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo "${GREEN}║  ✨ ESTRUCTURA COMPLETA - TODOS LOS ARCHIVOS PRESENTES ✨ ║${NC}"
    echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
else
    echo "\n${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo "${YELLOW}║     ⚠️  ARCHIVOS FALTANTES: ${MISSING_COUNT} archivo(s)              ║${NC}"
    echo "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
    
    echo "\n${CYAN}💡 Para crear los archivos faltantes:${NC}"
    echo "  1. Revisa los archivos marcados con ${RED}✗${NC} arriba"
    echo "  2. Cópialos manualmente desde tus descargas"
    echo "  3. O ejecuta: ${GREEN}touch <ruta_del_archivo>${NC}"
fi

echo "\n${BLUE}📋 Reporte guardado en:${NC} ${GREEN}${REPORT_FILE}${NC}"

# Crear lista de archivos faltantes
if [ $MISSING_COUNT -gt 0 ]; then
    MISSING_FILE="MISSING_FILES_$(date +%Y%m%d_%H%M%S).txt"
    echo "${BLUE}📝 Generando lista de archivos faltantes...${NC}"
    
    cat > "$MISSING_FILE" << EOF
# Archivos Faltantes en Amarr-Stormomon
# Generado: $(date)
# Total: ${MISSING_COUNT} archivo(s)

## Archivos Core
EOF
    
    # Verificar cada archivo y agregar a la lista si falta
    [ ! -f "src/microburst_detection/core/models.py" ] && echo "src/microburst_detection/core/models.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/core/algorithms.py" ] && echo "src/microburst_detection/core/algorithms.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/core/detector.py" ] && echo "src/microburst_detection/core/detector.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/api/server.py" ] && echo "src/microburst_detection/api/server.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/api/schemas.py" ] && echo "src/microburst_detection/api/schemas.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/fusion/data_fusion.py" ] && echo "src/microburst_detection/fusion/data_fusion.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/utils/config.py" ] && echo "src/microburst_detection/utils/config.py" >> "$MISSING_FILE"
    [ ! -f "src/microburst_detection/cli/main.py" ] && echo "src/microburst_detection/cli/main.py" >> "$MISSING_FILE"
    
    echo "${GREEN}✓${NC} Lista guardada en: ${GREEN}${MISSING_FILE}${NC}"
fi

echo "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo "${CYAN}       Amarr-Stormomon Structure Verification Complete${NC}"
echo "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Opcional: Abrir el reporte si se solicita
if [ "$1" = "--open" ]; then
    echo "${BLUE}📖 Abriendo reporte...${NC}"
    if command -v code &> /dev/null; then
        code "$REPORT_FILE"
    elif command -v less &> /dev/null; then
        less "$REPORT_FILE"
    else
        cat "$REPORT_FILE"
    fi
fi
