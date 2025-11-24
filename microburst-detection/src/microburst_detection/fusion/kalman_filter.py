"""Kalman filter implementation for sensor fusion."""

import numpy as np
from typing import Tuple


class KalmanFilter:
    """Standard Kalman filter for state estimation."""
    
    def __init__(
        self,
        state_dim: int = 2,
        measurement_dim: int = 2,
        process_noise: float = 0.1,
        measurement_noise: float = 0.5
    ) -> None:
        """Initialize Kalman filter."""
        self.state_dim = state_dim
        self.measurement_dim = measurement_dim
        self.x = np.zeros(state_dim)
        self.P = np.eye(state_dim) * 10.0
        self.Q = np.eye(state_dim) * process_noise
        self.R = np.eye(measurement_dim) * measurement_noise
        self.F = np.eye(state_dim)
        self.H = np.eye(measurement_dim)
    
    def predict(self) -> Tuple[np.ndarray, np.ndarray]:
        """Prediction step."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        return self.x, self.P
    
    def update(self, measurement: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Update step with new measurement."""
        y = measurement - (self.H @ self.x)
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S)
        self.x = self.x + K @ y
        I = np.eye(self.state_dim)
        self.P = (I - K @ self.H) @ self.P
        return self.x, self.P
    
    def reset(self) -> None:
        """Reset filter to initial state."""
        self.x = np.zeros(self.state_dim)
        self.P = np.eye(self.state_dim) * 10.0
