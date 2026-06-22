import React from 'react'
import '../styles/ActuatorStatus.css'

function ActuatorStatus({ status }) {
  return (
    <div className="actuator-status-panel">
      <h4>Hardware Status</h4>
      <div className="status-grid">
        
        <div className="status-item">
          <span className={`status-light ${status.pump_on ? 'on' : 'off'}`}></span>
          <span className="status-label">Water Pump</span>
        </div>

        <div className="status-item">
          <span className={`status-light ${status.uv_on ? 'on' : 'off'}`}></span>
          <span className="status-label">UV Sterilizer</span>
        </div>

        <div className="status-item">
          <span className={`status-light ${status.solenoid_on ? 'on' : 'off'}`}></span>
          <span className="status-label">Solenoid Valve</span>
        </div>

        <div className="status-item">
          <span className={`status-light ${status.is_feeding ? 'on' : 'off'}`}></span>
          <span className="status-label">Stepper Motor</span>
        </div>

        {/* NEW: GSM Signal Status */}
        <div className="status-item">
          <span className={`status-light ${status.gsm_ok ? 'on' : 'error'}`}></span>
          <span className="status-label">GSM Signal</span>
        </div>

        {/* SMS Status */}
        <div className="status-item">
          <span className={`status-light ${status.sms_sent ? 'on' : 'off'}`}></span>
          <span className="status-label">SMS Alert Sent</span>
        </div>

      </div>
      
      <div className="winch-status" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #2b2b2b' }}>
        <span className="status-label" style={{ color: '#707070', fontSize: '0.8em' }}>Winch Position: </span>
        <strong style={{ color: '#f2f2f2' }}>{status.winch_angle}° {status.winch_angle === 90 ? '(LIFTED)' : '(LOWERED)'}</strong>
      </div>
    </div>
  )
}

export default ActuatorStatus