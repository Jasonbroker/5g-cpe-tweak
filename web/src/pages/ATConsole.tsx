import { useState, useEffect, useRef } from 'react'
import { atApi, type AtHistoryItem } from '../api'

export default function ATConsole() {
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState<AtHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function fetchHistory() {
    try {
      const res = await atApi.getHistory()
      if (res.data.data) {
        setHistory(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch AT history:', err)
    }
  }

  async function sendCommand() {
    if (!cmd.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await atApi.send(cmd.trim())
      if (res.data.status === 'ok') {
        setCmd('')
        await fetchHistory()
      } else {
        setError(res.data.message)
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to send command')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand()
    }
  }

  return (
    <div className="page">
      <h2>AT Console</h2>
      
      <div className="card">
        <div className="at-output">
          {history.map((item, idx) => (
            <div key={idx} className="at-entry">
              <div className="at-cmd">&gt; {item.cmd}</div>
              <div className="at-res">{item.result}</div>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
        
        <div className="at-input">
          <input
            type="text"
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter AT command..."
            disabled={loading}
          />
          <button onClick={sendCommand} disabled={loading || !cmd.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {error && <div className="at-error">{error}</div>}
      </div>

      <style>{`
        .at-output {
          height: 400px;
          overflow-y: auto;
          background: #1a1a1a;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .at-entry {
          margin-bottom: 0.75rem;
        }
        .at-cmd {
          color: #646cff;
        }
        .at-res {
          color: #aaa;
          white-space: pre-wrap;
        }
        .at-input {
          display: flex;
          gap: 0.5rem;
        }
        .at-input input {
          flex: 1;
        }
        .at-error {
          margin-top: 0.5rem;
          color: #ff6b6b;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}
