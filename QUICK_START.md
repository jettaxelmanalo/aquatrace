# 🚀 Quick Start - Local MQTT Setup (Pi 5)

## Complete Setup in 5 Steps

### ✅ Step 1: Install Mosquitto on Pi 5 (5 minutes)

SSH into your Pi 5:
```bash
ssh pi@192.168.1.73
```

Run setup:
```bash
# Install & start Mosquitto
sudo apt update && sudo apt upgrade -y
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Verify running
sudo systemctl status mosquitto
```

✓ **Mosquitto is now running at 192.168.1.73:1883**

---

### ✅ Step 2: Upload ESP32 Code (5 minutes)

On your computer:
```bash
cd /home/jettaxel/Desktop/Microcontroller/Hardware
pio run --target upload --environment esp32dev
pio device monitor --baud 115200
```

**Look for:**
```
✓ WiFi Connected!
✓ MQTT connected
✓ Data published to MQTT:
  {"timestamp":..., "tds":..., ...}
```

✓ **ESP32 is now publishing sensor data to Pi 5**

---

### ✅ Step 3: Start Python Backend (3 minutes)

On your computer (or Pi 5):
```bash
cd /home/jettaxel/Desktop/Microcontroller/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Look for:**
```
✓ MQTT Connected to 192.168.1.73:1883
✓ Subscribed to topic: aquatrace/sensors
✓ Received MQTT message: {...}
✓ Data saved to database
```

✓ **Backend is listening and storing data**

---

### ✅ Step 4: Start React Frontend (2 minutes)

Open new terminal:
```bash
cd /home/jettaxel/Desktop/Microcontroller/ui

# Create .env if needed
echo "VITE_API_URL=http://localhost:8000/api" > .env

npm install  # First time only
npm run dev
```

Open browser: **http://localhost:5173**

✓ **Dashboard is live!**

---

### ✅ Step 5: Navigate & Monitor (1 minute)

1. Open http://localhost:5173
2. Click through dashboards using the navbar
3. See real-time sensor data updating every 2 seconds

**You now have a complete local monitoring system! 🎉**

---

## 🔗 What's Happening

```
ESP32 (Tank) ─WiFi─> Mosquitto (Pi 5: 192.168.1.73)
                          ↓ MQTT message
                      Backend (FastAPI)
                          ↓ saves to
                      MongoDB
                          ↓ requests via
                      React Dashboard
```

---

## 🔍 Troubleshooting

### ESP32 won't connect to MQTT
```bash
# On Pi 5, verify Mosquitto is running:
sudo systemctl status mosquitto

# Check if port is open:
netstat -an | grep 1883
```

### Backend can't connect to MQTT
```bash
# Update .env with correct broker:
MQTT_BROKER=192.168.1.73

# Restart backend
# Stop current with Ctrl+C
python main.py
```

### Frontend shows "Error"
```bash
# Make sure backend is running on port 8000
# http://localhost:8000/docs should work

# Update .env if backend is on different machine:
VITE_API_URL=http://192.168.1.73:8000/api
npm run dev
```

---

## 📚 Full Documentation

- [LOCAL_MQTT_SETUP.md](LOCAL_MQTT_SETUP.md) - Detailed setup guide
- [README.md](README.md) - Complete project docs
- [setup_pi5_mosquitto.sh](setup_pi5_mosquitto.sh) - Automated Pi 5 setup

---

**Everything is set to local! You're running completely on your home network. 🏡**
