import { useState, useEffect } from 'react'
import { controlApi, webhookApi, systemApi, type WebhookConfig } from '../api'

export default function Settings() {
  const [airplaneMode, setAirplaneMode] = useState(false)
  const [dataEnabled, setDataEnabled] = useState(true)
  const [radioMode, setRadioMode] = useState('Auto')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otaVersion, setOtaVersion] = useState('')

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

  async function handleAirplaneToggle() {
    setLoading(true)
    try {
      await controlApi.setAirplane(!airplaneMode)
      setAirplaneMode(!airplaneMode)
    } catch (err) {
      console.error('Failed to toggle airplane mode:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDataToggle() {
    setLoading(true)
    try {
      await controlApi.setData(!dataEnabled)
      setDataEnabled(!dataEnabled)
    } catch (err) {
      console.error('Failed to toggle data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRadioChange(mode: string) {
    setLoading(true)
    try {
      await controlApi.setRadioMode({ mode })
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
      alert('Webhook saved')
    } catch (err) {
      console.error('Failed to save webhook:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleWebhookTest() {
    if (!webhookUrl) return
    setLoading(true)
    try {
      await webhookApi.test(webhookUrl)
      alert('Webhook test successful')
    } catch (err) {
      alert('Webhook test failed')
      console.error('Failed to test webhook:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReboot() {
    if (!confirm('Reboot device?')) return
    try {
      await systemApi.reboot()
    } catch (err) {
      console.error('Failed to reboot:', err)
    }
  }

  return (
    <div className="page">
      <h2>Settings</h2>
      
      <div className="card">
        <h3>Network Control</h3>
        <div className="setting-item">
          <div className="setting-label">
            <span className="label">Airplane Mode</span>
            <span className="desc">Disable all wireless connections</span>
          </div>
          <button 
            className={airplaneMode ? 'active' : ''} 
            onClick={handleAirplaneToggle}
            disabled={loading}
          >
            {airplaneMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <span className="label">Mobile Data</span>
            <span className="desc">Enable cellular data connection</span>
          </div>
          <button 
            className={dataEnabled ? 'active' : ''} 
            onClick={handleDataToggle}
            disabled={loading}
          >
            {dataEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Radio Mode</h3>
        <div className="radio-modes">
          {['4G', '5G', 'Auto'].map(mode => (
            <button
              key={mode}
              className={radioMode === mode ? 'active' : ''}
              onClick={() => handleRadioChange(mode)}
              disabled={loading}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Webhook (SMS Forwarding)</h3>
        <div className="webhook-form">
          <input
            type="url"
            placeholder="https://your-webhook-endpoint.com/sms"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
          />
          <div className="setting-item">
            <span>Enable Webhook</span>
            <button 
              className={webhookEnabled ? 'active' : ''} 
              onClick={() => setWebhookEnabled(!webhookEnabled)}
            >
              {webhookEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="webhook-actions">
            <button onClick={handleWebhookSave} disabled={loading}>Save</button>
            <button onClick={handleWebhookTest} disabled={loading || !webhookUrl}>Test</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>System</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Version</span>
            <span className="value">{otaVersion || '0.1.0'}</span>
          </div>
          <div className="info-item">
            <span className="label">API Status</span>
            <span className="value status-ok">OK</span>
          </div>
        </div>
        <div className="system-actions">
          <button onClick={handleReboot} className="danger">Reboot Device</button>
        </div>
      </div>

      <style>{`
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #333;
        }
        .setting-item:last-child {
          border-bottom: none;
        }
        .setting-label {
          display: flex;
          flex-direction: column;
        }
        .setting-label .label {
          font-weight: 500;
        }
        .setting-label .desc {
          font-size: 0.75rem;
          color: #666;
        }
        .radio-modes {
          display: flex;
          gap: 0.5rem;
        }
        .radio-modes button {
          flex: 1;
        }
        .status-ok {
          color: #4caf50;
        }
        button.active {
          background: #646cff;
          color: white;
        }
        button.danger {
          background: #f44336;
          color: white;
        }
        .webhook-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .webhook-form input {
          width: 100%;
        }
        .webhook-actions {
          display: flex;
          gap: 0.5rem;
        }
        .system-actions {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  )
}
