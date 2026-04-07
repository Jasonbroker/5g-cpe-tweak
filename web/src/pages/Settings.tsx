import { useState } from 'react'
import { controlApi } from '../api'

export default function Settings() {
  const [airplaneMode, setAirplaneMode] = useState(false)
  const [dataEnabled, setDataEnabled] = useState(true)
  const [radioMode, setRadioMode] = useState('Auto')
  const [loading, setLoading] = useState(false)

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
        <h3>System Info</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Version</span>
            <span className="value">0.1.0</span>
          </div>
          <div className="info-item">
            <span className="label">API Status</span>
            <span className="value status-ok">OK</span>
          </div>
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
      `}</style>
    </div>
  )
}
