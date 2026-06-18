import { useSensorData, useThresholds } from '../hooks/useSensorData'
import SensorCard from '../components/SensorCard'
import '../styles/Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const CONTROL_COMMANDS = [
  { label: 'Auto Mode', command: 'AUTO_MODE', kind: 'active' },
  { label: 'Manual Mode', command: 'MANUAL_MODE', kind: 'active' },
  { label: 'Pump ON', command: 'PUMP_ON' },
  { label: 'Pump OFF', command: 'PUMP_OFF' },
  { label: 'UV ON', command: 'UV_ON' },
  { label: 'UV OFF', command: 'UV_OFF' },
  { label: 'Solenoid ON', command: 'SOLENOID_ON' },
  { label: 'Solenoid OFF', command: 'SOLENOID_OFF' },
  { label: 'Winch UP', command: 'WINCH_UP' },
  { label: 'Winch DOWN', command: 'WINCH_DOWN' },
  { label: 'Dispense Feed', command: 'STEPPER_DISPENSE', kind: 'feed' },
]

function DeciDashboard() {
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
        <div className="loading">Loading Deci dashboard...</div>
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
    alerts.ammonia_alert && '🔴 Toxic waste threshold exceeded',
    alerts.orp_alert && '⚗️ ORP needs a boost',
    alerts.tds_alert && '💧 TDS is above target',
  ].filter(Boolean)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Deci Dashboard</h1>
        <p className="timestamp">Focus: ORP, TDS, and load cell</p>
        <p className="timestamp">Last updated: {new Date().toLocaleTimeString()}</p>
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
      </div>

      <div className="sensors-grid">
        <SensorCard
          icon="⚗️"
          title="ORP Level"
          value={data.orp}
          unit="mV"
          isAlert={alerts.orp_alert}
          alertMessage={alerts.orp_alert ? 'ORP is below the safe threshold.' : null}
          threshold={thresholds ? `Min ${thresholds.MIN_ORP} mV` : 'N/A'}
        />

        <SensorCard
          icon="💧"
          title="TDS Level"
          value={data.tds}
          unit="ppm"
          isAlert={alerts.tds_alert}
          alertMessage={alerts.tds_alert ? 'TDS is running high.' : null}
          threshold={thresholds ? `${thresholds.MAX_TDS} ppm` : 'N/A'}
        />

        <SensorCard
          icon="⚖️"
          title="Load Cell"
          value={data.weight}
          unit="g"
          isAlert={alerts.feed_empty_alert}
          alertMessage={alerts.feed_empty_alert ? 'Feed hopper needs a refill.' : null}
          threshold={thresholds ? `Refill below ${thresholds.FEED_EMPTY_WARNING} g` : 'N/A'}
        />
      </div>

      <div className="alert-summary">
        <h3>⚡ Deci Summary</h3>
        <div className="alerts-list">
          {summaryAlerts.length ? summaryAlerts.map((item) => (
            <div className="alert-item" key={item}>{item}</div>
          )) : <div className="no-alerts">✅ Chemistry alarms are clear</div>}
        </div>
      </div>
    </div>
  )
}

export default DeciDashboard
