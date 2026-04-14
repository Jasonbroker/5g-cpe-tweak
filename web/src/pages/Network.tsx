import { useEffect, useState } from 'react'
import { networkApi, type NetworkStatus, type SignalStrength, type CellInfo } from '../api'

function getNetworkClass(tech: string): string {
  if (tech.includes('5G')) return '5G NR'
  if (tech.includes('LTE')) return 'LTE'
  if (tech.includes('WCDMA') || tech.includes('3G')) return 'WCDMA'
  if (tech.includes('GSM') || tech.includes('2G')) return 'GSM'
  return 'Unknown'
}

export default function Network() {
  const [network, setNetwork] = useState<NetworkStatus | null>(null)
  const [signal, setSignal] = useState<SignalStrength | null>(null)
  const [cells, setCells] = useState<CellInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [networkRes, signalRes, cellsRes] = await Promise.all([
          networkApi.getStatus(),
          networkApi.getSignal(),
          networkApi.getCells(),
        ])
        setNetwork(networkRes.data.data ?? null)
        setSignal(signalRes.data.data ?? null)
        if (cellsRes.data.data?.cells) {
          setCells(cellsRes.data.data.cells)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Network Details</h2>
        <span className={`badge ${network?.registered ? 'success' : 'error'}`}>
          {network?.registered ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Network Status Overview */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Network
            </div>
            <div className="mono" style={{ 
              fontSize: '36px', 
              fontWeight: '700',
              color: network?.technology?.includes('5G') ? 'var(--accent-purple)' : 'var(--accent-cyan)'
            }}>
              {getNetworkClass(network?.technology ?? '')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Operator
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              {network?.operator ?? 'N/A'}
            </div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {network?.operator_code ?? ''}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Signal
            </div>
            <div className="mono" style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-green)' }}>
              {signal?.rssi ?? '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>dBm</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Quality
            </div>
            <div className="mono" style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {signal?.sinr ?? '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>dB SINR</div>
          </div>
        </div>
      </div>

      {/* Signal Details */}
      <div className="cards-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Signal Metrics</span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">RSSI</span>
              <span className="value">{signal?.rssi ?? '--'} dBm</span>
            </div>
            <div className="info-item">
              <span className="label">RSRP</span>
              <span className="value">{signal?.rsrp ?? '--'} dBm</span>
            </div>
            <div className="info-item">
              <span className="label">RSRQ</span>
              <span className="value">{signal?.rsrq ?? '--'} dB</span>
            </div>
            <div className="info-item">
              <span className="label">SINR</span>
              <span className="value">{signal?.sinr ?? '--'} dB</span>
            </div>
            <div className="info-item">
              <span className="label">Level</span>
              <span className="value">{signal?.level ?? '--'} / 5</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Network Status</span>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="info-item">
              <span className="label">Status</span>
              <span className="value" style={{ fontSize: '14px' }}>{network?.status ?? 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="label">Technology</span>
              <span className="badge info">{network?.technology ?? 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="label">Roaming</span>
              <span className={`badge ${network?.roaming ? 'warning' : 'success'}`}>
                {network?.roaming ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cell Towers */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Cell Towers ({cells.length})</span>
        </div>
        {cells.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-lg)' }}>
            No cell information available
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>PCI</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>EARFCN</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>Band</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>RSRP</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>RSRQ</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((cell, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px' }}>
                      <span className="badge info">{cell.type}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {cell.pci}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                      {cell.earfcn}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge">{cell.band ?? 'N/A'}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                      {cell.rsrp != null ? `${cell.rsrp} dBm` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                      {cell.rsrq != null ? `${cell.rsrq} dB` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
