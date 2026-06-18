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

function EmmaDashboard() {
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
        <div className="loading">Loading Emma dashboard...</div>
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
    alerts.feed_empty_alert && '⚠️ Hopper level is low',
    alerts.water_level_low && '🔴 Water distance is outside the safe band',
    alerts.tds_alert && '🚨 TDS is above target',
  ].filter(Boolean)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Emma Dashboard</h1>
        <p className="timestamp">Focus: load cell, ammonia, and ORP</p>
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
          icon="⚖️"
          title="Load Cell"
          value={data.weight}
          unit="g"
          isAlert={alerts.feed_empty_alert}
          alertMessage={alerts.feed_empty_alert ? 'Hopper refill is due soon.' : null}
          threshold={thresholds ? `Refill below ${thresholds.FEED_EMPTY_WARNING} g` : 'N/A'}
        />

        <SensorCard
          icon="☠️"
          title="Ammonia Gas"
          value={data.ammonia}
          unit="Raw ADC"
          isAlert={alerts.ammonia_alert}
          alertMessage={alerts.ammonia_alert ? 'Ammonia is at critical level.' : null}
          threshold={thresholds ? `${thresholds.AMMONIA_ALERT} ADC` : 'N/A'}
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
        <h3>⚡ Emma Summary</h3>
        <div className="alerts-list">
          {summaryAlerts.length ? summaryAlerts.map((item) => (
            <div className="alert-item" key={item}>{item}</div>
          )) : <div className="no-alerts">✅ Feed and hide status look good</div>}
        </div>
      </div>
    </div>
  )
}

export default EmmaDashboard
