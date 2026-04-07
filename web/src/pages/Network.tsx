import { useEffect, useState } from 'react'
import { networkApi, controlApi, type NetworkStatus, type SignalStrength, type CellTower } from '../api'

export default function Network() {
  const [network, setNetwork] = useState<NetworkStatus | null>(null)
  const [signal, setSignal] = useState<SignalStrength | null>(null)
  const [cells, setCells] = useState<CellTower | null>(null)
  const [bandLock, setBandLock] = useState<{ enabled: boolean; bands: string[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [networkRes, signalRes, cellsRes, bandRes] = await Promise.all([
        networkApi.getStatus(),
        networkApi.getSignal(),
        networkApi.getCells(),
        controlApi.getBandLock(),
      ])
      setNetwork(networkRes.data.data ?? null)
      setSignal(signalRes.data.data ?? null)
      setCells(cellsRes.data.data ?? null)
      setBandLock(bandRes.data.data ?? null)
    } catch (err) {
      console.error('Failed to fetch network data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleBandLock() {
    if (!bandLock) return
    try {
      await controlApi.setBandLock({ enabled: !bandLock.enabled, bands: bandLock.bands })
      await fetchData()
    } catch (err) {
      console.error('Failed to toggle band lock:', err)
    }
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <h2>Network</h2>
      
      <div className="card">
        <h3>Network Registration</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Status</span>
            <span className="value">{network?.status ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Operator</span>
            <span className="value">{network?.operator ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Operator Code</span>
            <span className="value">{network?.operator_code ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Technology</span>
            <span className="value">{network?.technology ?? '-'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Signal Strength</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">RSSI</span>
            <span className="value">{signal?.rssi ?? '-'} dBm</span>
          </div>
          <div className="info-item">
            <span className="label">RSRP</span>
            <span className="value">{signal?.rsrp ?? '-'} dBm</span>
          </div>
          <div className="info-item">
            <span className="label">RSRQ</span>
            <span className="value">{signal?.rsrq ?? '-'} dB</span>
          </div>
          <div className="info-item">
            <span className="label">SINR</span>
            <span className="value">{signal?.sinr ?? '-'} dB</span>
          </div>
        </div>
        <div className="signal-bars-large">
          {[1,2,3,4].map(level => (
            <div 
              key={level}
              className={`signal-bar ${level <= (signal?.level ?? 0) ? 'active' : ''}`}
              style={{ height: `${level * 15 + 10}px` }}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Cell Info</h3>
        {cells?.cells.map((cell, idx) => (
          <div key={idx} className="info-grid">
            <div className="info-item">
              <span className="label">Type</span>
              <span className="value">{cell.type}</span>
            </div>
            <div className="info-item">
              <span className="label">PCI</span>
              <span className="value">{cell.pci}</span>
            </div>
            <div className="info-item">
              <span className="label">EARFCN</span>
              <span className="value">{cell.earfcn}</span>
            </div>
            <div className="info-item">
              <span className="label">Band</span>
              <span className="value">{cell.band ?? '-'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Band Lock</h3>
        <div className="setting-item">
          <span>Enable Band Lock</span>
          <button 
            className={bandLock?.enabled ? 'active' : ''} 
            onClick={toggleBandLock}
          >
            {bandLock?.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {bandLock?.bands && bandLock.bands.length > 0 && (
          <div className="bands-list">
            <span className="label">Locked Bands:</span>
            <span>{bandLock.bands.join(', ')}</span>
          </div>
        )}
      </div>

      <style>{`
        .signal-bars-large {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 70px;
          margin-top: 1rem;
          justify-content: center;
        }
        .signal-bar {
          width: 20px;
          background: #333;
          border-radius: 4px;
        }
        .signal-bar.active {
          background: #646cff;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }
        .bands-list {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #2a2a2a;
          border-radius: 6px;
        }
        button.active {
          background: #646cff;
          color: white;
        }
      `}</style>
    </div>
  )
}
