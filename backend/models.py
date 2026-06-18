from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union

class SensorReading(BaseModel):
    """Schema for the incoming MQTT sensor readings from the ESP32"""
    distance: float      # Ultrasonic distance (cm)
    tds: float           # Total Dissolved Solids (ppm)
    orp: float           # Oxidation-Reduction Potential (mV)
    ammonia: int         # Raw Ammonia ADC value (0-4095)
    ir_triggered: bool   # True if crayfish is detected in the hide
    weight: float        # Simulated/Real load cell weight (g)
    auto_mode: bool      # True if system is managing itself automatically
    
    class Config:
        json_schema_extra = {
            "example": {
                "distance": 14.5,
                "tds": 150.5,
                "orp": 1600.0,
                "ammonia": 1200,
                "ir_triggered": False,
                "weight": 100.0,
                "auto_mode": True
            }
        }

class SensorReadingResponse(BaseModel):
    """Response model for sensor readings sent to the React frontend"""
    distance: float
    tds: float
    orp: float
    ammonia: int
    ir_triggered: bool
    weight: float
    auto_mode: bool
    
    # Server-generated timestamps
    server_timestamp: Optional[str] = None
    timestamp: Optional[datetime] = None

class AlertStatus(BaseModel):
    """Alert status model used to trigger UI warnings"""
    tds_alert: bool
    orp_alert: bool
    ammonia_alert: bool
    water_level_low: bool
    feed_empty_alert: bool  # Triggers when weight drops below threshold
    
    # Allows either a string (ISO format) or a datetime object
    timestamp: Union[str, datetime] 

class DashboardData(BaseModel):
    """Combined system data for the main dashboard view"""
    current_reading: SensorReading
    alerts: AlertStatus
    system_status: str  # "online" or "offline"