import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const useSensorData = () => {
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const readingRes = await fetch(`${API_URL}/current-reading`)
        const alertsRes = await fetch(`${API_URL}/alerts`)

        if (!readingRes.ok || !alertsRes.ok) {
          throw new Error('Failed to fetch sensor data')
        }

        const readingData = await readingRes.json()
        const alertsData = await alertsRes.json()

        setData(readingData.reading)
        setAlerts(alertsData) 
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching sensor data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [])

  return { data, alerts, loading, error }
}

export const useThresholds = () => {
  const [thresholds, setThresholds] = useState(null)

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await fetch(`${API_URL}/thresholds`)
        if (!res.ok) throw new Error('Failed to fetch thresholds')
        const data = await res.json()
        setThresholds(data)
      } catch (err) {
        console.error('Error fetching thresholds:', err)
      }
    }

    fetchThresholds()
  }, [])

  return thresholds
}

export const useReadingsHistory = (limit = 100) => {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/readings?limit=${limit}`)
        if (!res.ok) throw new Error('Failed to fetch readings')
        const data = await res.json()
        setReadings(data.readings || [])
      } catch (err) {
        console.error('Error fetching readings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReadings()
  }, [limit])

  return { readings, loading }
}
