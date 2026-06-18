import json
import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt

# Import models and database functions
from models import SensorReading, AlertStatus, DashboardData
from database import save_sensor_data, get_latest_reading, get_all_readings, get_readings_by_time_range

load_dotenv()

# ==========================================
# FastAPI Setup
# ==========================================
app = FastAPI(title="Aqua-Trace Backend", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MQTT Configuration
# ==========================================
MQTT_BROKER = os.getenv("MQTT_BROKER", "192.168.1.73")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
BASE_TOPIC = os.getenv("MQTT_TOPIC", "aquatrace/sensors")

# Derived topics for two-way communication
MQTT_TOPIC_OUT = BASE_TOPIC
MQTT_TOPIC_IN = BASE_TOPIC + "/commands"

# ==========================================
# ALIGNED THRESHOLDS (Matches ESP32 Code)
# ==========================================
THRESHOLDS = {
    "AMMONIA_ALERT": 1500,       # Matches ESP32 raw ADC threshold
    "MIN_ORP": 1500.0,           # Matches ESP32 ORP_THRESHOLD
    "MAX_TDS": 200.0,            # Matches ESP32 TDS_THRESHOLD
    "CRITICAL_LOW_WATER": 18.0,  # Matches ESP32 DISTANCE_THRESHOLD (in cm)
    "FEED_EMPTY_WARNING": 50.0   # Matches ESP32 FEED_EMPTY_THRESHOLD
}

# Global state
current_reading = None
mqtt_client = None

# ==========================================
# MQTT Callbacks
# ==========================================
def on_connect(client, userdata, flags, rc):
    """Callback for when the client connects to the MQTT broker"""
    if rc == 0:
        print(f"✓ MQTT Connected to {MQTT_BROKER}:{MQTT_PORT}")
        client.subscribe(MQTT_TOPIC_OUT)
        print(f"✓ Subscribed to topic: {MQTT_TOPIC_OUT}")
    else:
        print(f"✗ MQTT Connection failed with code {rc}")

def on_disconnect(client, userdata, rc):
    """Callback for when the client disconnects from the MQTT broker"""
    if rc != 0:
        print(f"✗ Unexpected MQTT disconnection with code {rc}")

def on_message(client, userdata, msg):
    """Callback for when a message is received from the MQTT broker"""
    global current_reading
    
    try:
        # Parse JSON payload
        payload = json.loads(msg.payload.decode())
        
        # Add server-side timestamp for the database
        data_with_timestamp = {
            **payload,
            "server_timestamp": datetime.utcnow().isoformat()
        }
        
        # Save to MongoDB
        save_sensor_data(data_with_timestamp)
        
        # Update global state
        current_reading = payload
        
        print(f"✓ Data saved: Dist={payload.get('distance')}cm, Amm={payload.get('ammonia')}, Wgt={payload.get('weight')}g")
        
    except json.JSONDecodeError:
        print(f"✗ Failed to decode MQTT payload: {msg.payload}")
    except Exception as e:
        print(f"✗ Error processing MQTT message: {e}")

# ==========================================
# Helper Functions
# ==========================================
def check_alerts(reading_dict: dict) -> dict:
    """Check sensor readings against thresholds and generate alerts"""
    # Using .get() ensures it won't crash if a sensor temporarily drops out
    distance = reading_dict.get('distance', 0)
    tds = reading_dict.get('tds', 0)
    orp = reading_dict.get('orp', 0)
    ammonia = reading_dict.get('ammonia', 0)
    weight = reading_dict.get('weight', 0)

    return {
        "tds_alert": tds > THRESHOLDS["MAX_TDS"],
        "orp_alert": orp < THRESHOLDS["MIN_ORP"],
        "ammonia_alert": ammonia >= THRESHOLDS["AMMONIA_ALERT"],
        "water_level_low": distance >= THRESHOLDS["CRITICAL_LOW_WATER"],
        "feed_empty_alert": weight < THRESHOLDS["FEED_EMPTY_WARNING"],
        "timestamp": datetime.utcnow().isoformat()
    }

# ==========================================
# FastAPI Routes
# ==========================================

@app.on_event("startup")
async def startup_event():
    """Initialize MQTT connection on startup"""
    global mqtt_client
    
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect
    mqtt_client.on_message = on_message
    
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        mqtt_client.loop_start()
        print(f"✓ MQTT client initialized - connecting to {MQTT_BROKER}:{MQTT_PORT}")
    except Exception as e:
        print(f"✗ Failed to initialize MQTT: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup MQTT connection on shutdown"""
    global mqtt_client
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("✓ MQTT disconnected")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Aqua-Trace Backend",
        "version": "1.0.0",
        "mqtt_status": "connected" if mqtt_client and mqtt_client.is_connected() else "disconnected"
    }

@app.get("/api/current-reading")
async def get_current_reading():
    """Get the latest sensor reading (prevents 404 crashes on React)"""
    reading = get_latest_reading()
    
    # NEW LOGIC: Return safe zeroes if database is empty so React loads smoothly
    if not reading:
        return {
            "reading": {
                "distance": 0.0,
                "tds": 0.0,
                "orp": 0.0,
                "ammonia": 0,
                "ir_triggered": False,
                "weight": 0.0,
                "auto_mode": True
            },
            "alerts": {
                "tds_alert": False,
                "orp_alert": False,
                "ammonia_alert": False,
                "water_level_low": False,
                "feed_empty_alert": False
            },
            "status": "waiting_for_hardware"
        }
    
    try:
        # Filter out database IDs and timestamps for the clean reading
        clean_reading = {k: v for k, v in reading.items() if k not in ['server_timestamp', '_id', 'timestamp']}
        alerts = check_alerts(clean_reading)
        
        return {
            "reading": clean_reading,
            "alerts": alerts,
            "status": "online"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing reading: {str(e)}")

@app.get("/api/readings")
async def get_readings(limit: int = 100):
    """Get all sensor readings with optional limit"""
    readings = get_all_readings(limit)
    if not readings:
        raise HTTPException(status_code=404, detail="No readings available")
    
    return {
        "count": len(readings),
        "readings": readings
    }

@app.get("/api/readings/range")
async def get_readings_range(start_time: int, end_time: int):
    """Get sensor readings within a time range (milliseconds since epoch)"""
    readings = get_readings_by_time_range(start_time, end_time)
    if not readings:
        raise HTTPException(status_code=404, detail="No readings in time range")
    
    return {
        "count": len(readings),
        "readings": readings
    }

@app.get("/api/alerts")
async def get_alerts():
    """Get current alert status directly"""
    reading = get_latest_reading()
    if not reading:
        raise HTTPException(status_code=404, detail="No readings available")
    
    clean_reading = {k: v for k, v in reading.items() if k not in ['server_timestamp', '_id', 'timestamp']}
    alerts = check_alerts(clean_reading)
    
    return alerts

@app.get("/api/thresholds")
async def get_thresholds():
    """Get all sensor thresholds"""
    return THRESHOLDS

@app.get("/api/status")
async def get_status():
    """Get overall system status"""
    return {
        "system": "online",
        "mqtt": "connected" if mqtt_client and mqtt_client.is_connected() else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }

# ==========================================
# Control Endpoints for React UI
# ==========================================

@app.post("/api/command/{cmd}")
async def send_command(cmd: str):
    """Send standard commands like MANUAL_MODE, PUMP_ON, WINCH_UP, etc."""
    if not mqtt_client or not mqtt_client.is_connected():
        raise HTTPException(status_code=503, detail="MQTT broker is offline")
    
    mqtt_client.publish(MQTT_TOPIC_IN, cmd)
    return {"status": "Command sent to ESP32", "command": cmd}

@app.post("/api/feed")
async def trigger_feeding():
    """Dedicated endpoint to trigger the IR + Winch + Stepper sequence"""
    if not mqtt_client or not mqtt_client.is_connected():
        raise HTTPException(status_code=503, detail="MQTT broker is offline")
    
    mqtt_client.publish(MQTT_TOPIC_IN, "FEED_NOW")
    return {"status": "Feeding sequence initiated", "command": "FEED_NOW"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)