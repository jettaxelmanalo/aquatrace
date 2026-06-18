from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union

class SensorReading(BaseModel):
    distance: float
    tds: float
    orp: float
    ammonia: int
    ir_triggered: bool
    weight: float
    auto_mode: bool
    pump_on: bool         
    uv_on: bool           
    solenoid_on: bool     
    is_feeding: bool      
    winch_angle: int   # Changed from winch_on: bool to winch_angle: int
    sms_sent: bool

class SensorReadingResponse(BaseModel):
    distance: float
    tds: float
    orp: float
    ammonia: int
    ir_triggered: bool
    weight: float
    auto_mode: bool
    pump_on: bool
    uv_on: bool
    solenoid_on: bool
    is_feeding: bool
    winch_angle: int   # Changed here as well
    sms_sent: bool
    server_timestamp: Optional[str] = None
    timestamp: Optional[datetime] = None
    
class AlertStatus(BaseModel):
    """Alert status model used to trigger UI warnings"""
    tds_alert: bool
    orp_alert: bool
    ammonia_alert: bool
    water_level_low: bool
    feed_empty_alert: bool
    
    timestamp: Union[str, datetime] 

class DashboardData(BaseModel):
    """Combined system data for the main dashboard view"""
    reading: SensorReadingResponse # Changed from 'current_reading' to 'reading' to match your API
    alerts: AlertStatus
    status: str  # "online" or "waiting_for_hardware"