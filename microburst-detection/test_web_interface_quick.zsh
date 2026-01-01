#!/usr/bin/env zsh
# Script rápido para test de interfaz web (sin abrir navegador)
# Uso: ./test_web_interface_quick.zsh

set -e

API_URL="http://localhost:8000"
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "${CYAN}=== Test Rápido de Interfaz Web ===${NC}\n"

# Verificar que el servidor esté corriendo
echo "Verificando servidor backend..."
if curl -s -f "${API_URL}/health" >/dev/null 2>&1; then
    echo "${GREEN}✓${NC} Servidor backend respondiendo"
else
    echo "${RED}✗${NC} Servidor backend no está corriendo"
    echo "Inicia el servidor con: microburst-detect server --reload"
    exit 1
fi

# Tests básicos
echo "\nEjecutando tests de endpoints..."

# Health
if curl -s "${API_URL}/health" | grep -q "operational"; then
    echo "${GREEN}✓${NC} /health"
else
    echo "${RED}✗${NC} /health"
fi

# Detections
if curl -s -f "${API_URL}/detections?hours=24" >/dev/null 2>&1; then
    echo "${GREEN}✓${NC} /detections"
else
    echo "${RED}✗${NC} /detections"
fi

# Stats
if curl -s -f "${API_URL}/stats?days=7" >/dev/null 2>&1; then
    echo "${GREEN}✓${NC} /stats"
else
    echo "${RED}✗${NC} /stats"
fi

# Verificar archivos de interfaz
echo "\nVerificando archivos de interfaz..."
if [ -f "web_interface/index.html" ]; then
    echo "${GREEN}✓${NC} index.html existe"
else
    echo "${RED}✗${NC} index.html no encontrado"
fi

if [ -f "web_interface/app.js" ]; then
    echo "${GREEN}✓${NC} app.js existe"
else
    echo "${RED}✗${NC} app.js no encontrado"
fi

if [ -f "web_interface/style.css" ]; then
    echo "${GREEN}✓${NC} style.css existe"
else
    echo "${RED}✗${NC} style.css no encontrado"
fi

echo "\n${CYAN}Para abrir la interfaz:${NC}"
echo "cd web_interface && python3 -m http.server 8080"
echo "Luego abre: http://localhost:8080"

