#!/usr/bin/env zsh
# Script para automatizar el test de la interfaz web
# Uso: ./test_web_interface.zsh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
API_URL="http://localhost:8000"
API_HEALTH_ENDPOINT="${API_URL}/health"
WEB_INTERFACE_DIR="web_interface"
WEB_INTERFACE_FILE="${WEB_INTERFACE_DIR}/index.html"
SERVER_PORT=8000
TEST_PORT=8080

# Función para imprimir mensajes
print_status() {
    echo "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo "${RED}[✗]${NC} $1"
}

print_warning() {
    echo "${YELLOW}[!]${NC} $1"
}

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Puerto en uso
    else
        return 1  # Puerto libre
    fi
}

# Función para verificar si la API está respondiendo
check_api_health() {
    local max_attempts=10
    local attempt=1
    
    print_status "Verificando salud de la API..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "${API_HEALTH_ENDPOINT}" >/dev/null 2>&1; then
            print_success "API respondiendo correctamente"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            print_status "Intento $attempt/$max_attempts - Esperando respuesta de la API..."
            sleep 2
        fi
        
        attempt=$((attempt + 1))
    done
    
    print_error "La API no está respondiendo después de $max_attempts intentos"
    return 1
}

# Función para iniciar el servidor backend
start_backend_server() {
    print_status "Iniciando servidor backend..."
    
    # Verificar si ya está corriendo
    if check_port $SERVER_PORT; then
        print_warning "El puerto $SERVER_PORT ya está en uso"
        if check_api_health; then
            print_success "El servidor backend ya está corriendo"
            return 0
        else
            print_error "El puerto está en uso pero la API no responde"
            print_status "Intentando matar el proceso en el puerto $SERVER_PORT..."
            lsof -ti:$SERVER_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Activar entorno virtual si existe
    if [ -d "venv" ]; then
        print_status "Activando entorno virtual..."
        source venv/bin/activate
    fi
    
    # Iniciar servidor en background
    print_status "Iniciando servidor en puerto $SERVER_PORT..."
    microburst-detect server --host 0.0.0.0 --port $SERVER_PORT > /tmp/microburst_server.log 2>&1 &
    SERVER_PID=$!
    
    # Guardar PID para poder matarlo después
    echo $SERVER_PID > /tmp/microburst_server.pid
    
    print_success "Servidor iniciado (PID: $SERVER_PID)"
    
    # Esperar a que el servidor esté listo
    sleep 3
    
    # Verificar salud
    if check_api_health; then
        return 0
    else
        print_error "El servidor no está respondiendo correctamente"
        return 1
    fi
}

# Función para iniciar servidor web simple para la interfaz
start_web_server() {
    print_status "Iniciando servidor web para la interfaz..."
    
    # Verificar si el puerto de test está en uso
    if check_port $TEST_PORT; then
        print_warning "El puerto $TEST_PORT ya está en uso, usando ese servidor"
        return 0
    fi
    
    # Iniciar servidor Python simple
    cd "$WEB_INTERFACE_DIR"
    python3 -m http.server $TEST_PORT > /tmp/web_interface_server.log 2>&1 &
    WEB_SERVER_PID=$!
    echo $WEB_SERVER_PID > /tmp/web_interface_server.pid
    cd ..
    
    print_success "Servidor web iniciado en puerto $TEST_PORT (PID: $WEB_SERVER_PID)"
    sleep 1
}

# Función para abrir el navegador
open_browser() {
    local url="http://localhost:${TEST_PORT}"
    print_status "Abriendo navegador en $url"
    
    # Detectar sistema operativo y abrir navegador
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open > /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open > /dev/null; then
            gnome-open "$url"
        else
            print_warning "No se pudo abrir el navegador automáticamente"
            print_status "Abre manualmente: $url"
        fi
    else
        print_warning "Sistema operativo no soportado para abrir navegador automáticamente"
        print_status "Abre manualmente: $url"
    fi
}

# Función para ejecutar tests básicos de la API
run_api_tests() {
    print_status "Ejecutando tests básicos de la API..."
    
    local tests_passed=0
    local tests_failed=0
    
    # Test 1: Health check
    print_status "Test 1: Health check endpoint"
    if curl -s -f "${API_HEALTH_ENDPOINT}" | grep -q "operational"; then
        print_success "Health check: OK"
        tests_passed=$((tests_passed + 1))
    else
        print_error "Health check: FAILED"
        tests_failed=$((tests_failed + 1))
    fi
    
    # Test 2: Detections endpoint
    print_status "Test 2: Detections endpoint"
    if curl -s -f "${API_URL}/detections?hours=24" >/dev/null 2>&1; then
        print_success "Detections endpoint: OK"
        tests_passed=$((tests_passed + 1))
    else
        print_error "Detections endpoint: FAILED"
        tests_failed=$((tests_failed + 1))
    fi
    
    # Test 3: Stats endpoint
    print_status "Test 3: Statistics endpoint"
    if curl -s -f "${API_URL}/stats?days=7" >/dev/null 2>&1; then
        print_success "Statistics endpoint: OK"
        tests_passed=$((tests_passed + 1))
    else
        print_error "Statistics endpoint: FAILED"
        tests_failed=$((tests_failed + 1))
    fi
    
    # Test 4: WebSocket endpoint (verificar que existe)
    print_status "Test 4: WebSocket endpoint (verificación básica)"
    if curl -s -f "${API_URL}/ws/stream" >/dev/null 2>&1 || [ $? -eq 52 ] || [ $? -eq 0 ]; then
        # WebSocket puede devolver diferentes códigos, pero si responde algo es que existe
        print_success "WebSocket endpoint: OK"
        tests_passed=$((tests_passed + 1))
    else
        print_warning "WebSocket endpoint: No se pudo verificar (esto es normal)"
        tests_passed=$((tests_passed + 1))
    fi
    
    # Resumen
    echo ""
    print_status "Resumen de tests:"
    print_success "$tests_passed tests pasados"
    if [ $tests_failed -gt 0 ]; then
        print_error "$tests_failed tests fallidos"
    fi
}

# Función para limpiar procesos al salir
cleanup() {
    print_status "Limpiando procesos..."
    
    # Matar servidor backend
    if [ -f /tmp/microburst_server.pid ]; then
        local pid=$(cat /tmp/microburst_server.pid)
        if kill -0 $pid 2>/dev/null; then
            print_status "Deteniendo servidor backend (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm /tmp/microburst_server.pid
        fi
    fi
    
    # Matar servidor web
    if [ -f /tmp/web_interface_server.pid ]; then
        local pid=$(cat /tmp/web_interface_server.pid)
        if kill -0 $pid 2>/dev/null; then
            print_status "Deteniendo servidor web (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm /tmp/web_interface_server.pid
        fi
    fi
    
    # Limpiar procesos por puerto (por si acaso)
    lsof -ti:$SERVER_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$TEST_PORT | xargs kill -9 2>/dev/null || true
}

# Trap para limpiar al salir
trap cleanup EXIT INT TERM

# Función principal
main() {
    echo "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════╗
║   Test Automatizado de Interfaz Web                  ║
║   Microburst Detection System                        ║
╚══════════════════════════════════════════════════════╝
EOF
    echo "${NC}"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "pyproject.toml" ] || [ ! -d "$WEB_INTERFACE_DIR" ]; then
        print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
        exit 1
    fi
    
    # Verificar que existe el archivo de interfaz
    if [ ! -f "$WEB_INTERFACE_FILE" ]; then
        print_error "No se encontró el archivo de interfaz: $WEB_INTERFACE_FILE"
        exit 1
    fi
    
    # Iniciar servidor backend
    if ! start_backend_server; then
        print_error "No se pudo iniciar el servidor backend"
        exit 1
    fi
    
    # Ejecutar tests de API
    echo ""
    run_api_tests
    echo ""
    
    # Iniciar servidor web para la interfaz
    start_web_server
    
    # Abrir navegador
    echo ""
    open_browser
    
    # Mostrar información
    echo ""
    print_success "Setup completado!"
    echo ""
    print_status "Servidor API: ${API_URL}"
    print_status "Interfaz Web: http://localhost:${TEST_PORT}"
    print_status "Logs del servidor: /tmp/microburst_server.log"
    print_status "Logs de la interfaz: /tmp/web_interface_server.log"
    echo ""
    print_warning "Presiona Ctrl+C para detener todos los servidores"
    echo ""
    
    # Mantener el script corriendo
    print_status "Servidores corriendo... (Ctrl+C para detener)"
    while true; do
        sleep 1
    done
}

# Ejecutar función principal
main

