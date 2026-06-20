import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/MasterDashboard.css'

function SensorChart({ data, dataKey, title, color = '#f2f2f2', unit = '' }) {
  const CustomTooltip = ({ active, payload, label }) => {
    // payload is an array of series at this point — read payload[0].value, not payload.value
    if (active && payload && payload.length) {
      const rawValue = payload[0].value;

      // If the value is missing/null, show 'N/A', otherwise format it to 1 decimal
      const displayValue = (rawValue !== undefined && rawValue !== null) 
        ? Number(rawValue).toFixed(1) 
        : 'N/A';

      return (
        <div style={{ background: '#111', border: '1px solid #2b2b2b', padding: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
          <p style={{ color: '#707070', fontSize: '0.8em', margin: '0 0 5px 0' }}>{label}</p>
          <p style={{ color: color, fontSize: '1.2em', fontWeight: 'bold', margin: 0 }}>
            {displayValue} {unit}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="sensor-card" style={{ minHeight: '250px', padding: '20px' }}>
      <h2 style={{ marginBottom: '15px' }}>{title} Trend</h2>
      <div style={{ width: '100%', height: '180px' }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#707070', fontSize: 10 }} stroke="#2b2b2b" minTickGap={30} />
            <YAxis tick={{ fill: '#707070', fontSize: 10 }} stroke="#2b2b2b" domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#color-${dataKey})`} 
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default SensorChart