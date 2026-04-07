import { useState, useEffect } from 'react'
import { controlApi, webhookApi, systemApi } from '../api'

const RADIO_MODES = [
  { value: 'auto', label: 'Auto', desc: 'All available' },
  { value: '5g', label: '5G Only', desc: 'NR mode' },
  { value: '4g', label: '4G Only', desc: 'LTE mode' },
  { value: '3g', label: '3G Only', desc: 'WCDMA' },
]

export default function Settings() {
  const [airplaneMode, setAirplaneMode] = useState(false)
  const [dataEnabled, setDataEnabled] = useState(true)
  const [radioMode, setRadioMode] = useState('auto')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otaVersion, setOtaVersion] = useState('')
  const [rebootLoading, setRebootLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const [airplaneRes, dataRes, radioRes, webhookRes, otaRes] = await Promise.all([
        controlApi.getAirplane(),
        controlApi.getData(),
        controlApi.getRadioMode(),
        webhookApi.get(),
        systemApi.getOtaStatus(),
      ])
      if (airplaneRes.data.data) setAirplaneMode(airplaneRes.data.data.enabled)
      if (dataRes.data.data) setDataEnabled(dataRes.data.data.enabled)
      if (radioRes.data.data) setRadioMode(radioRes.data.data.mode)
      if (webhookRes.data.data) {
        setWebhookUrl(webhookRes.data.data.url)
        setWebhookEnabled(webhookRes.data.data.enabled)
      }
      if (otaRes.data.data) setOtaVersion(otaRes.data.data.current_version)
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  async function handleToggle(field: 'airplane' | 'data', value: boolean, setter: (v: boolean) => void) {
    setLoading(true)
    try {
      if (field === 'airplane') await controlApi.setAirplane(!value)
      if (field === 'data') await controlApi.setData(!value)
      setter(!value)
    } catch (err) {
      console.error(`Failed to toggle ${field}:`, err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRadioChange(mode: string) {
    setLoading(true)
    try {
      await controlApi.setRadioMode(mode)
      setRadioMode(mode)
    } catch (err) {
      console.error('Failed to change radio mode:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleWebhookSave() {
    setLoading(true)
    try {
      await webhookApi.set({ url: webhookUrl, enabled: webhookEnabled })
    } catch (err) {
      console.error('Failed to save webhook:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReboot() {
    if (!confirm('Are you sure you want to reboot the device?')) return
    setRebootLoading(true)
    try {
      await systemApi.reboot()
    } catch (err) {
      console.error('Failed to reboot:', err)
    } finally {
      setRebootLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      {/* Quick Toggles */}
      <div className="cards-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--spacing-lg)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Airplane Mode</span>
            <div 
              className={`toggle ${airplaneMode ? 'active' : ''}`}
              onClick={() => handleToggle('airplane', airplaneMode, setAirplaneMode)}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Disable all wireless connections
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mobile Data</span>
            <div 
              className={`toggle ${dataEnabled ? 'active' : ''}`}
              onClick={() => handleToggle('data', dataEnabled, setDataEnabled)}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Enable cellular data connection
          </p>
        </div>
      </div>

      {/* Radio Mode */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <span className="card-title">Radio Mode</span>
        </div>
        <div className="radio-mode-group">
          {RADIO_MODES.map(mode => (
            <button
              key={mode.value}
              className={`radio-mode-btn ${radioMode === mode.value ? 'active' : ''}`}
              onClick={() => handleRadioChange(mode.value)}
              disabled={loading}
            >
              <div>{mode.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Webhook */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <span className="card-title">Webhook</span>
          <div 
            className={`toggle ${webhookEnabled ? 'active' : ''}`}
            onClick={() => setWebhookEnabled(!webhookEnabled)}
          />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            style={{ flex: 1 }}
          />
          <button onClick={handleWebhookSave} disabled={loading} className="primary">
            Save
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
          Receive notifications on data usage, connection changes, etc.
        </p>
      </div>

      {/* System */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">System</span>
        </div>
        <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--spacing-lg)' }}>
          <div className="info-item">
            <span className="label">Firmware Version</span>
            <span className="value mono" style={{ fontSize: '14px' }}>{otaVersion || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">Device</span>
            <span className="value">UDX710</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button onClick={handleReboot} disabled={rebootLoading} className="danger">
            {rebootLoading ? 'Rebooting...' : 'Reboot Device'}
          </button>
        </div>
      </div>
    </div>
  )
}
