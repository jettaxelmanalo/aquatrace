# 🦞 Aqua-Trace: Crayfish Monitoring System

A comprehensive IoT monitoring system for crayfish aquaculture using MQTT, Python backend, and React frontend.

## � System Architecture

```
ESP32 (Tank)  ──WiFi──> Mosquitto MQTT Broker (Pi 5: 192.168.1.73)
                                ↓
                        FastAPI Backend + MongoDB
                                ↓
                        React Dashboard (7 views)
```

**🎯 NOTE:** By default, this uses a **local Mosquitto broker on your Raspberry Pi 5** (`192.168.1.73`). 
For detailed setup, see [LOCAL_MQTT_SETUP.md](LOCAL_MQTT_SETUP.md).

## 📁 Project Structure

```
microcontroller/
├── hardware/                   # ESP32 Master Controller
│   ├── platformio.ini         # PlatformIO configuration
│   ├── src/
│   │   └── main.cpp           # Reads all sensors, publishes combined MQTT message
│   └── lib/                   # Arduino libraries
│
├── backend/                   # Python MQTT Listener & API Server
│   ├── main.py               # FastAPI server + MQTT listener
│   ├── models.py             # Pydantic schemas
│   ├── database.py           # MongoDB connection
│   ├── requirements.txt       # Python dependencies
│   ├── .env                  # Configuration (MQTT, MongoDB)
│   └── .env.example          # Example configuration
│
└── ui/                       # React Dashboard
    ├── src/
    │   ├── App.jsx                    # Navigation bar
    │   ├── App.css                    # Navbar styles
    │   ├── pages/
    │   │   ├── MasterDashboard.jsx   # Master control panel
    │   │   ├── JettDashboard.jsx     # Jett's personal dashboard
    │   │   ├── EdilynDashboard.jsx   # Edilyn's personal dashboard
    │   │   ├── EmmaDashboard.jsx     # Emma's personal dashboard
    │   │   ├── MariaDashboard.jsx    # Maria's personal dashboard
    │   │   ├── DeciDashboard.jsx     # Deci's personal dashboard
    │   │   ├── CyleenDashboard.jsx   # Cyleen's personal dashboard
    │   │   └── PersonalDashboard.jsx # Reusable personal dashboard
    │   ├── components/
    │   │   └── SensorCard.jsx        # Reusable sensor card component
    │   ├── hooks/
    │   │   └── useSensorData.js      # Custom hooks for API calls
    │   ├── styles/
    │   │   ├── Dashboard.css         # Dashboard styles
    │   │   └── SensorCard.css        # Sensor card styles
    │   ├── index.css                 # Global styles
    │   └── main.jsx                  # Entry point
    ├── .env.example                  # Example environment variables
    ├── package.json                  # Node dependencies
    └── vite.config.js               # Vite configuration
```

## 🚀 Quick Start

### 1. Hardware Setup (ESP32)

**Prerequisites:**
- PlatformIO installed
- ESP32 board connected via USB

**Installation:**
```bash
cd hardware
pio run --target upload --environment esp32dev
pio device monitor --baud 115200
```

**Configuration:**
Update WiFi credentials in `src/main.cpp`:
```cpp
const char* ssid = "Your WiFi SSID";
const char* password = "Your WiFi Password";
const char* mqtt_server = "test.mosquitto.org";  // Or your MQTT broker
```

### 2. Backend Setup (Python)

**Prerequisites:**
- Python 3.8+
- MongoDB (local or cloud)

**Installation:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Configuration:**
Create or update `.env` file:
```env
MQTT_BROKER=test.mosquitto.org
MQTT_PORT=1883
MQTT_TOPIC=aquatrace/sensors
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=aquatrace
```

**Running the server:**
```bash
python main.py
# Server will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Frontend Setup (React)

**Prerequisites:**
- Node.js 16+
- npm or yarn

**Installation:**
```bash
cd ui
npm install
```

**Configuration:**
Create `.env` file from `.env.example`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=Aqua-Trace Monitoring System
```

**Running the development server:**
```bash
npm run dev
# App will be available at http://localhost:5173
```

**Building for production:**
```bash
npm run build
npm run preview
```

## 📊 Sensor Specifications

| Sensor | Unit | Threshold | Alert Condition |
|--------|------|-----------|-----------------|
| **TDS** | ppm | 650 | > 650 ppm (too polluted) |
| **ORP** | mV | 200 | < 200 mV (low oxygen) |
| **Ammonia** | V | 0.25 | ≥ 0.25 V (toxic waste) |
| **Water Level** | cm | 6-15 | < 6 cm (overflow) or > 15 cm (leak) |
| **Weight** | g | - | Monitoring only |

## 🔌 MQTT Message Format

**Topic:** `aquatrace/sensors`

**Payload (JSON):**
```json
{
  "timestamp": 1623456789000,
  "tds": 450.5,
  "orp": 320.0,
  "ammonia": 0.15,
  "water_level": 10.5,
  "weight": 75.2
}
```

## 📡 API Endpoints

### Current Reading
```
GET /api/current-reading
Response: { reading: {...}, alerts: {...}, status: "online" }
```

### All Readings
```
GET /api/readings?limit=100
Response: { count: 100, readings: [...] }
```

### Time Range Query
```
GET /api/readings/range?start_time=1623456789000&end_time=1623460000000
Response: { count: N, readings: [...] }
```

### Alert Status
```
GET /api/alerts
Response: { tds_alert: bool, orp_alert: bool, ... }
```

### Thresholds
```
GET /api/thresholds
Response: { AMMONIA_ALERT: 0.25, MIN_ORP: 200, ... }
```

### System Status
```
GET /api/status
Response: { system: "online", mqtt: "connected", timestamp: "..." }
```

## 🎯 Team Dashboards

- **Master Control Panel** 🎛️ - Complete system overview and all alerts
- **Jett's Dashboard** 🦞 - Personal monitoring view
- **Edilyn's Dashboard** 🦞 - Personal monitoring view
- **Emma's Dashboard** 🦞 - Personal monitoring view
- **Maria's Dashboard** 🦞 - Personal monitoring view
- **Deci's Dashboard** 🦞 - Personal monitoring view
- **Cyleen's Dashboard** 🦞 - Personal monitoring view

All dashboards display the same real-time sensor data with alert indicators.

## 🔧 Troubleshooting

### ESP32 Not Connecting to WiFi
- Verify WiFi credentials in `src/main.cpp`
- Check WiFi signal strength
- Restart ESP32

### Backend Not Receiving MQTT Messages
- Check MQTT broker connectivity: `mosquitto_sub -h test.mosquitto.org -t "aquatrace/sensors"`
- Verify ESP32 is publishing to correct topic
- Check firewall settings

### Frontend Cannot Connect to Backend
- Verify backend is running on `http://localhost:8000`
- Update `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Verify `MONGO_URI` in `.env`
- Check MongoDB authentication credentials

## 📚 Dependencies

### Hardware
- Arduino Framework
- HX711 Library (v0.7.4)
- PubSubClient (v2.8)

### Backend
- FastAPI
- Paho MQTT Client
- PyMongo
- Python-dotenv

### Frontend
- React 18
- Vite
- JavaScript (ES6+)

## 📝 Notes

- All dashboards display the same live data
- System updates every 2 seconds
- MQTT uses public broker (consider private broker for production)
- MongoDB uses local instance by default
- Team members can be added/removed in `App.jsx`

## 📄 License

Aqua-Trace © 2024 - Educational & Research Use

---

**For questions or issues, please check the system logs and API documentation at `/docs`**
# aquatrace
# aquatrace
