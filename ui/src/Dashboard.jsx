import { useState, useEffect } from 'react'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Dashboard() {
  // 1. Matched state to the exact JSON from the ESP32/FastAPI
  const [sensorData, setSensorData] = useState({
    distance: 0,
    tds: 0,
    orp: 0,
    ammonia: 0,
    ir_triggered: false,
    weight: 0,
    auto_mode: true,
    timestamp: new Date()
  })

  // 2. Alerts matching the FastAPI backend alert dictionary
  const [alerts, setAlerts] = useState({
    tds_alert: false,
    orp_alert: false,
    ammonia_alert: false,
    water_level_low: false,
    feed_empty_alert: false
  })

  // 3. Hardware thresholds perfectly synced with your ESP32
  const THRESHOLDS = {
    AMMONIA_ALERT: 1500,     // Raw ADC
    MIN_ORP: 1500.0,         // mV
    MAX_TDS: 200.0,          // ppm
    CRITICAL_LOW_WATER: 18.0,// Distance in cm
    FEED_EMPTY_WARNING: 50.0 // Grams
  }

  // 4. Connect to FastAPI Server on the Pi 5
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const response = await fetch(`${API_URL}/current-reading`)
        if (response.ok) {
          const data = await response.json();
          
          setSensorData({
            ...data.reading,
            timestamp: new Date()
          });
          
          // Let the Python backend handle the alert math!
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error("Waiting for backend connection...");
      }
    };

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // 5. Control Panel Functions (Sends POST to FastAPI)
  const sendCommand = async (cmd) => {
    try {
      await fetch(`${API_URL}/command/${cmd}`, { method: 'POST' });
    } catch (e) {
      console.error("Failed to send command:", e);
    }
  }

  const triggerFeeding = async () => {
    try {
      await fetch(`${API_URL}/feed`, { method: 'POST' });
      alert("Feeding sequence initiated! Winch and Stepper are activating.");
    } catch (e) {
      console.error("Failed to trigger feed:", e);
    }
  }

  const getStatusClass = (isAlert) => isAlert ? 'alert' : 'optimal';
  const getStatusText = (isAlert) => isAlert ? 'ALERT' : 'Optimal';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Aqua-Trace: Single-Tank Monitoring System</h1>
        <p className="subtitle">Live telemetry with manual actuator overrides</p>
        <p className="timestamp">Last updated: {sensorData.timestamp.toLocaleTimeString()}</p>
        <div className="mode-indicator">
            System Mode: <strong>{sensorData.auto_mode ? "AUTOMATIC" : "MANUAL OVERRIDE"}</strong>
        </div>
      </header>

      {/* --- CONTROL PANEL --- */}
      <div className="control-panel">
        <h3>System Controls</h3>
        <div className="button-group">
          <button 
            className={sensorData.auto_mode ? "btn-active" : "btn-inactive"}
            onClick={() => sendCommand("AUTO_MODE")}
          >
            Auto Mode
          </button>
          <button 
            className={!sensorData.auto_mode ? "btn-active alert-btn" : "btn-inactive"}
            onClick={() => sendCommand("MANUAL_MODE")}
          >
            Manual Mode
          </button>
          <button className="btn-feed" onClick={triggerFeeding}>
            🐟 Dispense 4g Feed
          </button>
        </div>

        {/* Manual Overrides only show when Auto Mode is OFF */}
        {!sensorData.auto_mode && (
            <div className="manual-overrides">
              <div className="override-group">
                <h4>Relay Overrides:</h4>
                <button onClick={() => sendCommand("PUMP_ON")}>Pump ON</button>
                <button onClick={() => sendCommand("PUMP_OFF")}>Pump OFF</button>
                <button onClick={() => sendCommand("UV_ON")}>UV ON</button>
                <button onClick={() => sendCommand("UV_OFF")}>UV OFF</button>
                <button onClick={() => sendCommand("SOLENOID_ON")}>Solenoid ON</button>
                <button onClick={() => sendCommand("SOLENOID_OFF")}>Solenoid OFF</button>
              </div>
              
              <div className="override-group" style={{ marginTop: '15px' }}>
                <h4>Feeder Overrides:</h4>
                <button onClick={() => sendCommand("WINCH_UP")}>Winch UP</button>
                <button onClick={() => sendCommand("WINCH_DOWN")}>Winch DOWN</button>
                <button onClick={() => sendCommand("STEPPER_DISPENSE")}>Drop 1g Feed</button>
              </div>
            </div>
        )}
      </div>

      <div className="sensors-grid">
        {/* TDS Level Card */}
        <div className={`sensor-card ${getStatusClass(alerts.tds_alert)}`}>
          <div className="sensor-icon">💧</div>
          <h2>TDS Level</h2>
          <div className="sensor-value">
            <span className="value">{sensorData.tds.toFixed(0)}</span>
            <span className="unit">ppm</span>
          </div>
          <div className={`sensor-status ${getStatusClass(alerts.tds_alert)}`}>
            {getStatusText(alerts.tds_alert)}
          </div>
          <div className="threshold-info">
            Max Threshold: {THRESHOLDS.MAX_TDS} ppm
          </div>
          {alerts.tds_alert && (
            <div className="alert-message">🚨 TDS HIGH! Pump activating.</div>
          )}
        </div>

        {/* ORP Level Card */}
        <div className={`sensor-card ${getStatusClass(alerts.orp_alert)}`}>
          <div className="sensor-icon">⚗️</div>
          <h2>ORP Level</h2>
          <div className="sensor-value">
            <span className="value">{sensorData.orp.toFixed(0)}</span>
            <span className="unit">mV</span>
          </div>
          <div className={`sensor-status ${getStatusClass(alerts.orp_alert)}`}>
            {getStatusText(alerts.orp_alert)}
          </div>
          <div className="threshold-info">
            Min Safe: {THRESHOLDS.MIN_ORP} mV
          </div>
          {alerts.orp_alert && (
            <div className="alert-message">🔴 LOW WATER QUALITY! UV Activating.</div>
          )}
        </div>

        {/* Ammonia Gas Card */}
        <div className={`sensor-card ${getStatusClass(alerts.ammonia_alert)}`}>
          <div className="sensor-icon">☠️</div>
          <h2>Ammonia Gas</h2>
          <div className="sensor-value">
            <span className="value">{sensorData.ammonia}</span>
            <span className="unit">Raw ADC</span>
          </div>
          <div className={`sensor-status ${getStatusClass(alerts.ammonia_alert)}`}>
            {getStatusText(alerts.ammonia_alert)}
          </div>
          <div className="threshold-info">
            Max Threshold: {THRESHOLDS.AMMONIA_ALERT}
          </div>
          {alerts.ammonia_alert && (
            <div className="alert-message">🔴 CRITICAL: GSM sending SMS warning!</div>
          )}
        </div>

        {/* Water Level (Distance) Card */}
        <div className={`sensor-card ${getStatusClass(alerts.water_level_low)}`}>
          <div className="sensor-icon">📏</div>
          <h2>Water Distance</h2>
          <div className="sensor-value">
            <span className="value">{sensorData.distance.toFixed(1)}</span>
            <span className="unit">cm</span>
          </div>
          <div className={`sensor-status ${getStatusClass(alerts.water_level_low)}`}>
            {getStatusText(alerts.water_level_low)}
          </div>
          <div className="threshold-info">
            Max Drop: {THRESHOLDS.CRITICAL_LOW_WATER} cm
          </div>
          {alerts.water_level_low && (
            <div className="alert-message">🔴 WATER LOW! Solenoid opening.</div>
          )}
        </div>

        {/* Feed Hopper Weight Card */}
        <div className={`sensor-card ${getStatusClass(alerts.feed_empty_alert)}`}>
          <div className="sensor-icon">⚖️</div>
          <h2>Hopper Weight</h2>
          <div className="sensor-value">
            <span className="value">{sensorData.weight.toFixed(1)}</span>
            <span className="unit">g</span>
          </div>
          <div className={`sensor-status ${getStatusClass(alerts.feed_empty_alert)}`}>
            {getStatusText(alerts.feed_empty_alert)}
          </div>
          <div className="threshold-info">
            Refill at: {THRESHOLDS.FEED_EMPTY_WARNING} g
          </div>
          {alerts.feed_empty_alert && (
            <div className="alert-message">⚠️ HOPPER EMPTY! Please refill.</div>
          )}
        </div>

        {/* IR Hide Status Card */}
        <div className="sensor-card optimal">
          <div className="sensor-icon">🦞</div>
          <h2>Hide Status (IR)</h2>
          <div className="sensor-value" style={{ fontSize: '1.5rem', marginTop: '15px' }}>
            <span className="value">{sensorData.ir_triggered ? "Occupied" : "Clear"}</span>
          </div>
          <div className="sensor-status optimal">
            {sensorData.ir_triggered ? "Winch Ready to Lift" : "Monitoring"}
          </div>
        </div>

      </div>

      {/* Alert Summary */}
      <div className="alert-summary">
        <h3>⚡ Active Alerts</h3>
        <div className="alerts-list">
          {Object.values(alerts).some(a => a) ? (
            <>
              {alerts.tds_alert && <div className="alert-item">🚨 TDS Level High</div>}
              {alerts.orp_alert && <div className="alert-item">🔴 ORP Level Low</div>}
              {alerts.ammonia_alert && <div className="alert-item">🔴 High Toxic Ammonia</div>}
              {alerts.water_level_low && <div className="alert-item">🔴 Water Level Critically Low</div>}
              {alerts.feed_empty_alert && <div className="alert-item">⚠️ Feed Hopper Needs Refill</div>}
            </>
          ) : (
            <div className="no-alerts">✅ All systems nominal</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard