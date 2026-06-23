import { memo } from 'react'

const SensorCard = memo(function SensorCard({ title, value, unit, isAlert, alertMessage, threshold, actuator }) {
  const formattedValue = () => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
    }
    return value || '—'
  }

  return (
    <div className={`sensor-card ${isAlert ? 'alert' : 'optimal'}`}>
      <div className="card-header">
        <span className="card-title">{title}</span>
        <span className={`status-pill ${isAlert ? 'alert' : 'optimal'}`}>
          {isAlert ? '⚠ ALERT' : '✓ OK'}
        </span>
      </div>

      <div className="sensor-value">
        <span className="value">{formattedValue()}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>

      {isAlert && alertMessage && (
        <div className="alert-message">
          <span className="alert-icon">!</span>
          {alertMessage}
        </div>
      )}

      {threshold && !isAlert && (
        <div className="threshold-info">{threshold}</div>
      )}

      {actuator && (
        <div className="actuator-section">
          <div className={`actuator-row ${actuator.error ? 'err' : actuator.active ? 'on' : 'off'}`}>
            <div className="actuator-left">
              <span className={`dot ${actuator.error ? 'err' : actuator.active ? 'on' : 'off'}`} />
              <span className="actuator-label">{actuator.label}</span>
            </div>
            <span className={`actuator-badge ${actuator.error ? 'err' : actuator.active ? 'on' : 'off'}`}>
              {actuator.error ? 'ERR' : actuator.active ? 'ON' : 'OFF'}
              {actuator.detail ? ` · ${actuator.detail}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
})

export default SensorCard