#!/usr/bin/env zsh
# setup_python311_log.zsh
# Script para instalar Python 3.11 con pyenv y preparar el entorno del proyecto
# Produce un log de toda la sesión

set -e

LOGFILE="setup_python311_install_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "\n🌩️  AMARR-STORMOMON PYTHON 3.11+ SETUP SCRIPT WITH LOGGING\n"
echo "📝 Guardando log de ejecución en: $LOGFILE"
echo "-------------------------------------------------------------------"

# Paso 1: Verificar/Instalar pyenv
if ! command -v pyenv > /dev/null; then
    echo "\n🔧 Instalando pyenv vía Homebrew..."
    brew update
    brew install pyenv
else
    echo "✅ pyenv ya está instalado"
fi

# Paso 2: Configurar pyenv en el PATH actual
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Paso 3: Instalar Python 3.11.9 si no está disponible
PY311_VER="3.11.9"
if ! pyenv versions | grep -q "$PY311_VER"; then
    echo "\n🔧 Instalando Python $PY311_VER con pyenv..."
    pyenv install $PY311_VER
else
    echo "✅ Python $PY311_VER ya está instalado con pyenv"
fi

# Paso 4: Configurar Python 3.11 local para el proyecto
PROJECT_DIR="$PWD"
echo "🔗 Usando Python $PY311_VER en ${PROJECT_DIR}"
pyenv local $PY311_VER

# Paso 5: Verificar versión activa
echo "\n🔎 Versión activa de Python:"
python --version

# Paso 6: ELIMINAR venv viejo si existe
if [ -d "venv" ]; then
    echo "⚠️  Detectado venv antiguo"
    echo "🗑️  Eliminando venv antiguo..."
    rm -rf venv
    echo "✓ venv antiguo eliminado"
fi

# Paso 7: Crear NUEVO entorno virtual con Python 3.11
echo "🔧 Creando NUEVO entorno virtual con Python $PY311_VER ..."
python -m venv venv
echo "✓ Nuevo venv creado con Python 3.11"

# Paso 8: Activar entorno virtual
echo "🔗 Activando venv..."
source venv/bin/activate

# Paso 9: Verificar que el venv usa Python 3.11
echo "\n🔎 Verificando Python en venv:"
python --version
which python

# Paso 10: Actualizar pip y setuptools
echo "\n📦 Actualizando pip, setuptools y wheel..."
pip install --upgrade pip setuptools wheel

# Paso 11: Instalar el paquete y dependencias extras
echo "\n📦 Instalando amarr-stormomon con dependencias..."
pip install -e ".[dev,ml,viz]"

# Paso 12: Verificar instalación
echo "\n🔬 Verificando importación del paquete:"
python -c "import microburst_detection; print(f'✅ Amarr-Stormomon v{microburst_detection.__version__} instalado correctamente')"

# Paso 13: Ver comandos CLI disponibles
echo "\n🎛️  Comandos CLI disponibles:"
microburst-detect --help

# Paso 14: Crear archivo .python-version para pyenv
echo "$PY311_VER" > .python-version
echo "✓ Creado .python-version"

echo "\n✅ INSTALACIÓN COMPLETADA"
echo "📝 Revisa el log en: $LOGFILE"
echo "-------------------------------------------------------------------"
echo "Para activar el entorno en futuras sesiones:"
echo "  cd $PROJECT_DIR"
echo "  source venv/bin/activate"
echo "-------------------------------------------------------------------"

