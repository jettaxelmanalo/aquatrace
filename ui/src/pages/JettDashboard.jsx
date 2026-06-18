import { useSensorData, useThresholds } from '../hooks/useSensorData'
import SensorCard from '../components/SensorCard'
import ActuatorStatus from '../components/ActuatorStatus' // Added the status component
import '../styles/MasterDashboard.css' // Ensure the CSS is still linked

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Updated Winch labels to include the degrees
const CONTROL_COMMANDS = [
  { label: 'Auto Mode', command: 'AUTO_MODE', kind: 'active' },
  { label: 'Manual Mode', command: 'MANUAL_MODE', kind: 'active' },
  { label: 'Pump ON', command: 'PUMP_ON' },
  { label: 'Pump OFF', command: 'PUMP_OFF' },
  { label: 'UV ON', command: 'UV_ON' },
  { label: 'UV OFF', command: 'UV_OFF' },
  { label: 'Solenoid ON', command: 'SOLENOID_ON' },
  { label: 'Solenoid OFF', command: 'SOLENOID_OFF' },
  { label: 'Winch UP (90°)', command: 'WINCH_UP' },
  { label: 'Winch DOWN (0°)', command: 'WINCH_DOWN' },
  { label: 'Dispense Feed', command: 'STEPPER_DISPENSE', kind: 'feed' },
]

function JettDashboard() {
  const { data, alerts, loading, error } = useSensorData()
  const thresholds = useThresholds()

  const sendCommand = async (cmd) => {
    try {
      await fetch(`${API_URL}/command/${cmd}`, { method: 'POST' })
    } catch (commandError) {
      console.error(`Failed to send ${cmd}:`, commandError)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading Jett dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  if (!data || !alerts) {
    return (
      <div className="dashboard">
        <div className="error">No sensor data available</div>
      </div>
    )
  }

  const summaryAlerts = [
    alerts.water_level_low && '🔴 Water distance needs attention',
    alerts.tds_alert && '🚨 TDS is above target',
    alerts.feed_empty_alert && '⚠️ Feed hopper is running low',
  ].filter(Boolean)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Jett Dashboard</h1>
        <div className="meta">
          <p className="subtitle">Focus: ultrasonic range, ORP, and TDS</p>
          <p className="timestamp">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="mode-indicator">
          System Mode: <strong>{data.auto_mode ? 'AUTOMATIC' : 'MANUAL OVERRIDE'}</strong>
        </div>
      </header>

      <div className="control-panel">
        <h3>Manual Controls</h3>
        <div className="button-group">
          {CONTROL_COMMANDS.map((button) => (
            <button
              key={button.command}
              className={
                button.kind === 'feed'
                  ? 'btn-feed'
                  : button.kind === 'active'
                    ? data.auto_mode
                      ? 'btn-active'
                      : 'btn-inactive'
                    : 'btn-inactive'
              }
              onClick={() => sendCommand(button.command)}
            >
              {button.label}
            </button>
          ))}
        </div>

        {/* --- ACTUATOR STATUS PANEL --- */}
        <ActuatorStatus status={{ 
          pump_on: data.pump_on, 
          uv_on: data.uv_on, 
          solenoid_on: data.solenoid_on, 
          is_feeding: data.is_feeding,
          winch_angle: data.winch_angle, 
          sms_sent: data.sms_sent 
        }} />
      </div>

      <div className="sensors-grid">
        <SensorCard
          icon="📏"
          title="Ultrasonic Distance"
          value={data.distance}
          unit="cm"
          isAlert={alerts.water_level_low}
          alertMessage={alerts.water_level_low ? 'Ultrasonic distance is outside the safe range.' : null}
          threshold={thresholds ? `Alert at ${thresholds.CRITICAL_LOW_WATER} cm` : 'N/A'}
        />

        <SensorCard
          icon="⚖️"
          title="TDS Level"
          value={data.tds}
          unit="ppm"
          isAlert={alerts.tds_alert}
          alertMessage={alerts.tds_alert ? 'TDS needs a water change.' : null}
          threshold={thresholds ? `${thresholds.MAX_TDS} ppm` : 'N/A'}
        />

        <SensorCard
          icon="⚗️"
          title="ORP Level"
          value={data.orp}
          unit="mV"
          isAlert={alerts.orp_alert}
          alertMessage={alerts.orp_alert ? 'ORP is below the target floor.' : null}
          threshold={thresholds ? `Min ${thresholds.MIN_ORP} mV` : 'N/A'}
        />
      </div>

      <div className="alert-summary">
        <h3>⚡ Jett Summary</h3>
        <div className="alerts-list">
          {summaryAlerts.length ? summaryAlerts.map((item) => (
            <div className="alert-item" key={item}>{item}</div>
          )) : <div className="no-alerts">✅ Jett view is stable</div>}
        </div>
      </div>
    </div>
  )
}

export default JettDashboard