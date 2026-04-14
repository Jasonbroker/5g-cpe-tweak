import { useState, useEffect, useRef } from 'react'
import { atApi, type AtHistoryItem } from '../api'

const QUICK_COMMANDS = [
  { cmd: 'AT+CSQ', desc: 'Signal' },
  { cmd: 'AT+COPS?', desc: 'Operator' },
  { cmd: 'AT+COPS=?', desc: 'Search' },
  { cmd: 'AT+CREG?', desc: 'Reg Status' },
  { cmd: 'AT+CREG=2', desc: 'Reg 2.5G' },
  { cmd: 'AT+CGATT?', desc: 'Data State' },
  { cmd: 'AT+CGATT=1', desc: 'Attach' },
  { cmd: 'AT+CGATT=0', desc: 'Detach' },
  { cmd: 'AT+CGMR', desc: 'Version' },
  { cmd: 'AT+CGSN', desc: 'IMEI' },
  { cmd: 'AT+ICCID', desc: 'ICCID' },
  { cmd: 'AT+SPLBAND=0', desc: 'Auto Band' },
  { cmd: 'AT+SPLBAND=3', desc: 'Band 3' },
  { cmd: 'AT+SPLBAND?', desc: 'Band Status' },
  { cmd: 'AT+CNTI=0', desc: 'Net Type' },
  { cmd: 'AT+CFUN?', desc: 'Func Mode' },
  { cmd: 'AT+CFUN=1', desc: 'Full' },
  { cmd: 'AT+CFUN=4', desc: 'Airplane' },
  { cmd: 'ATE1', desc: 'Echo ON' },
  { cmd: 'ATE0', desc: 'Echo OFF' },
  { cmd: 'ATI', desc: 'Info' },
  { cmd: 'AT+GMI', desc: 'Manuf' },
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

function parseResponse(result: string): { type: string; lines: string[] } {
  if (!result) return { type: 'info', lines: ['(no response)'] }
  
  const lines = result.trim().split('\n')
  
  // Detect response type
  if (result.includes('+CSQ:')) {
    const match = result.match(/\+CSQ:\s*(\d+),(\d+)/)
    if (match) {
      const rssi = parseInt(match[1])
      const qual = parseInt(match[2])
      const desc = rssi === 99 ? 'Not detectable' : `${-113 + rssi * 2} dBm`
      return { 
        type: 'signal', 
        lines: [`Signal: ${rssi} (${desc})`, `Quality: ${qual === 99 ? 'Unknown' : qual}`] 
      }
    }
  }
  
  if (result.includes('+COPS:')) {
    return { type: 'operator', lines }
  }
  
  if (result.includes('OK')) {
    return { type: 'success', lines: lines.filter(l => l.trim()) }
  }
  
  if (result.includes('ERROR') || result.includes('+CME ERROR')) {
    return { type: 'error', lines: lines.filter(l => l.trim()) }
  }
  
  return { type: 'info', lines: lines.filter(l => l.trim()) }
}

export default function ATConsole() {
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState<AtHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendingAt, setSendingAt] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
    
    // Check for command in URL
    const params = new URLSearchParams(window.location.search)
    const cmdParam = params.get('cmd')
    if (cmdParam) {
      setCmd(cmdParam)
      setSendingAt(cmdParam)
    }
  }, [])

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' })
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

  async function sendCommand(command: string) {
    if (!command.trim()) return
    setLoading(true)
    setError('')
    setSendingAt(command.trim())
    try {
      const res = await atApi.send(command.trim())
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
      setSendingAt('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand(cmd)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'signal': return 'var(--accent-green)'
      case 'success': return 'var(--accent-cyan)'
      case 'error': return 'var(--accent-red)'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <h2 style={{ margin: 0 }}>AT Console</h2>
          <span className="badge info">Interactive</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={() => { setHistory([]) }} style={{ fontSize: '12px' }}>
            Clear
          </button>
        </div>
      </div>
      
      <div className="at-console">
        <div className="at-output" ref={outputRef}>
          {history.length === 0 && !loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>▸</div>
              <p>AT Command Console</p>
              <p style={{ fontSize: '12px' }}>
                Send commands to interact with the modem.
                <br />
                Try: <code style={{ color: 'var(--accent-green)' }}>AT+CSQ</code> to check signal
              </p>
            </div>
          ) : (
            <>
              {history.map((item, idx) => {
                const { type, lines } = parseResponse(item.result || '')
                return (
                  <div key={idx} className="at-entry">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div className="at-cmd">{item.cmd}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.timestamp ? formatTime(new Date(item.timestamp)) : ''}
                      </div>
                    </div>
                    <div 
                      className="at-res" 
                      style={{ borderLeft: `2px solid ${getTypeColor(type)}`, paddingLeft: '8px' }}
                    >
                      {lines.map((line, i) => (
                        <div key={i} style={{ color: getTypeColor(type) }}>{line}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {loading && sendingAt && (
                <div className="at-entry">
                  <div className="at-cmd" style={{ opacity: 0.5 }}>{sendingAt}</div>
                  <div className="loading" style={{ padding: '8px 0' }}>Sending...</div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="card" style={{ padding: 'var(--spacing-md)', background: 'var(--bg-secondary)' }}>
          <div className="at-input">
            <input
              type="text"
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter AT command..."
              disabled={loading}
              autoFocus
              style={{ fontSize: '14px' }}
            />
            <button 
              onClick={() => sendCommand(cmd)} 
              disabled={loading || !cmd.trim()}
              className="primary"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          
          {error && (
            <div style={{ 
              color: 'var(--accent-red)', 
              marginTop: '8px', 
              fontSize: '13px',
              padding: '8px',
              background: 'rgba(248, 81, 73, 0.1)',
              borderRadius: 'var(--radius-sm)'
            }}>
              Error: {error}
            </div>
          )}
          
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' }}>
              Quick Commands
            </div>
            <div className="at-quick-actions">
              {QUICK_COMMANDS.map(({ cmd: cmdName, desc }) => (
                <button 
                  key={cmdName} 
                  onClick={() => sendCommand(cmdName)}
                  disabled={loading}
                  style={{ 
                    fontSize: '11px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="mono" style={{ color: 'var(--accent-green)', fontSize: '10px' }}>{cmdName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
