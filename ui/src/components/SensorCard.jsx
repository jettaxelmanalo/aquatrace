import '../styles/SensorCard.css'

function SensorCard({ icon, title, value, unit, isAlert, alertMessage, threshold }) {
  const formattedValue = () => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
    }

    if (value === null || value === undefined) {
      return '—'
    }

    return value
  }

  return (
    <div className={`sensor-card ${isAlert ? 'alert' : 'optimal'}`}>
      <div className="sensor-icon">{icon}</div>
      <h2>{title}</h2>
      <div className="sensor-value">
        <span className="value">{formattedValue()}</span>
        <span className="unit">{unit}</span>
      </div>
      <div className={`sensor-status ${isAlert ? 'alert' : 'optimal'}`}>
        {isAlert ? 'ALERT' : 'Optimal'}
      </div>
      {threshold && (
        <div className="threshold-info">
          Threshold: {threshold}
        </div>
      )}
      {isAlert && alertMessage && (
        <div className="alert-message">{alertMessage}</div>
      )}
    </div>
  )
}

export default SensorCard
