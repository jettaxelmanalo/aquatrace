# 🦞 Local Mosquitto Setup Guide (Pi 5)

## Overview

Instead of using a public MQTT broker (`test.mosquitto.org`), you'll run **Mosquitto** locally on your **Raspberry Pi 5** at `192.168.1.73`. This is more secure and faster for local networks.

## Architecture (Updated)

```
ESP32 (Tank)
    ↓
    WiFi (192.168.1.73:1883)
    ↓
Mosquitto on Pi 5 (Local MQTT Broker)
    ↓
    TCP (localhost:1883)
    ↓
Python FastAPI Backend (on Pi 5 or same network)
    ↓
    MongoDB (on Pi 5 or same network)
    ↓
React Dashboard (any computer on network)
```

## Step 1: Setup Mosquitto on Pi 5

### Option A: Automated Setup (Easiest)

On your **Raspberry Pi 5**, run:

```bash
# Copy the setup script to Pi 5 (from your computer)
scp setup_pi5_mosquitto.sh pi@192.168.1.73:/home/pi/

# SSH into Pi 5
ssh pi@192.168.1.73

# Make script executable
chmod +x setup_pi5_mosquitto.sh

# Run the setup
./setup_pi5_mosquitto.sh
```

### Option B: Manual Setup

SSH into Pi 5:
```bash
ssh pi@192.168.1.73
```

Install Mosquitto:
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y mosquitto mosquitto-clients
```

Enable and start:
```bash
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

Verify it's running:
```bash
sudo systemctl status mosquitto
```

## Step 2: Test Mosquitto Connection

On your **Pi 5**, subscribe to the topic:
```bash
mosquitto_sub -h 192.168.1.73 -t "aquatrace/sensors"
```

The connection is ready! Data will appear here when ESP32 publishes.

## Step 3: Configure ESP32

The code is **already updated** to use `192.168.1.73`.

**File:** `Hardware/src/main.cpp` (already set)
```cpp
const char* mqtt_server = "192.168.1.73";  // Pi 5 IP
const char* mqtt_topic = "aquatrace/sensors";
```

Just upload to ESP32:
```bash
cd hardware
pio run --target upload --environment esp32dev
pio device monitor --baud 115200
```

**Look for output like:**
```
Connecting to WiFi: Redmi Note 13 Pro 5G
WiFi Connected!
IP: 192.168.x.x
Attempting MQTT connection...connected
✓ Data published to MQTT:
{"timestamp":1234567890,"tds":450.5,"orp":320.0,"ammonia":0.15,"water_level":10.5,"weight":75.2}
```

## Step 4: Configure Backend

**File:** `backend/.env` (already updated)
```env
MQTT_BROKER=192.168.1.73
MQTT_PORT=1883
MQTT_TOPIC=aquatrace/sensors
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=aquatrace
```

Run the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Look for:**
```
✓ MQTT client initialized - connecting to 192.168.1.73:1883
✓ MQTT Connected to 192.168.1.73:1883
✓ Subscribed to topic: aquatrace/sensors
✓ Received MQTT message: {...}
✓ Data saved to database
```

## Step 5: Run Frontend

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173` and navigate to any dashboard!

---

## 🔍 Troubleshooting

### ESP32 Can't Connect to MQTT
```bash
# On Pi 5, verify Mosquitto is running:
sudo systemctl status mosquitto

# If not running:
sudo systemctl start mosquitto

# Check firewall allows port 1883:
sudo ufw allow 1883
```

### Can't Connect from Computer to Pi 5
```bash
# Verify Pi 5 is reachable:
ping 192.168.1.73

# Test MQTT connection:
mosquitto_sub -h 192.168.1.73 -t "aquatrace/sensors"
```

### Backend Sees No Data
```bash
# Manually test MQTT on Pi 5:
mosquitto_sub -h 192.168.1.73 -t "aquatrace/sensors" -v

# Check backend logs for connection errors:
python main.py  # Should show connection status
```

### Frontend Can't Reach Backend
- Verify backend is running: `http://192.168.1.73:8000`
- Update frontend `.env`:
  ```env
  VITE_API_URL=http://192.168.1.73:8000/api
  ```
- If backend is on different machine, use its IP

---

## 📝 Network Setup Summary

| Device | IP | Role |
|--------|-----|------|
| ESP32 | (WiFi) | Sensor collector |
| Pi 5 | 192.168.1.73 | MQTT Broker + Backend |
| Your Computer | (WiFi) | Frontend access |
| MongoDB | localhost:27017 | Database on Pi 5 |

---

## 🔐 Optional: Add Authentication

If you want password protection on Mosquitto:

**On Pi 5:**
```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd aquatrace
# Enter password when prompted

# Edit Mosquitto config
sudo nano /etc/mosquitto/mosquitto.conf
```

Add at the end:
```
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Restart:
```bash
sudo systemctl restart mosquitto
```

Update ESP32 & Backend to include credentials (ask me to update if needed).

---

## ✅ Verification Checklist

- [ ] Mosquitto installed and running on Pi 5
- [ ] `mosquitto_sub` shows messages on Pi 5
- [ ] ESP32 connects and publishes data
- [ ] Backend receives and stores data
- [ ] Frontend displays real-time data
- [ ] All dashboards show same data

**Everything is now running locally! 🚀**
