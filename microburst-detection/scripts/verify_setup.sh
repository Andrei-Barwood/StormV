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
