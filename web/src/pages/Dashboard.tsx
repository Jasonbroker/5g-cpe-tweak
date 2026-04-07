import { useEffect, useState } from 'react'
import { deviceApi, networkApi, type DeviceInfo, type SimInfo, type NetworkStatus, type SignalStrength } from '../api'

export default function Dashboard() {
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [sim, setSim] = useState<SimInfo | null>(null)
  const [network, setNetwork] = useState<NetworkStatus | null>(null)
  const [signal, setSignal] = useState<SignalStrength | null>(null)
  const [loading, setLoading] = useState(true)

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
        setSignal(signalRes.data.data ?? null)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <h2>Dashboard</h2>
      
      <div className="card">
        <h3>Device Info</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Model</span>
            <span className="value">{device?.model ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">IMEI</span>
            <span className="value">{device?.imei ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Firmware</span>
            <span className="value">{device?.firmware ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">ICCID</span>
            <span className="value">{sim?.iccid ?? '-'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Network Status</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Status</span>
            <span className="value">{network?.registered ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="info-item">
            <span className="label">Operator</span>
            <span className="value">{network?.operator ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Technology</span>
            <span className="value">{network?.technology ?? '-'}</span>
          </div>
          <div className="info-item">
            <span className="label">Signal Level</span>
            <span className="value">
              <div className="signal-bars">
                {[1,2,3,4].map(level => (
                  <div 
                    key={level}
                    className={`signal-bar ${level <= (signal?.level ?? 0) ? 'active' : ''}`}
                    style={{ height: `${level * 4 + 4}px` }}
                  />
                ))}
              </div>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
