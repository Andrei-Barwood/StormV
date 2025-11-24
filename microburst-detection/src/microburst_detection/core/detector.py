# src/microburst_detection/core/detector.py
"""Main microburst detector orchestrator."""

import logging
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import uuid4

from ..core.models import (
    LidarData,
    DopplerRadarData,
    AnemometerData,
    MicroburstDetection,
    SeverityLevel,
    DetectionMethod
)
from ..core.algorithms import (
    WindShearDetector,
    ReflectivityAnalyzer,
    VelocityCoadaptationDetector,
    MicroburstSeverityClassifier,
    TemporalCoherence
)
from ..fusion.data_fusion import SensorFusion

logger = logging.getLogger(__name__)


class MicroburstDetector:
    """
    Main orchestrator for microburst detection.
    
    Coordinates multiple detection algorithms and sensor fusion
    to provide robust microburst identification.
    """
    
    def __init__(self) -> None:
        """Initialize detector with algorithm instances."""
        self.wind_shear_detector = WindShearDetector()
        self.reflectivity_analyzer = ReflectivityAnalyzer()
        self.velocity_detector = VelocityCoadaptationDetector()
        self.severity_classifier = MicroburstSeverityClassifier()
        self.temporal_validator = TemporalCoherence()
        self.fusion = SensorFusion()
        
        # Detection history for temporal validation
        self.detection_history: List[MicroburstDetection] = []
        
        logger.info("MicroburstDetector initialized")
    
    async def process_lidar(self, data: LidarData) -> Optional[MicroburstDetection]:
        """
        Process LIDAR data and detect microbursts.
        
        Args:
            data: LIDAR measurement data
            
        Returns:
            Detection result or None if no microburst detected
        """
        try:
            # Extract vertical velocity profile
            # In real implementation, this would be multiple altitude measurements
            # For now, simulate with single measurement
            import numpy as np
            
            altitudes = np.array([data.altitude - 500, data.altitude, data.altitude + 500])
            velocities = np.array([
                data.vertical_velocity * 0.3,
                data.vertical_velocity,
                data.vertical_velocity * 0.5
            ])
            
            # Calculate wind shear
            wind_shear, severity = self.wind_shear_detector.calculate_wind_shear(
                altitudes, velocities
            )
            
            max_wind_shear = float(np.max(wind_shear))
            
            # Determine if detection threshold is met
            if max_wind_shear < WindShearDetector.WIND_SHEAR_THRESHOLD:
                return None
            
            # Calculate confidence based on data quality
            confidence = min(data.backscatter * 1.5, 1.0)
            
            # Create detection event
            detection = MicroburstDetection(
                event_id=f"evt_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}",
                timestamp=data.timestamp,
                latitude=data.latitude,
                longitude=data.longitude,
                altitude=data.altitude,
                severity=self._classify_severity(max_wind_shear, data.vertical_velocity),
                detection_method=DetectionMethod.LIDAR,
                max_wind_shear=max_wind_shear,
                vertical_velocity=data.vertical_velocity,
                confidence=confidence,
                radius=1000.0,  # Typical microburst radius
                duration_seconds=180,  # Typical duration
                alert_level=self._generate_alert_level(max_wind_shear)
            )
            
            self.detection_history.append(detection)
            logger.info(f"LIDAR detection: {detection.event_id}, severity={detection.severity}")
            
            return detection
        
        except Exception as e:
            logger.error(f"Error processing LIDAR data: {e}")
            raise
    
    async def process_radar(self, data: DopplerRadarData) -> Optional[MicroburstDetection]:
        """
        Process Doppler radar data and detect microbursts.
        
        Args:
            data: Radar measurement data
            
        Returns:
            Detection result or None if no microburst detected
        """
        try:
            # Analyze reflectivity for hook echo patterns
            # In real implementation, this would be 2D/3D grid
            import numpy as np
            
            # Simulate reflectivity grid around measurement point
            grid = np.random.uniform(
                data.reflectivity - 10,
                data.reflectivity + 5,
                (10, 10)
            )
            lat_grid = np.linspace(data.latitude - 0.1, data.latitude + 0.1, 10)
            lon_grid = np.linspace(data.longitude - 0.1, data.longitude + 0.1, 10)
            
            hook_result = self.reflectivity_analyzer.detect_hook_echo(
                grid, lat_grid, lon_grid
            )
            
            # Check if significant pattern detected
            if not hook_result['hook_detected']:
                return None
            
            # Estimate wind shear from radial velocity
            estimated_wind_shear = abs(data.radial_velocity) * 0.7
            
            # Create detection
            detection = MicroburstDetection(
                event_id=f"evt_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}",
                timestamp=data.timestamp,
                latitude=data.latitude,
                longitude=data.longitude,
                altitude=data.altitude,
                severity=self._classify_severity(estimated_wind_shear, data.radial_velocity),
                detection_method=DetectionMethod.DOPPLER_RADAR,
                max_wind_shear=estimated_wind_shear,
                vertical_velocity=data.radial_velocity,
                confidence=hook_result['hook_confidence'],
                radius=1500.0,
                duration_seconds=240,
                alert_level=self._generate_alert_level(estimated_wind_shear),
                additional_data={
                    'max_reflectivity': hook_result['max_reflectivity'],
                    'spectrum_width': data.spectrum_width
                }
            )
            
            self.detection_history.append(detection)
            logger.info(f"Radar detection: {detection.event_id}, severity={detection.severity}")
            
            return detection
        
        except Exception as e:
            logger.error(f"Error processing radar data: {e}")
            raise
    
    async def get_recent_detections(
        self,
        hours: int = 24,
        severity: Optional[str] = None
    ) -> List[MicroburstDetection]:
        """
        Retrieve recent detections with optional filtering.
        
        Args:
            hours: Number of hours to look back
            severity: Filter by severity level
            
        Returns:
            List of matching detections
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        filtered = [
            d for d in self.detection_history
            if d.timestamp >= cutoff_time
        ]
        
        if severity:
            filtered = [
                d for d in filtered
                if d.severity.value == severity.lower()
            ]
        
        return filtered
    
    async def get_statistics(self, days: int = 7) -> dict:
        """
        Get detection statistics for specified period.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Statistics dictionary
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent = [d for d in self.detection_history if d.timestamp >= cutoff]
        
        severity_counts = {
            'low': 0,
            'moderate': 0,
            'severe': 0,
            'extreme': 0
        }
        
        for detection in recent:
            severity_counts[detection.severity.value] += 1
        
        return {
            'total_detections': len(recent),
            'severity_distribution': severity_counts,
            'avg_confidence': sum(d.confidence for d in recent) / len(recent) if recent else 0,
            'avg_wind_shear': sum(d.max_wind_shear for d in recent) / len(recent) if recent else 0,
            'period_days': days
        }
    
    def _classify_severity(self, wind_shear: float, vertical_velocity: float) -> SeverityLevel:
        """Classify detection severity based on parameters."""
        if wind_shear >= 10.0:
            return SeverityLevel.EXTREME
        elif wind_shear >= 7.0:
            return SeverityLevel.SEVERE
        elif wind_shear >= 5.0:
            return SeverityLevel.MODERATE
        else:
            return SeverityLevel.LOW
    
    def _generate_alert_level(self, wind_shear: float) -> str:
        """Generate pilot alert level string."""
        if wind_shear >= 7.0:
            return "WINDSHEAR_CRITICAL"
        elif wind_shear >= 5.0:
            return "WINDSHEAR_ALERT"
        else:
            return "WINDSHEAR_CAUTION"
