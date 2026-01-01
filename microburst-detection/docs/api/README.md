# API Documentation

## Overview

The Microburst Detection System provides a RESTful API for real-time microburst detection using LIDAR, Doppler radar, and anemometer sensors.

**Base URL**: `http://localhost:8000`  
**API Version**: `1.0.0`  
**Documentation**: `/api/docs` (Swagger UI) or `/api/redoc` (ReDoc)

## Authentication

Currently, the API does not require authentication. For production deployments, implement API keys or OAuth2.

## Endpoints

### Health Check

#### `GET /health`

Check system health and status.

**Response**:
```json
{
  "status": "operational",
  "version": "1.0.0",
  "active_connections": 0,
  "timestamp": "2025-11-23T21:03:00Z"
}
```

### Detection Endpoints

#### `POST /detect/lidar`

Process LIDAR sensor data and detect microbursts.

**Request Body**:
```json
{
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 1200.5,
  "vertical_velocity": -8.5,
  "backscatter": 0.45,
  "range_resolution": 30.0
}
```

**Response** (200 OK):
```json
{
  "event_id": "evt_20251123_210315_a1b2c3",
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 1200.5,
  "severity": "severe",
  "detection_method": "lidar",
  "max_wind_shear": 8.5,
  "vertical_velocity": -8.5,
  "confidence": 0.94,
  "radius": 1000.0,
  "duration_seconds": 180,
  "alert_level": "WINDSHEAR_ALERT",
  "additional_data": null
}
```

**Response** (200 OK, no detection):
```json
null
```

#### `POST /detect/radar`

Process Doppler radar data and detect microbursts.

**Request Body**:
```json
{
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 1500.0,
  "reflectivity": 45.2,
  "radial_velocity": -12.5,
  "spectrum_width": 3.2
}
```

**Response**: Same format as `/detect/lidar`

#### `POST /detect/anemometer`

Process anemometer data and detect microbursts.

**Request Body**:
```json
{
  "timestamp": "2025-11-23T21:03:00Z",
  "latitude": 52.453,
  "longitude": -1.748,
  "altitude": 10.0,
  "wind_speed": 25.5,
  "wind_direction": 245.0,
  "temperature": 18.3,
  "pressure": 1013.25
}
```

**Response**: Same format as `/detect/lidar`

### Historical Data

#### `GET /detections`

Retrieve historical microburst detections.

**Query Parameters**:
- `severity` (optional): Filter by severity level (`low`, `moderate`, `severe`, `extreme`)
- `hours` (default: 24): Number of hours to look back (1-168)

**Example**:
```
GET /detections?severity=severe&hours=48
```

**Response**:
```json
[
  {
    "event_id": "evt_20251123_210315_a1b2c3",
    "timestamp": "2025-11-23T21:03:00Z",
    ...
  }
]
```

### Statistics

#### `GET /stats`

Get microburst detection statistics.

**Query Parameters**:
- `days` (default: 7): Number of days to analyze (1-90)

**Example**:
```
GET /stats?days=30
```

**Response**:
```json
{
  "total_detections": 42,
  "severity_distribution": {
    "low": 10,
    "moderate": 20,
    "severe": 10,
    "extreme": 2
  },
  "avg_confidence": 0.85,
  "avg_wind_shear": 6.2,
  "period_days": 30
}
```

### WebSocket Streaming

#### `WS /ws/stream`

Real-time WebSocket endpoint for live detection updates.

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stream');
```

**Message Format**:
```json
{
  "type": "detection",
  "data": {
    "event_id": "evt_20251123_210315_a1b2c3",
    "severity": "severe",
    "confidence": 0.94,
    "max_wind_shear": 8.5,
    ...
  }
}
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid request data
- `500 Internal Server Error`: Server error

**Error Response Format**:
```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- 100 requests/minute per IP
- 1000 requests/hour per API key

## Examples

See `/docs/examples/` for code examples in Python, JavaScript, and cURL.

