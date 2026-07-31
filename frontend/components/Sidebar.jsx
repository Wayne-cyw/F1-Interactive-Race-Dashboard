import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebarCollapsed') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed)
  }, [collapsed])

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`} id="sidebar">
      <div className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
        <i className="fas fa-chevron-left"></i>
      </div>

      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-flag-checkered"></i>
          <span className="nav-text">F1 DASH</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <i className="fas fa-chart-line"></i>
          <span className="nav-text">Race Analysis</span>
        </NavLink>

        <NavLink to="/standings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <i className="fas fa-trophy"></i>
          <span className="nav-text">Standings</span>
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <i className="fas fa-users"></i>
          <span className="nav-text">Teams</span>
        </NavLink>

        <NavLink to="/live" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <i className="fas fa-signal"></i>
          <span className="nav-text">Live Race</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-text">
          F1 Dashboard v3.0<br />
          Ultimate Edition
        </div>
      </div>
    </div>
  )
}
