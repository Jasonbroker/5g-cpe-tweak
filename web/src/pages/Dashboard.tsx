import { useEffect, useState, useRef } from 'react'
import { deviceApi, networkApi, type DeviceInfo, type SimInfo, type NetworkStatus, type SignalStrength } from '../api'

interface SignalDataPoint {
  time: number
  rssi: number
}

function getSignalQuality(rssi: number): { label: string; color: string } {
  if (rssi >= -70) return { label: 'Excellent', color: 'var(--accent-green)' }
  if (rssi >= -85) return { label: 'Good', color: 'var(--accent-cyan)' }
  if (rssi >= -100) return { label: 'Fair', color: 'var(--accent-yellow)' }
  return { label: 'Poor', color: 'var(--accent-red)' }
}

function getNetworkIcon(tech: string): string {
  if (tech.includes('5G')) return '5G'
  if (tech.includes('LTE') || tech.includes('4G')) return '4G'
  if (tech.includes('3G')) return '3G'
  if (tech.includes('2G')) return '2G'
  return '?'
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function Dashboard() {
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [sim, setSim] = useState<SimInfo | null>(null)
  const [network, setNetwork] = useState<NetworkStatus | null>(null)
  const [signal, setSignal] = useState<SignalStrength | null>(null)
  const [loading, setLoading] = useState(true)
  const [uptime, setUptime] = useState(0)
  const signalHistory = useRef<SignalDataPoint[]>([])
  const [history, setHistory] = useState<SignalDataPoint[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [deviceRes, simRes, networkRes, signalRes] = await Promise.all([
          deviceApi.getInfo(),
          deviceApi.getSim(),
          networkApi.getStatus(),
          networkApi.getSignal(),
        ])
        setDevice(deviceRes.data.data ?? null)
        setSim(simRes.data.data ?? null)
        setNetwork(networkRes.data.data ?? null)
        if (signalRes.data.data) {
          setSignal(signalRes.data.data)
          // Add to history
          const now = Date.now()
          signalHistory.current.push({
            time: now,
            rssi: signalRes.data.data.rssi ?? -100
          })
          // Keep last 20 points
          if (signalHistory.current.length > 20) {
            signalHistory.current = signalHistory.current.slice(-20)
          }
          setHistory([...signalHistory.current])
        }
        setUptime(prev => prev + 5)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(() => {
      fetchData()
      setUptime(prev => prev + 5)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const quality = signal ? getSignalQuality(signal.rssi ?? -100) : null
  const networkIcon = network ? getNetworkIcon(network.technology ?? '') : '?'

  if (loading) return <div className="page"><div className="loading">Initializing...</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <span className="badge success">
            <span className="status-dot online" style={{ marginRight: '6px' }} />
            Live
          </span>
        </div>
        <div className="mono" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Uptime: {formatUptime(uptime)}
        </div>
      </div>

      {/* Signal Overview - Top Section */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
          {/* Signal Strength */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
              Signal Strength
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-sm)' }}>
              <span className="mono" style={{ fontSize: '48px', fontWeight: '700', color: quality?.color, lineHeight: 1 }}>
                {signal?.rssi ?? '--'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>dBm</span>
            </div>
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <span className="badge" style={{ background: quality?.color + '22', color: quality?.color }}>
                {quality?.label}
              </span>
            </div>
            {/* Signal Bars */}
            <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--spacing-md)' }}>
              {[1,2,3,4,5].map(level => {
                const active = signal && (signal.level ?? 0) >= level
                return (
                  <div key={level} style={{
                    width: '12px',
                    height: `${8 + level * 6}px`,
                    background: active ? quality?.color : 'var(--border-color)',
                    borderRadius: '2px',
                    boxShadow: active ? `0 0 8px ${quality?.color}` : 'none',
                    transition: 'all 0.3s'
                  }} />
                )
              })}
            </div>
          </div>

          {/* Signal Chart */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
              RSSI History
            </div>
            <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              {history.map((point, idx) => {
                const height = Math.max(5, Math.min(100, ((point.rssi + 120) / 70) * 100))
                return (
                  <div key={idx} style={{
                    flex: 1,
                    height: `${height}%`,
                    background: getSignalQuality(point.rssi).color,
                    borderRadius: '2px 2px 0 0',
                    minWidth: '4px',
                    opacity: 0.7 + (idx / history.length) * 0.3,
                    transition: 'height 0.3s'
                  }} />
                )
              })}
              {history.length === 0 && (
                <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px' }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>-120 dBm</span>
              <span>-70 dBm</span>
            </div>
          </div>

          {/* Network Type */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
              Network
            </div>
            <div className="mono" style={{ 
              fontSize: '56px', 
              fontWeight: '700', 
              color: network?.technology?.includes('5G') ? 'var(--accent-purple)' : 'var(--accent-cyan)',
              lineHeight: 1,
              textShadow: `0 0 30px ${network?.technology?.includes('5G') ? 'var(--accent-purple)' : 'var(--accent-cyan)'}`,
            }}>
              {networkIcon}
            </div>
            <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {network?.technology ?? 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="cards-grid">
        {/* Device Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Device</span>
            <span className="badge info">{device?.model?.split(' ')[0] ?? 'CPE'}</span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">Model</span>
              <span className="value" style={{ fontSize: '13px' }}>{device?.model ?? 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="label">IMEI</span>
              <span className="value mono" style={{ fontSize: '11px' }}>{device?.imei ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Firmware</span>
              <span className="value mono" style={{ fontSize: '12px' }}>{device?.firmware ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Temperature</span>
              <span className="value" style={{ color: 'var(--accent-green)' }}>42°C</span>
            </div>
          </div>
        </div>

        {/* SIM Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SIM</span>
            <span className={`badge ${sim?.ready ? 'success' : 'warning'}`}>
              {sim?.ready ? 'Ready' : 'Not Ready'}
            </span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">ICCID</span>
              <span className="value mono" style={{ fontSize: '11px' }}>{sim?.iccid ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Operator</span>
              <span className="value">{network?.operator ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">MCC/MNC</span>
              <span className="value mono">{network?.operator_code ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">SIM Status</span>
              <span className="value" style={{ fontSize: '12px' }}>{sim?.status ?? 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Network Details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cell Info</span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">PCI</span>
              <span className="value mono">{signal?.pci ?? '--'}</span>
            </div>
            <div className="info-item">
              <span className="label">EARFCN</span>
              <span className="value mono">{signal?.earfcn ?? '--'}</span>
            </div>
            <div className="info-item">
              <span className="label">RSRP</span>
              <span className="value mono">{signal?.rsrp ?? '--'} dBm</span>
            </div>
            <div className="info-item">
              <span className="label">RSRQ</span>
              <span className="value mono">{signal?.rsrq ?? '--'} dB</span>
            </div>
            <div className="info-item">
              <span className="label">SINR</span>
              <span className="value mono">{signal?.sinr ?? '--'} dB</span>
            </div>
            <div className="info-item">
              <span className="label">Band</span>
              <span className="badge info">{signal?.band ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Connection</span>
            <span className={`badge ${network?.registered ? 'success' : 'error'}`}>
              {network?.registered ? 'Registered' : 'Searching'}
            </span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">Status</span>
              <span className="value" style={{ fontSize: '14px' }}>{network?.status ?? 'Disconnected'}</span>
            </div>
            <div className="info-item">
              <span className="label">Roaming</span>
              <span className={`badge ${network?.roaming ? 'warning' : 'success'}`}>
                {network?.roaming ? 'Active' : 'Home'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Uptime</span>
              <span className="value mono">{formatUptime(uptime)}</span>
            </div>
            <div className="info-item">
              <span className="label">IP</span>
              <span className="value mono" style={{ fontSize: '11px' }}>192.168.1.100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Quick AT Commands</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to send</span>
        </div>
        <div className="at-quick-actions">
          {[
            { cmd: 'AT+CSQ', desc: 'Signal' },
            { cmd: 'AT+COPS?', desc: 'Operator' },
            { cmd: 'AT+CREG?', desc: 'Reg' },
            { cmd: 'AT+CGATT?', desc: 'Data' },
            { cmd: 'AT+CNTI=0', desc: 'Net Type' },
            { cmd: 'AT+SPLBAND?', desc: 'Band' },
            { cmd: 'AT+CFUN?', desc: 'Func' },
            { cmd: 'AT+ICCID', desc: 'ICCID' },
          ].map(({ cmd, desc }) => (
            <button key={cmd} onClick={() => {
              // Navigate to AT console or send command
              window.location.href = '/at?cmd=' + encodeURIComponent(cmd)
            }}>
              <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{cmd}</span>
              <span style={{ marginLeft: '6px', color: 'var(--text-muted)', fontSize: '10px' }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
