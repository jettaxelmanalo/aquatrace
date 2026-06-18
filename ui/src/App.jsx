import { useState } from 'react'

import JettDashboard from './pages/JettDashboard'
import EdilynDashboard from './pages/EdilynDashboard'
import EmmaDashboard from './pages/EmmaDashboard'
import MariaDashboard from './pages/MariaDashboard'
import DeciDashboard from './pages/DeciDashboard'
import CyleenDashboard from './pages/CyleenDashboard'
import MasterDashboard from './pages/MasterDashboard'
import './App.css'

const TEAM_MEMBERS = [
  { id: 'master', name: 'Master Control', icon: '🎛️', color: '#667eea' },
  { id: 'jett', name: 'Manalo', icon: '🦞', color: '#667eea' },
  { id: 'edilyn', name: 'Mallo', icon: '🦞', color: '#ff6b6b' },
  { id: 'emma', name: 'Pascua', icon: '🦞', color: '#4ecdc4' },
  { id: 'maria', name: 'Labi-labi', icon: '🦞', color: '#f39c12' },
  { id: 'deci', name: 'Tanora', icon: '🦞', color: '#e74c3c' },
  { id: 'cyleen', name: 'Buenviaje', icon: '🦞', color: '#9b59b6' },
]

function App() {
  const [activeDashboard, setActiveDashboard] = useState('master')

  const renderDashboard = () => {
    switch (activeDashboard) {
      case 'master':
        return <MasterDashboard />
      case 'jett':
        return <JettDashboard />
      case 'edilyn':
        return <EdilynDashboard />
      case 'emma':
        return <EmmaDashboard />
      case 'maria':
        return <MariaDashboard />
      case 'deci':
        return <DeciDashboard />
      case 'cyleen':
        return <CyleenDashboard />
      default:
        return <MasterDashboard />
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">🧬</span>
            <span className="brand-text">Aqua-Trace</span>
          </div>
          
          <div className="navbar-menu">
            {TEAM_MEMBERS.map((member) => (
              <button
                key={member.id}
                className={`nav-button ${activeDashboard === member.id ? 'active' : ''}`}
                onClick={() => setActiveDashboard(member.id)}
                style={{
                  '--button-color': member.color
                }}
              >
                <span className="nav-icon">{member.icon}</span>
                <span className="nav-text">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {renderDashboard()}
      </main>
    </>
  )
}

export default App