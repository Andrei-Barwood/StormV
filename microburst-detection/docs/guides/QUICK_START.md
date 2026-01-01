# Quick Start Guide

## Installation

### Prerequisites

- Python 3.11 or higher
- pip or poetry
- (Optional) Docker and Docker Compose

### Install from Source

```bash
# Clone the repository
git clone https://github.com/your-org/microburst-detection.git
cd microburst-detection

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"
```

### Install with Docker

```bash
docker-compose up -d
```

## Running the Server

### Development Mode

```bash
# Start with auto-reload
microburst-detect server --reload --port 8000

# Or use uvicorn directly
uvicorn microburst_detection.api.server:app --reload
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
# Using the CLI
microburst-detect server --host 0.0.0.0 --port 8000 --workers 4

# Or using gunicorn
gunicorn microburst_detection.api.server:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Using the CLI

### Analyze Sensor Data Files

```bash
# Analyze LIDAR data
microburst-detect analyze --lidar data/samples/lidar_sample.json --output results.json

# Analyze multiple sensors
microburst-detect analyze \
  --lidar data/lidar.json \
  --radar data/radar.json \
  --anemometer data/anemometer.json \
  --output results.json
```

### Stream Real-Time Detections

```bash
# Connect to WebSocket stream
microburst-detect stream --api http://localhost:8000 --duration 120
```

### View Configuration

```bash
# Show current configuration
microburst-detect config --show

# Set configuration value
microburst-detect config --set WIND_SHEAR_THRESHOLD=3.5
```

### Run Benchmarks

```bash
microburst-detect benchmark
```

## Using the API

### Python Example

```python
import requests
from datetime import datetime

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Detect microburst from LIDAR data
lidar_data = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "latitude": 52.453,
    "longitude": -1.748,
    "altitude": 1200.0,
    "vertical_velocity": -8.5,
    "backscatter": 0.45,
    "range_resolution": 30.0
}

response = requests.post(
    "http://localhost:8000/detect/lidar",
    json=lidar_data
)

detection = response.json()
if detection:
    print(f"Microburst detected! Severity: {detection['severity']}")
```

### cURL Example

```bash
# Health check
curl http://localhost:8000/health

# Detect microburst
curl -X POST http://localhost:8000/detect/lidar \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-11-23T21:03:00Z",
    "latitude": 52.453,
    "longitude": -1.748,
    "altitude": 1200.0,
    "vertical_velocity": -8.5,
    "backscatter": 0.45,
    "range_resolution": 30.0
  }'
```

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=src/microburst_detection --cov-report=html

# Run specific test file
pytest tests/core/test_detector.py -v
```

## Next Steps

- Read the [Architecture Documentation](../architecture/README.md)
- Check [API Examples](../examples/)
- Review [Deployment Guide](../guides/DEPLOYMENT.md)

