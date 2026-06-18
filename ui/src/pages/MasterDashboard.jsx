import { useSensorData, useThresholds } from '../hooks/useSensorData'
import SensorCard from '../components/SensorCard'
import '../styles/Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const MANUAL_COMMANDS = [
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

function MasterDashboard() {
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
        <div className="loading">Loading sensor data...</div>
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦞 Aqua-Trace: Master Control Panel</h1>
        <p className="timestamp">All sensors, all alerts, all controls</p>
        <p className="timestamp">Last updated: {new Date().toLocaleTimeString()}</p>
        <div className="mode-indicator">
          System Mode: <strong>{data.auto_mode ? 'AUTOMATIC' : 'MANUAL OVERRIDE'}</strong>
        </div>
      </header>

      <div className="control-panel">
        <h3>System Controls</h3>
        <div className="button-group">
          {MANUAL_COMMANDS.map((button) => (
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
          icon="💧"
          title="TDS Level"
          value={data.tds}
          unit="ppm"
          isAlert={alerts.tds_alert}
          alertMessage={alerts.tds_alert ? '🚨 TDS HIGH! Water change recommended.' : null}
          threshold={thresholds ? `${thresholds.MAX_TDS} ppm` : 'N/A'}
        />

        <SensorCard
          icon="⚗️"
          title="ORP Level"
          value={data.orp}
          unit="mV"
          isAlert={alerts.orp_alert}
          alertMessage={alerts.orp_alert ? '🔴 LOW OXYGEN RISK / STAGNANT WATER!' : null}
          threshold={thresholds ? `Min: ${thresholds.MIN_ORP} mV` : 'N/A'}
        />

        <SensorCard
          icon="☠️"
          title="Ammonia Gas"
          value={data.ammonia}
          unit="V"
          isAlert={alerts.ammonia_alert}
          alertMessage={alerts.ammonia_alert ? '🔴 CRITICAL ALERT: HIGH TOXIC WASTE DETECTED!' : null}
          threshold={thresholds ? `${thresholds.AMMONIA_ALERT} V` : 'N/A'}
        />

        <SensorCard
          icon="📏"
          title="Water Distance"
          value={data.distance}
          unit="cm"
          isAlert={alerts.water_level_low}
          alertMessage={
            alerts.water_level_low ? '🔴 WATER LEVEL OUT OF RANGE!' : null
          }
          threshold={thresholds ? `Low water alert at ${thresholds.CRITICAL_LOW_WATER} cm` : 'N/A'}
        />

        <SensorCard
          icon="⚖️"
          title="Scale Weight"
          value={data.weight}
          unit="g"
          isAlert={alerts.feed_empty_alert}
          alertMessage={alerts.feed_empty_alert ? '⚠️ FEED HOPPER LOW - refill soon.' : null}
          threshold={thresholds ? `Refill below ${thresholds.FEED_EMPTY_WARNING} g` : 'Real-time measurement'}
        />

        <SensorCard
          icon="🦞"
          title="Hide Status (IR)"
          value={data.ir_triggered ? 'Occupied' : 'Clear'}
          unit=""
          isAlert={false}
          threshold={data.ir_triggered ? 'Crayfish detected in hide' : 'Hide is clear'}
        />
      </div>

      <div className="alert-summary">
        <h3>⚡ Active Alerts</h3>
        <div className="alerts-list">
          {(alerts.tds_alert || alerts.orp_alert || alerts.ammonia_alert || 
            alerts.water_level_low || alerts.feed_empty_alert) ? (
            <>
              {alerts.tds_alert && <div className="alert-item">🚨 TDS Level High</div>}
              {alerts.orp_alert && <div className="alert-item">🔴 Low Oxygen Risk</div>}
              {alerts.ammonia_alert && <div className="alert-item">🔴 High Toxic Waste</div>}
              {alerts.water_level_low && <div className="alert-item">🔴 Water Distance Out of Range</div>}
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

export default MasterDashboard
