import { useEffect, useState } from 'react'
import { callApi, type CallRecord } from '../api'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCallIcon(direction: string): string {
  switch (direction) {
    case 'incoming': return '📲'
    case 'outgoing': return '📤'
    case 'missed': return '📵'
    default: return '📞'
  }
}

function getCallBadgeClass(direction: string): string {
  switch (direction) {
    case 'incoming': return 'success'
    case 'outgoing': return 'info'
    case 'missed': return 'error'
    default: return 'info'
  }
}

export default function Call() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialNumber, setDialNumber] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCalls()
  }, [])

  async function fetchCalls() {
    try {
      const res = await callApi.getList()
      if (res.data.data?.calls) {
        setCalls(res.data.data.calls)
      }
    } catch (err) {
      console.error('Failed to fetch calls:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDial() {
    if (!dialNumber.trim()) return
    setActionLoading(true)
    try {
      await callApi.dial(dialNumber.trim())
      setDialNumber('')
      fetchCalls()
    } catch (err) {
      console.error('Failed to dial:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Call History</h2>
      </div>

      {/* Dial Pad */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <span className="card-title">Dial</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <input
            type="tel"
            value={dialNumber}
            onChange={e => setDialNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDial()}
            placeholder="Enter phone number..."
            className="mono"
            style={{ flex: 1, fontSize: '18px', letterSpacing: '2px' }}
          />
          <button 
            onClick={handleDial} 
            disabled={actionLoading || !dialNumber.trim()}
            className="primary"
            style={{ fontSize: '16px', padding: '12px 24px' }}
          >
            📞 Call
          </button>
        </div>
      </div>

      {/* Active Calls - Placeholder for future */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', opacity: 0.6 }}>
        <div className="card-header">
          <span className="card-title">Active Call</span>
          <span className="badge warning">No Active Call</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Incoming and active calls will appear here when implemented.
        </p>
      </div>

      {/* Call List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Calls ({calls.length})</span>
        </div>
        {calls.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>
            No call history
          </div>
        ) : (
          <div className="call-list">
            {calls.map(call => (
              <div key={call.id} className="call-item">
                <div style={{ fontSize: '24px' }}>{getCallIcon(call.direction)}</div>
                <div className="call-info">
                  <div className="call-number mono">{call.number}</div>
                  <div className="call-time">{formatTime(call.timestamp)}</div>
                </div>
                <div className="call-duration mono">
                  {call.direction !== 'missed' ? formatDuration(call.duration) : ''}
                </div>
                <span className={`badge ${getCallBadgeClass(call.direction)}`}>
                  {call.direction}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
