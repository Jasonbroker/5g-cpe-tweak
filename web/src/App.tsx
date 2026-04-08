import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Network from './pages/Network'
import Traffic from './pages/Traffic'
import SMS from './pages/SMS'
import Call from './pages/Call'
import ATConsole from './pages/ATConsole'
import Settings from './pages/Settings'
import './App.css'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/network', label: 'Network', icon: '◇' },
  { path: '/traffic', label: 'Traffic', icon: '▣' },
  { path: '/sms', label: 'SMS', icon: '✉' },
  { path: '/call', label: 'Call', icon: '☎' },
  { path: '/at', label: 'AT Console', icon: '▶' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

function Sidebar() {
  const location = useLocation()
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>CPE Ctrl</h1>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="status-dot online" />
        <span>System Online</span>
      </div>
    </aside>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/network" element={<Network />} />
            <Route path="/traffic" element={<Traffic />} />
            <Route path="/sms" element={<SMS />} />
            <Route path="/call" element={<Call />} />
            <Route path="/at" element={<ATConsole />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
