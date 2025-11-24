# src/microburst_detection/utils/config.py
"""Configuration management using pydantic-settings."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'
    )
    
    # Environment
    environment: str = Field(default="development", description="Environment name")
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")
    
    # API Configuration
    api_title: str = Field(default="Microburst Detection System")
    api_version: str = Field(default="1.0.0")
    server_host: str = Field(default="0.0.0.0")
    server_port: int = Field(default=8000)
    
    # CORS
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        description="Allowed CORS origins"
    )
    
    # Detection Thresholds
    wind_shear_threshold_ms: float = Field(default=3.0, ge=0, le=15)
    reflectivity_threshold_dbz: float = Field(default=40.0, ge=0, le=80)
    confidence_threshold: float = Field(default=0.75, ge=0, le=1)
    
    # Database (optional)
    database_url: str = Field(default="sqlite:///./microburst.db")
    
    # Monitoring (optional)
    sentry_dsn: str = Field(default="")
    prometheus_port: int = Field(default=9090)
    
    # Performance
    workers: int = Field(default=1, ge=1, le=32)
    max_connections: int = Field(default=100, ge=1)
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"
