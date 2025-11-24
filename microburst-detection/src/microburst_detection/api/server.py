# src/microburst_detection/api/server.py
"""FastAPI server for microburst detection system."""

import logging
from contextlib import asynccontextmanager
from typing import Optional

import structlog
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from ..core.detector import MicroburstDetector
from ..utils.config import Settings
from .schemas import (
    LidarDataSchema,
    RadarDataSchema,
    DetectionResponseSchema,
    HealthCheckSchema
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
settings = Settings()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("websocket_connected", clients=len(self.active_connections))
    
    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        self.active_connections.remove(websocket)
        logger.info("websocket_disconnected", clients=len(self.active_connections))
    
    async def broadcast(self, message: dict) -> None:
        """Send message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error("broadcast_error", error=str(e))


manager = ConnectionManager()
detector = MicroburstDetector()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("app_startup", version="1.0.0", environment=settings.environment)
    yield
    logger.info("app_shutdown")


app = FastAPI(
    title="Microburst Detection System",
    description="Professional wind shear and microburst detection for aviation safety",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware for web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthCheckSchema)
async def health_check() -> HealthCheckSchema:
    """
    Health check endpoint for monitoring.
    
    Returns:
        Health status with system metrics
    """
    return HealthCheckSchema(
        status="operational",
        version="1.0.0",
        active_connections=len(manager.active_connections)
    )


@app.post("/detect/lidar", response_model=DetectionResponseSchema)
async def analyze_lidar_data(data: LidarDataSchema) -> DetectionResponseSchema:
    """
    Process LIDAR sensor data and detect microbursts.
    
    Args:
        data: LIDAR measurement data
        
    Returns:
        Detection result or None if no microburst detected
    """
    try:
        result = await detector.process_lidar(data)
        
        if result:
            logger.info(
                "microburst_detected",
                event_id=result.event_id,
                severity=result.severity.value,
                confidence=result.confidence
            )
            await manager.broadcast({"type": "detection", "data": result.model_dump()})
        
        return result
    
    except Exception as e:
        logger.error("lidar_processing_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/radar", response_model=DetectionResponseSchema)
async def analyze_radar_data(data: RadarDataSchema) -> DetectionResponseSchema:
    """
    Process Doppler radar data and detect microbursts.
    
    Args:
        data: Doppler radar measurement data
        
    Returns:
        Detection result or None if no microburst detected
    """
    try:
        result = await detector.process_radar(data)
        
        if result:
            logger.info(
                "microburst_detected_radar",
                event_id=result.event_id,
                severity=result.severity.value
            )
            await manager.broadcast({"type": "detection", "data": result.model_dump()})
        
        return result
    
    except Exception as e:
        logger.error("radar_processing_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/detections", response_model=list[DetectionResponseSchema])
async def get_detections(
    severity: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=168)
) -> list[DetectionResponseSchema]:
    """
    Retrieve historical microburst detections.
    
    Args:
        severity: Filter by severity level (optional)
        hours: Number of hours to retrieve (1-168)
        
    Returns:
        List of detections within the time window
    """
    detections = await detector.get_recent_detections(hours=hours, severity=severity)
    return detections


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time data streaming.
    
    Clients can subscribe to receive real-time microburst detections,
    sensor data updates, and system alerts.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo data or process commands
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@app.get("/stats")
async def get_statistics(days: int = Query(7, ge=1, le=90)):
    """
    Get microburst detection statistics.
    
    Args:
        days: Number of days to analyze
        
    Returns:
        Statistics including detection count, severity distribution, etc.
    """
    stats = await detector.get_statistics(days=days)
    return stats


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Global exception handler for logging."""
    logger.error("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


def run_server(
    host: str = "0.0.0.0",
    port: int = 8000,
    reload: bool = True
) -> None:
    """
    Run the FastAPI server.
    
    Args:
        host: Server host
        port: Server port
        reload: Enable auto-reload on code changes
    """
    uvicorn.run(
        "microburst_detection.api.server:app",
        host=host,
        port=port,
        reload=reload,
        log_config=None  # Use structlog for logging
    )


if __name__ == "__main__":
    run_server()
