import '../styles/ActuatorStatus.css'

function ActuatorStatus({ status }) {
  return (
    <div className="actuator-panel">
      <h3>Hardware State</h3>
      <div className="status-grid">
        <div className={`status-item ${status.pump_on ? 'active' : ''}`}>PUMP</div>
        <div className={`status-item ${status.uv_on ? 'active' : ''}`}>UV</div>
        <div className={`status-item ${status.solenoid_on ? 'active' : ''}`}>VALVE</div>
        <div className={`status-item ${status.is_feeding ? 'active' : ''}`}>FEEDER</div>
        
        <div className={`status-item ${status.winch_angle > 0 ? 'active' : ''}`}>
          WINCH: {status.winch_angle || 0}°
        </div>
        <div className={`status-item ${status.sms_sent ? 'active' : ''}`}>GSM SMS</div>
      </div>
    </div>
  )
}
export default ActuatorStatus