import { useEffect, useState } from 'react'
import { trafficApi, type TrafficStats, type TrafficLimit } from '../api'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export default function Traffic() {
  const [stats, setStats] = useState<TrafficStats | null>(null)
  const [limit, setLimit] = useState<TrafficLimit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, limitRes] = await Promise.all([
          trafficApi.getStats(),
          trafficApi.getLimit(),
        ])
        setStats(statsRes.data.data ?? null)
        setLimit(limitRes.data.data ?? null)
      } catch (err) {
        console.error('Failed to fetch traffic data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <h2>Traffic</h2>
      
      <div className="card">
        <h3>Traffic Statistics</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Download</span>
            <span className="value">{formatBytes(stats?.rx_bytes ?? 0)}</span>
          </div>
          <div className="info-item">
            <span className="label">Upload</span>
            <span className="value">{formatBytes(stats?.tx_bytes ?? 0)}</span>
          </div>
          <div className="info-item">
            <span className="label">Total</span>
            <span className="value">{formatBytes(stats?.total_bytes ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Traffic Limit</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Status</span>
            <span className="value">{limit?.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="info-item">
            <span className="label">Current Usage</span>
            <span className="value">{formatBytes(limit?.current_bytes ?? 0)}</span>
          </div>
          <div className="info-item">
            <span className="label">Limit</span>
            <span className="value">{limit?.limit_bytes ? formatBytes(limit.limit_bytes) : 'Not set'}</span>
          </div>
        </div>
        {limit?.limit_bytes && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(100, (limit.current_bytes / limit.limit_bytes) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <style>{`
        .progress-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          margin-top: 1rem;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #646cff;
          transition: width 0.3s;
        }
      `}</style>
    </div>
  )
}
