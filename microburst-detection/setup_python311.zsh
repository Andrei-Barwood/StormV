#!/usr/bin/env zsh
# setup_python311.zsh
# Script para instalar Python 3.11 con pyenv y preparar el entorno del proyecto
# Autor: Aviation Safety Team

set -e

echo "\n🌩️  AMARR-STORMOMON PYTHON 3.11+ SETUP SCRIPT\n"

# Paso 1: Instalar pyenv si no está instalado
if ! command -v pyenv > /dev/null; then
    echo "🔧 Instalando pyenv vía Homebrew..."
    brew update
    brew install pyenv
else
    echo "✅ pyenv ya está instalado"
fi

# Paso 2: Instalar Python 3.11.9 si no está disponible
PY311_VER="3.11.9"
if ! pyenv versions | grep -q "$PY311_VER"; then
    echo "🔧 Instalando Python $PY311_VER con pyenv..."
    pyenv install $PY311_VER
else
    echo "✅ Python $PY311_VER ya está instalado con pyenv"
fi

# Paso 3: Configurar Python 3.11 local para el proyecto
PROJECT_DIR="$PWD"
echo "🔗 Usando Python $PY311_VER en ${PROJECT_DIR}"
pyenv local $PY311_VER

# Paso 4: Configurar variables de entorno PATH para pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
if command -v pyenv-init > /dev/null; then
    eval "$(pyenv init -)"
    eval "$(pyenv virtualenv-init -)"
else
    echo "⚠️  pyenv-init no disponible, asegúrate de que pyenv esté correctamente instalado en tu shell."
fi

# Paso 5: Verificar versión activa
echo "\n🔎 Versión activa de Python:"
python --version

# Paso 6: Crear entorno virtual
if [ ! -d "venv" ]; then
    echo "🔧 Creando entorno virtual con Python $PY311_VER ..."
    python -m venv venv
else
    echo "✅ venv ya existe"
fi

# Paso 7: Activar entorno virtual
source venv/bin/activate
echo "🔗 venv activado"

# Paso 8: Actualizar pip y setuptools
pip install --upgrade pip setuptools wheel

# Paso 9: Instalar el paquete y dependencias extras
pip install -e ".[dev,ml,viz]"

# Paso 10: Verificar instalación
echo "\n🔬 Verificando importación del paquete:"
python -c "import microburst_detection; print(f'✅ Amarr-Stormomon v{microburst_detection.__version__} instalado correctamente')"

# Paso 11: Ver comandos CLI disponibles
echo "\n🎛️  Comandos CLI disponibles:"
microburst-detect --help || echo "⚠️  microburst-detect CLI no detectado (verifica pyproject.toml y main.py)"

# Paso 12: Verificar que el servidor puede iniciarse
echo "\n🛫 Prueba iniciar el servidor (debería abrir FastAPI):"
microburst-detect server --help || echo "⚠️  No se encontró servidor, verifica instalación."

echo "\n✅ Fin del setup. Listo para desarrollar 🚀"

