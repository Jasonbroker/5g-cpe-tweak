import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Network from './pages/Network'
import Traffic from './pages/Traffic'
import SMS from './pages/SMS'
import Call from './pages/Call'
import ATConsole from './pages/ATConsole'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <h1>CPE Ctrl</h1>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/network">Network</Link></li>
            <li><Link to="/traffic">Traffic</Link></li>
            <li><Link to="/sms">SMS</Link></li>
            <li><Link to="/call">Call</Link></li>
            <li><Link to="/at">AT Console</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </nav>
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
