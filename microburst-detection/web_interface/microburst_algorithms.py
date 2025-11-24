# src/microburst_detection/core/algorithms.py
"""Core detection algorithms for microburst identification."""

import logging
from typing import Tuple
import numpy as np
from scipy import signal
from scipy.ndimage import gaussian_filter1d

logger = logging.getLogger(__name__)


class WindShearDetector:
    """Detects wind shear using vertical velocity gradients from LIDAR data."""
    
    WIND_SHEAR_THRESHOLD: float = 3.0  # m/s per 100m
    SEVERE_WIND_SHEAR: float = 6.0     # m/s per 100m
    
    @staticmethod
    def calculate_wind_shear(
        altitudes: np.ndarray,
        vertical_velocities: np.ndarray,
        window_size: int = 5
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate wind shear magnitude from vertical velocity profile.
        
        Args:
            altitudes: Height profile [meters]
            vertical_velocities: Vertical velocity at each height [m/s]
            window_size: Smoothing window for gradient calculation
            
        Returns:
            Tuple of (wind_shear, shear_severity)
        """
        if len(altitudes) < 3:
            raise ValueError("Need at least 3 altitude points")
        
        # Smooth the vertical velocity profile
        smoothed_vv = gaussian_filter1d(vertical_velocities, sigma=window_size/2)
        
        # Calculate altitude differences
        altitude_diff = np.diff(altitudes)
        altitude_diff = np.where(altitude_diff == 0, 1e-6, altitude_diff)
        
        # Calculate velocity gradient
        velocity_gradient = np.diff(smoothed_vv) / altitude_diff
        
        # Normalize to per 100m scale
        wind_shear = np.abs(velocity_gradient) * 100
        
        # Assess severity
        severity = np.where(
            wind_shear >= WindShearDetector.SEVERE_WIND_SHEAR,
            2,  # SEVERE
            np.where(wind_shear >= WindShearDetector.WIND_SHEAR_THRESHOLD, 1, 0)
        )
        
        return wind_shear, severity


class ReflectivityAnalyzer:
    """Analyzes radar reflectivity patterns characteristic of microbursts."""
    
    # Reflectivity thresholds (dBZ)
    MODERATE_REFLECTIVITY: float = 40.0
    STRONG_REFLECTIVITY: float = 50.0
    SEVERE_REFLECTIVITY: float = 60.0
    
    @staticmethod
    def detect_hook_echo(
        reflectivity_grid: np.ndarray,
        lat_grid: np.ndarray,
        lon_grid: np.ndarray
    ) -> dict:
        """
        Detect hook echo pattern characteristic of microbursts.
        
        Args:
            reflectivity_grid: 2D reflectivity field [dBZ]
            lat_grid: Latitude coordinates
            lon_grid: Longitude coordinates
            
        Returns:
            Detection result with confidence score
        """
        # Threshold reflectivity to find strong precipitation
        strong_precip = reflectivity_grid > ReflectivityAnalyzer.MODERATE_REFLECTIVITY
        
        # Detect contour curvature using Laplacian
        laplacian = signal.laplace(strong_precip.astype(float))
        curvature = np.abs(laplacian[1:-1, 1:-1])
        
        # Calculate hook echo indicator
        max_curvature = np.max(curvature)
        hook_score = min(max_curvature / 2.0, 1.0)  # Normalize to [0,1]
        
        return {
            "hook_detected": hook_score > 0.5,
            "hook_confidence": hook_score,
            "max_reflectivity": np.max(reflectivity_grid)
        }


class VelocityCoadaptationDetector:
    """Detects microbursts using radial velocity divergence patterns."""
    
    @staticmethod
    def calculate_velocity_divergence(
        radial_velocities: np.ndarray,
        ranges: np.ndarray,
        azimuth_angles: np.ndarray
    ) -> Tuple[float, float]:
        """
        Calculate divergence in radial velocity field indicating microburst.
        
        Args:
            radial_velocities: Doppler velocities at each range/azimuth [m/s]
            ranges: Range from radar [meters]
            azimuth_angles: Azimuth angles [degrees]
            
        Returns:
            Tuple of (divergence_magnitude, divergence_confidence)
        """
        if radial_velocities.size < 4:
            return 0.0, 0.0
        
        # Calculate velocity gradients
        # For true divergence, we'd need 2D field, approximating with radial gradient
        radial_gradient = np.gradient(radial_velocities)
        divergence_magnitude = np.mean(np.abs(radial_gradient))
        
        # Divergence confidence based on consistency
        divergence_std = np.std(radial_gradient)
        confidence = max(0, min(1, divergence_magnitude / (divergence_std + 1e-6)))
        
        return divergence_magnitude, confidence


class MicroburstSeverityClassifier:
    """Classifies detected microbursts by severity level."""
    
    # Severity thresholds
    THRESHOLDS = {
        "low": {"wind_shear": 3.0, "reflectivity": 40},
        "moderate": {"wind_shear": 5.0, "reflectivity": 50},
        "severe": {"wind_shear": 7.0, "reflectivity": 60},
        "extreme": {"wind_shear": 10.0, "reflectivity": 70}
    }
    
    @staticmethod
    def classify(
        max_wind_shear: float,
        vertical_velocity: float,
        reflectivity: float,
        confidence: float
    ) -> dict:
        """
        Classify microburst severity.
        
        Args:
            max_wind_shear: Maximum wind shear in m/s per 100m
            vertical_velocity: Peak vertical velocity in m/s
            reflectivity: Maximum reflectivity in dBZ
            confidence: Overall detection confidence [0,1]
            
        Returns:
            Classification result with severity level and score
        """
        severity_score = 0
        
        # Evaluate each parameter
        for level, thresholds in MicroburstSeverityClassifier.THRESHOLDS.items():
            if (max_wind_shear >= thresholds["wind_shear"] and
                reflectivity >= thresholds["reflectivity"]):
                severity_score = level
        
        # Apply confidence weighting
        if severity_score == 0:
            final_confidence = confidence * 0.5
        else:
            final_confidence = confidence
        
        return {
            "severity": severity_score,
            "severity_score": final_confidence,
            "contributing_factors": {
                "wind_shear": max_wind_shear,
                "vertical_velocity": vertical_velocity,
                "reflectivity": reflectivity
            }
        }


class TemporalCoherence:
    """Analyzes temporal patterns for microburst persistence."""
    
    @staticmethod
    def validate_temporal_persistence(
        detections: list[Tuple[float, float]],
        time_window_seconds: int = 300
    ) -> float:
        """
        Validate that detections persist over time (reduce false positives).
        
        Args:
            detections: List of (timestamp, confidence) tuples
            time_window_seconds: Typical microburst duration
            
        Returns:
            Persistence score [0,1]
        """
        if len(detections) < 2:
            return 0.5  # Insufficient data
        
        # Calculate detection continuity
        timestamps = np.array([d[0] for d in detections])
        time_diffs = np.diff(timestamps)
        
        # Penalize large gaps
        persistence = np.mean(time_diffs < time_window_seconds)
        
        # Reward consistent confidence
        confidences = np.array([d[1] for d in detections])
        confidence_stability = 1 - np.std(confidences)
        
        return (persistence + confidence_stability) / 2
