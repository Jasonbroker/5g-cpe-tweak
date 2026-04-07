import { useEffect, useState } from 'react'
import { callApi, type CallRecord } from '../api'

export default function Call() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialing, setDialing] = useState(false)
  const [number, setNumber] = useState('')

  useEffect(() => {
    fetchCalls()
  }, [])

  async function fetchCalls() {
    try {
      const res = await callApi.getList()
      if (res.data.data) {
        setCalls(res.data.data.calls)
      }
    } catch (err) {
      console.error('Failed to fetch calls:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDial() {
    if (!number.trim()) return
    setDialing(true)
    try {
      await callApi.dial(number.trim())
      setNumber('')
    } catch (err) {
      console.error('Failed to dial:', err)
    } finally {
      setDialing(false)
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <h2>Call</h2>
      
      <div className="card">
        <h3>Dial</h3>
        <div className="dial-form">
          <input
            type="tel"
            placeholder="Enter number..."
            value={number}
            onChange={e => setNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDial()}
          />
          <button onClick={handleDial} disabled={dialing || !number.trim()}>
            {dialing ? 'Dialing...' : 'Call'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Call History ({calls.length})</h3>
        {calls.length === 0 ? (
          <p className="empty">No call history</p>
        ) : (
          <div className="call-list">
            {calls.map(call => (
              <div key={call.id} className={`call-item ${call.direction}`}>
                <div className="call-icon">
                  {call.direction === 'incoming' ? '📲' : call.direction === 'missed' ? '❌' : '📞'}
                </div>
                <div className="call-info">
                  <div className="call-number">{call.number}</div>
                  <div className="call-time">{call.timestamp}</div>
                </div>
                {call.duration > 0 && (
                  <div className="call-duration">{formatDuration(call.duration)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dial-form {
          display: flex;
          gap: 0.5rem;
        }
        .dial-form input {
          flex: 1;
        }
        .call-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .call-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #2a2a2a;
          border-radius: 6px;
        }
        .call-icon {
          font-size: 1.5rem;
        }
        .call-info {
          flex: 1;
        }
        .call-number {
          font-weight: 500;
        }
        .call-time {
          font-size: 0.75rem;
          color: #666;
        }
        .call-duration {
          font-size: 0.9rem;
          color: #888;
        }
        .empty {
          color: #666;
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  )
}
