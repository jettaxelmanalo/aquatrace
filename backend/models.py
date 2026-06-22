from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Union

class SensorReading(BaseModel):
    distance: float
    tds: float
    orp: float
    ammonia: int
    ammonia_ppm: float    # NEW: Added PPM
    ir_triggered: bool
    weight: float
    auto_mode: bool
    pump_on: bool         
    uv_on: bool           
    solenoid_on: bool     
    is_feeding: bool      
    winch_angle: int   
    gsm_ok: bool          # NEW: Added GSM Status
    sms_sent: bool

class SensorReadingResponse(BaseModel):
    distance: float
    tds: float
    orp: float
    ammonia: int
    ammonia_ppm: float    # NEW: Added PPM
    ir_triggered: bool
    weight: float
    auto_mode: bool
    pump_on: bool
    uv_on: bool
    solenoid_on: bool
    is_feeding: bool
    winch_angle: int   
    gsm_ok: bool          # NEW: Added GSM Status
    sms_sent: bool
    server_timestamp: Optional[str] = None
    timestamp: Optional[datetime] = None
    
class AlertStatus(BaseModel):
    tds_alert: bool
    orp_alert: bool
    ammonia_alert: bool
    water_level_low: bool
    feed_empty_alert: bool
    timestamp: Union[str, datetime] 

class DashboardData(BaseModel):
    reading: SensorReadingResponse 
    alerts: AlertStatus
    status: str