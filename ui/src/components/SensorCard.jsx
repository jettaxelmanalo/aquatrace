import { memo } from 'react'

const SensorCard = memo(function SensorCard({ title, value, unit, isAlert, alertMessage, threshold }) {
  const formattedValue = () => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
    }
    return value || '—'
  }

  return (
    <div className={`sensor-card ${isAlert ? 'alert' : 'optimal'}`}>
      <h2>{title}</h2>
      
      <div className="sensor-value">
        <span className="value">{formattedValue()}</span>
        <span className="unit">{unit}</span>
      </div>

      <div className={`sensor-status ${isAlert ? 'alert' : 'optimal'}`}>
        {isAlert ? 'ALERT' : 'OPTIMAL'}
      </div>

      {threshold && !isAlert && (
        <div className="threshold-info">
          {threshold}
        </div>
      )}
      
      {isAlert && alertMessage && (
        <div className="alert-message">{alertMessage}</div>
      )}
    </div>
  )
})

export default SensorCard