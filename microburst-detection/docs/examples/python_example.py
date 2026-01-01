"""Python example for using the Microburst Detection API."""

import requests
import asyncio
import websockets
import json
from datetime import datetime
from typing import Optional


# API Configuration
API_BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/stream"


def check_health() -> dict:
    """Check API health status."""
    response = requests.get(f"{API_BASE_URL}/health")
    response.raise_for_status()
    return response.json()


def detect_lidar(lidar_data: dict) -> Optional[dict]:
    """Send LIDAR data for microburst detection."""
    response = requests.post(
        f"{API_BASE_URL}/detect/lidar",
        json=lidar_data
    )
    response.raise_for_status()
    return response.json()


def detect_radar(radar_data: dict) -> Optional[dict]:
    """Send radar data for microburst detection."""
    response = requests.post(
        f"{API_BASE_URL}/detect/radar",
        json=radar_data
    )
    response.raise_for_status()
    return response.json()


def detect_anemometer(anemometer_data: dict) -> Optional[dict]:
    """Send anemometer data for microburst detection."""
    response = requests.post(
        f"{API_BASE_URL}/detect/anemometer",
        json=anemometer_data
    )
    response.raise_for_status()
    return response.json()


def get_recent_detections(severity: Optional[str] = None, hours: int = 24) -> list:
    """Retrieve recent detections."""
    params = {"hours": hours}
    if severity:
        params["severity"] = severity
    
    response = requests.get(
        f"{API_BASE_URL}/detections",
        params=params
    )
    response.raise_for_status()
    return response.json()


def get_statistics(days: int = 7) -> dict:
    """Get detection statistics."""
    response = requests.get(
        f"{API_BASE_URL}/stats",
        params={"days": days}
    )
    response.raise_for_status()
    return response.json()


async def stream_detections(duration: int = 60):
    """Stream real-time detections via WebSocket."""
    async with websockets.connect(WS_URL) as websocket:
        print(f"Connected to WebSocket. Streaming for {duration} seconds...")
        
        start_time = datetime.now()
        while (datetime.now() - start_time).total_seconds() < duration:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(message)
                
                if data.get("type") == "detection":
                    detection = data.get("data", {})
                    print(f"Detection: {detection.get('event_id')} - "
                          f"Severity: {detection.get('severity')}")
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"Error: {e}")
                break


def main():
    """Example usage."""
    # Check health
    print("Checking API health...")
    health = check_health()
    print(f"Status: {health['status']}, Version: {health['version']}")
    
    # Example LIDAR data
    lidar_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "latitude": 52.453,
        "longitude": -1.748,
        "altitude": 1200.0,
        "vertical_velocity": -8.5,
        "backscatter": 0.45,
        "range_resolution": 30.0
    }
    
    # Detect microburst
    print("\nSending LIDAR data for detection...")
    detection = detect_lidar(lidar_data)
    
    if detection:
        print(f"Microburst detected!")
        print(f"  Event ID: {detection['event_id']}")
        print(f"  Severity: {detection['severity']}")
        print(f"  Confidence: {detection['confidence']:.2%}")
        print(f"  Wind Shear: {detection['max_wind_shear']:.2f} m/s")
    else:
        print("No microburst detected.")
    
    # Get statistics
    print("\nRetrieving statistics...")
    stats = get_statistics(days=7)
    print(f"Total detections (7 days): {stats['total_detections']}")
    print(f"Severity distribution: {stats['severity_distribution']}")
    
    # Stream detections
    print("\nStarting WebSocket stream...")
    asyncio.run(stream_detections(duration=10))


if __name__ == "__main__":
    main()

