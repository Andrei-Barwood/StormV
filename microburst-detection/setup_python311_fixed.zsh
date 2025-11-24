#!/usr/bin/env zsh
# setup_python311_fixed.zsh
# Script para instalar Python 3.11 con pyenv y preparar el entorno del proyecto
# Autor: Aviation Safety Team

set -e

echo "\n🌩️  AMARR-STORMOMON PYTHON 3.11+ SETUP SCRIPT (FIXED)\n"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paso 1: Verificar/Instalar pyenv
if ! command -v pyenv > /dev/null; then
    echo "${CYAN}🔧 Instalando pyenv vía Homebrew...${NC}"
    brew update
    brew install pyenv
else
    echo "${GREEN}✅ pyenv ya está instalado${NC}"
fi

# Paso 2: Configurar pyenv en el PATH actual
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Paso 3: Instalar Python 3.11.9 si no está disponible
PY311_VER="3.11.9"
if ! pyenv versions | grep -q "$PY311_VER"; then
    echo "${CYAN}🔧 Instalando Python $PY311_VER con pyenv...${NC}"
    pyenv install $PY311_VER
else
    echo "${GREEN}✅ Python $PY311_VER ya está instalado con pyenv${NC}"
fi

# Paso 4: Configurar Python 3.11 local para el proyecto
PROJECT_DIR="$PWD"
echo "${BLUE}🔗 Usando Python $PY311_VER en ${PROJECT_DIR}${NC}"
pyenv local $PY311_VER

# Paso 5: Verificar versión activa
echo "\n${CYAN}🔎 Versión activa de Python:${NC}"
python --version

# Paso 6: ELIMINAR venv viejo si existe
if [ -d "venv" ]; then
    echo "${YELLOW}⚠️  Detectado venv antiguo (Python 3.9.6)${NC}"
    echo "${CYAN}🗑️  Eliminando venv antiguo...${NC}"
    rm -rf venv
    echo "${GREEN}✓ venv antiguo eliminado${NC}"
fi

# Paso 7: Crear NUEVO entorno virtual con Python 3.11
echo "${CYAN}🔧 Creando NUEVO entorno virtual con Python $PY311_VER ...${NC}"
python -m venv venv
echo "${GREEN}✓ Nuevo venv creado con Python 3.11${NC}"

# Paso 8: Activar entorno virtual
echo "${BLUE}🔗 Activando venv...${NC}"
source venv/bin/activate

# Paso 9: Verificar que el venv usa Python 3.11
echo "\n${CYAN}🔎 Verificando Python en venv:${NC}"
python --version
which python

# Paso 10: Actualizar pip y setuptools
echo "\n${CYAN}📦 Actualizando pip, setuptools y wheel...${NC}"
pip install --upgrade pip setuptools wheel

# Paso 11: Instalar el paquete y dependencias extras
echo "\n${CYAN}📦 Instalando amarr-stormomon con dependencias...${NC}"
pip install -e ".[dev,ml,viz]"

# Paso 12: Verificar instalación
echo "\n${CYAN}🔬 Verificando importación del paquete:${NC}"
python -c "import microburst_detection; print(f'${GREEN}✅ Amarr-Stormomon v{microburst_detection.__version__} instalado correctamente${NC}')"

# Paso 13: Ver comandos CLI disponibles
echo "\n${CYAN}🎛️  Comandos CLI disponibles:${NC}"
microburst-detect --help

# Paso 14: Crear archivo .python-version para pyenv
echo "$PY311_VER" > .python-version
echo "${GREEN}✓ Creado .python-version${NC}"

echo "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║  ✅ INSTALACIÓN COMPLETADA CON ÉXITO                     ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo "${CYAN}📝 Para activar el entorno en futuras sesiones:${NC}"
echo "  ${BLUE}cd ${PROJECT_DIR}${NC}"
echo "  ${BLUE}source venv/bin/activate${NC}\n"

echo "${CYAN}🚀 Comandos disponibles:${NC}"
echo "  ${BLUE}microburst-detect server --reload${NC}  # Iniciar servidor API"
echo "  ${BLUE}microburst-detect --help${NC}            # Ver todos los comandos"
echo "  ${BLUE}pytest tests/ -v${NC}                    # Ejecutar tests\n"

echo "${GREEN}✨ Amarr-Stormomon está listo para usar ✨${NC}\n"
