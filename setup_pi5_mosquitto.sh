#!/bin/bash
# ==========================================
# Raspberry Pi 5 - Mosquitto MQTT Setup
# ==========================================
# This script installs and configures Mosquitto (MQTT Broker) on Pi 5

echo "🔧 Aqua-Trace: Pi 5 Mosquitto Setup"
echo "===================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Mosquitto
echo "📥 Installing Mosquitto MQTT Broker..."
sudo apt install -y mosquitto mosquitto-clients

# Enable Mosquitto service
echo "🚀 Enabling Mosquitto service..."
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Check if running
echo "✅ Checking Mosquitto status..."
sudo systemctl status mosquitto

# Get Pi 5 IP
echo ""
echo "📡 Your Pi 5 MQTT Broker Details:"
echo "================================="
BROKER_IP=$(hostname -I | awk '{print $1}')
echo "Broker IP: $BROKER_IP"
echo "Port: 1883"
echo "Topic: aquatrace/sensors"
echo ""
echo "Configuration:"
echo "- Update ESP32: MQTT_BROKER = \"$BROKER_IP\""
echo "- Update Backend (.env): MQTT_BROKER=$BROKER_IP"
echo ""

# Optional: Configure password authentication (comment out if not needed)
# echo "🔐 Setting up authentication..."
# sudo mosquitto_passwd -c /etc/mosquitto/passwd_file aquatrace
# echo "Add this to /etc/mosquitto/mosquitto.conf:"
# echo "  allow_anonymous false"
# echo "  password_file /etc/mosquitto/passwd_file"

echo "✅ Mosquitto setup complete!"
echo ""
echo "📝 Test connection from your computer:"
echo "   mosquitto_sub -h $BROKER_IP -t 'aquatrace/sensors'"
echo ""
echo "🔗 Full setup guide: Check README.md in the project root"
