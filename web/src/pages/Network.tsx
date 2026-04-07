import { useEffect, useState } from 'react'
import { networkApi, type NetworkStatus, type SignalStrength } from '../api'

export default function Network() {
  const [network, setNetwork] = useState<NetworkStatus | null>(null)
  const [signal, setSignal] = useState<SignalStrength | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [networkRes, signalRes] = await Promise.all([
          networkApi.getStatus(),
          networkApi.getSignal(),
        ])
        setNetwork(networkRes.data.data ?? null)
        setSignal(signalRes.data.data ?? null)
      } catch (err) {
        console.error('Failed to fetch network data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
      </div>
    </div>
  )
}
