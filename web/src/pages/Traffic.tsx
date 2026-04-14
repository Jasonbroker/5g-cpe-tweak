import { useEffect, useState, useRef } from 'react'
import { trafficApi, type TrafficStats, type TrafficLimit } from '../api'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`
}

export default function Traffic() {
  const [stats, setStats] = useState<TrafficStats | null>(null)
  const [limit, setLimit] = useState<TrafficLimit | null>(null)
  const [loading, setLoading] = useState(true)
  const prevRx = useRef(0)
  const prevTx = useRef(0)
  const prevTime = useRef(Date.now())
  const [rxSpeed, setRxSpeed] = useState(0)
  const [txSpeed, setTxSpeed] = useState(0)
  const [sessionData, setSessionData] = useState({ rx: 0, tx: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, limitRes] = await Promise.all([
          trafficApi.getStats(),
          trafficApi.getLimit(),
        ])
        
        if (statsRes.data.data) {
          const now = Date.now()
          const elapsed = (now - prevTime.current) / 1000
          
          if (prevRx.current > 0 && elapsed > 0) {
            const rxDiff = statsRes.data.data.rx_bytes - prevRx.current
            const txDiff = statsRes.data.data.tx_bytes - prevTx.current
            setRxSpeed(rxDiff / elapsed)
            setTxSpeed(txDiff / elapsed)
          }
          
          prevRx.current = statsRes.data.data.rx_bytes
          prevTx.current = statsRes.data.data.tx_bytes
          prevTime.current = now
          
          setStats(statsRes.data.data)
          setSessionData({
            rx: statsRes.data.data.rx_bytes,
            tx: statsRes.data.data.tx_bytes
          })
        }
        
        if (limitRes.data.data) {
          setLimit(limitRes.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>

  const limitPercent = limit?.enabled && limit?.limit_bytes
    ? Math.min(100, (stats?.total_bytes ?? 0) / limit.limit_bytes * 100)
    : null

  return (
    <div className="page">
      <div className="page-header">
        <h2>Traffic Monitor</h2>
        <span className="badge info">Live</span>
      </div>

      {/* Speed Overview */}
      <div className="cards-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--spacing-lg)' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '48px' }}>↓</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Download Speed
              </div>
              <div className="mono" style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                {formatSpeed(rxSpeed)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(63, 185, 80, 0.1) 0%, var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '48px' }}>↑</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Upload Speed
              </div>
              <div className="mono" style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent-green)' }}>
                {formatSpeed(txSpeed)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Usage */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <span className="card-title">Session Data</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Downloaded
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {formatBytes(sessionData.rx)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Uploaded
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-green)' }}>
              {formatBytes(sessionData.tx)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Total
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatBytes(stats?.total_bytes ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Data Limit */}
      {limit?.enabled && limit?.limit_bytes && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Data Limit</span>
            <span className={`badge ${limitPercent && limitPercent > 90 ? 'error' : limitPercent && limitPercent > 75 ? 'warning' : 'success'}`}>
              {limitPercent?.toFixed(1)}% used
            </span>
          </div>
          <div className="progress-bar" style={{ height: '12px', marginBottom: 'var(--spacing-md)' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${limitPercent ?? 0}%`,
                background: limitPercent && limitPercent > 90 
                  ? 'var(--accent-red)' 
                  : limitPercent && limitPercent > 75 
                    ? 'var(--accent-yellow)' 
                    : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>{formatBytes(stats?.total_bytes ?? 0)}</span>
            <span>{formatBytes(limit.limit_bytes)}</span>
          </div>
        </div>
      )}

      {/* Total Stats */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <span className="card-title">Historical Totals</span>
        </div>
        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="info-item">
            <span className="label">Total RX</span>
            <span className="value">{formatBytes(stats?.rx_bytes ?? 0)}</span>
          </div>
          <div className="info-item">
            <span className="label">Total TX</span>
            <span className="value">{formatBytes(stats?.tx_bytes ?? 0)}</span>
          </div>
          <div className="info-item">
            <span className="label">Total</span>
            <span className="value">{formatBytes(stats?.total_bytes ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
