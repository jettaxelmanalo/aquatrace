import { useState, useEffect, useRef } from 'react'
import SensorCard from './components/SensorCard' // Adjust this path if your folder structure is different
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Dashboard() {
  const [sensorData, setSensorData] = useState({
    distance: 15.2,
    tds: 145,
    orp: 1650,
    ammonia: 800,
    ir_triggered: false,
    weight: 85.5,
    auto_mode: true,
  })

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState('offline')

  const [alerts, setAlerts] = useState({
    tds_alert: false,
    orp_alert: false,
    ammonia_alert: false,
    water_level_low: false,
    feed_empty_alert: false
  })

  const prevDataRef = useRef()

  const THRESHOLDS = {
    AMMONIA_ALERT: 1500,
    MIN_ORP: 1500.0,
    MAX_TDS: 200.0,
    CRITICAL_LOW_WATER: 18.0,
    FEED_EMPTY_WARNING: 50.0
  }

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const response = await fetch(`${API_URL}/current-reading`)
        if (response.ok) {
          const data = await response.json();
          const newDataString = JSON.stringify(data.reading);
          
          if (newDataString !== prevDataRef.current) {
            setSensorData(data.reading);
            setAlerts(data.alerts);
            setLastUpdated(new Date());
            prevDataRef.current = newDataString; 
          }
          
          setConnectionStatus('online');
        }
      } catch (error) {
        setConnectionStatus('offline');
      }
    };

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 3000); 
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Aqua-Trace: Single-Tank Monitoring System</h1>
        <p className="subtitle">Live telemetry with manual actuator overrides</p>
        
        <p className="timestamp">
          Last updated: {lastUpdated.toLocaleTimeString()} |{' '}
          <span style={{ color: connectionStatus === 'online' ? '#4ade80' : '#f87171' }}>
            {connectionStatus === 'online' ? '🟢 Live Data' : '🔴 Placeholder Data (Offline)'}
          </span>
        </p>
        
        <div className="mode-indicator">
            System Mode: <strong>{sensorData.auto_mode ? "AUTOMATIC" : "MANUAL OVERRIDE"}</strong>
        </div>
      </header>

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

      {/* Notice how clean this grid is now! */}
      <div className="sensors-grid">
        <SensorCard 
          title="TDS Level"
          icon="💧"
          value={sensorData.tds}
          unit="ppm"
          isAlert={alerts.tds_alert}
          threshold={`${THRESHOLDS.MAX_TDS} ppm (Max)`}
          alertMessage="🚨 TDS HIGH! Pump activating."
        />

        <SensorCard 
          title="ORP Level"
          icon="⚗️"
          value={sensorData.orp}
          unit="mV"
          isAlert={alerts.orp_alert}
          threshold={`${THRESHOLDS.MIN_ORP} mV (Min Safe)`}
          alertMessage="🔴 LOW WATER QUALITY! UV Activating."
        />

        <SensorCard 
          title="Ammonia Gas"
          icon="☠️"
          value={sensorData.ammonia}
          unit="Raw ADC"
          isAlert={alerts.ammonia_alert}
          threshold={`${THRESHOLDS.AMMONIA_ALERT} (Max)`}
          alertMessage="🔴 CRITICAL: GSM sending SMS warning!"
        />

        <SensorCard 
          title="Water Distance"
          icon="📏"
          value={sensorData.distance}
          unit="cm"
          isAlert={alerts.water_level_low}
          threshold={`${THRESHOLDS.CRITICAL_LOW_WATER} cm (Max Drop)`}
          alertMessage="🔴 WATER LOW! Solenoid opening."
        />

        <SensorCard 
          title="Hopper Weight"
          icon="⚖️"
          value={sensorData.weight}
          unit="g"
          isAlert={alerts.feed_empty_alert}
          threshold={`${THRESHOLDS.FEED_EMPTY_WARNING} g (Refill at)`}
          alertMessage="⚠️ HOPPER EMPTY! Please refill."
        />

        <SensorCard 
          title="Hide Status (IR)"
          icon="🦞"
          value={sensorData.ir_triggered ? "Occupied" : "Clear"}
          unit=""
          isAlert={false}
          threshold={sensorData.ir_triggered ? "Winch Ready to Lift" : "Monitoring"}
          alertMessage=""
        />
      </div>

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

export default Dashboard;