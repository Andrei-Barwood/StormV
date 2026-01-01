#!/bin/bash
# cURL examples for Microburst Detection API

API_BASE="http://localhost:8000"

echo "=== Health Check ==="
curl -X GET "${API_BASE}/health" | jq

echo -e "\n=== Detect Microburst (LIDAR) ==="
curl -X POST "${API_BASE}/detect/lidar" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-11-23T21:03:00Z",
    "latitude": 52.453,
    "longitude": -1.748,
    "altitude": 1200.0,
    "vertical_velocity": -8.5,
    "backscatter": 0.45,
    "range_resolution": 30.0
  }' | jq

echo -e "\n=== Detect Microburst (Radar) ==="
curl -X POST "${API_BASE}/detect/radar" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-11-23T21:03:00Z",
    "latitude": 52.453,
    "longitude": -1.748,
    "altitude": 1500.0,
    "reflectivity": 45.2,
    "radial_velocity": -12.5,
    "spectrum_width": 3.2
  }' | jq

echo -e "\n=== Detect Microburst (Anemometer) ==="
curl -X POST "${API_BASE}/detect/anemometer" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-11-23T21:03:00Z",
    "latitude": 52.453,
    "longitude": -1.748,
    "altitude": 10.0,
    "wind_speed": 25.5,
    "wind_direction": 245.0,
    "temperature": 18.3,
    "pressure": 1013.25
  }' | jq

echo -e "\n=== Get Recent Detections ==="
curl -X GET "${API_BASE}/detections?hours=24" | jq

echo -e "\n=== Get Detections by Severity ==="
curl -X GET "${API_BASE}/detections?severity=severe&hours=48" | jq

echo -e "\n=== Get Statistics ==="
curl -X GET "${API_BASE}/stats?days=7" | jq

echo -e "\n=== WebSocket Example (use wscat or similar) ==="
echo "wscat -c ws://localhost:8000/ws/stream"

