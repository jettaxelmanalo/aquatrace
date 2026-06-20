import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export function useSensorHistory(limit = 40) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/readings?limit=${limit}`)
        if (!res.ok) return
        const data = await res.json()
        
        if (data.readings) {
          const formattedData = data.readings.map(item => ({
            ...item,
            time: new Date(item.server_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          })).reverse()
          
          setHistory(formattedData)
        }
      } catch (err) {
        console.error("Failed to fetch historical data:", err)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 5000)
    return () => clearInterval(interval)
  }, [limit])

  return history
}