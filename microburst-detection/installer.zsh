# 1. Crear entorno virtual
python3 -m venv venv

# 2. Activar entorno
source venv/bin/activate

# 3. Actualizar pip
pip install --upgrade pip setuptools wheel

# 4. Instalar el paquete en modo desarrollo
pip install -e ".[dev,ml,viz]"

# 5. Verificar instalación
python -c "import microburst_detection; print(f'✅ Amarr-Stormomon v{microburst_detection.__version__} instalado correctamente')"

# 6. Ver comandos CLI disponibles
microburst-detect --help

# 7. Verificar que el servidor puede iniciarse
microburst-detect server --help

