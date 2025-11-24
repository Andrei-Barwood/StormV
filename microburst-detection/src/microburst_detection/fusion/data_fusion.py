# src/microburst_detection/fusion/data_fusion.py
"""Multi-sensor data fusion using Kalman filtering."""

import numpy as np
from typing import List, Tuple, Optional
from datetime import datetime

from ..core.models import LidarData, DopplerRadarData, AnemometerData, FusedSensorData


class SensorFusion:
    """
    Fuses data from multiple sensors using Kalman filtering.
    
    Combines LIDAR, Doppler radar, and anemometer measurements
    to provide robust state estimation with uncertainty quantification.
    """
    
    def __init__(self) -> None:
        """Initialize fusion engine with default parameters."""
        # State vector: [vertical_velocity, wind_shear]
        self.state = np.zeros(2)
        # Covariance matrix
        self.covariance = np.eye(2) * 10.0
        
        # Process noise (system uncertainty)
        self.Q = np.array([[0.1, 0], [0, 0.05]])
        
        # Measurement noise for different sensors
        self.R_lidar = np.array([[0.5, 0], [0, 0.3]])
        self.R_radar = np.array([[1.0, 0], [0, 0.8]])
        self.R_anemometer = np.array([[2.0, 0], [0, 1.5]])
    
    def fuse_measurements(
        self,
        lidar: Optional[LidarData] = None,
        radar: Optional[DopplerRadarData] = None,
        anemometer: Optional[AnemometerData] = None
    ) -> FusedSensorData:
        """
        Fuse available sensor measurements.
        
        Args:
            lidar: LIDAR measurement (optional)
            radar: Radar measurement (optional)
            anemometer: Anemometer measurement (optional)
            
        Returns:
            Fused sensor data with uncertainty estimates
        """
        # Prediction step (time update)
        self._predict()
        
        # Update with available measurements
        if lidar is not None:
            measurement = np.array([
                lidar.vertical_velocity,
                abs(lidar.vertical_velocity) * 0.8  # Estimate wind shear
            ])
            self._update(measurement, self.R_lidar)
        
        if radar is not None:
            measurement = np.array([
                radar.radial_velocity,
                abs(radar.radial_velocity) * 0.7
            ])
            self._update(measurement, self.R_radar)
        
        if anemometer is not None:
            # Convert horizontal wind to vertical estimate
            vertical_est = anemometer.wind_speed * 0.3
            measurement = np.array([
                vertical_est,
                anemometer.wind_speed * 0.2
            ])
            self._update(measurement, self.R_anemometer)
        
        # Determine location (use first available)
        if lidar:
            lat, lon, alt = lidar.latitude, lidar.longitude, lidar.altitude
        elif radar:
            lat, lon, alt = radar.latitude, radar.longitude, radar.altitude
        elif anemometer:
            lat, lon, alt = anemometer.latitude, anemometer.longitude, anemometer.altitude
        else:
            raise ValueError("At least one sensor measurement required")
        
        # Calculate fusion quality based on covariance trace
        fusion_quality = 1.0 / (1.0 + np.trace(self.covariance))
        
        return FusedSensorData(
            timestamp=datetime.utcnow(),
            location=(lat, lon),
            altitude=alt,
            fused_vertical_velocity=float(self.state[0]),
            fused_wind_shear=float(self.state[1]),
            estimation_covariance=float(np.trace(self.covariance)),
            lidar_available=lidar is not None,
            radar_available=radar is not None,
            anemometer_available=anemometer is not None,
            fusion_quality=float(fusion_quality)
        )
    
    def _predict(self) -> None:
        """Prediction step: project state and covariance forward."""
        # Simple constant velocity model
        F = np.eye(2)  # State transition matrix
        
        # Project state
        self.state = F @ self.state
        
        # Project covariance
        self.covariance = F @ self.covariance @ F.T + self.Q
    
    def _update(self, measurement: np.ndarray, R: np.ndarray) -> None:
        """
        Update step: incorporate new measurement.
        
        Args:
            measurement: Measurement vector
            R: Measurement noise covariance
        """
        # Measurement matrix (direct observation of state)
        H = np.eye(2)
        
        # Innovation (measurement residual)
        y = measurement - (H @ self.state)
        
        # Innovation covariance
        S = H @ self.covariance @ H.T + R
        
        # Kalman gain
        K = self.covariance @ H.T @ np.linalg.inv(S)
        
        # Update state
        self.state = self.state + (K @ y)
        
        # Update covariance
        I = np.eye(2)
        self.covariance = (I - K @ H) @ self.covariance
    
    def reset(self) -> None:
        """Reset filter to initial state."""
        self.state = np.zeros(2)
        self.covariance = np.eye(2) * 10.0
