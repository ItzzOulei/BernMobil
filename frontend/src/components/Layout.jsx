import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useState } from 'react'
import {
  Home, Map, LayoutDashboard, MapPin, Route, Bus,
  LogIn, LogOut, Menu, X, User, Eye
} from 'lucide-react'

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Menü"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">BM</div>
          <div className="sidebar-brand-text">
            <h2>BernMobil</h2>
            <span>Netzwerk Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Öffentlich</span>
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end onClick={() => setSidebarOpen(false)}>
            <span className="sidebar-link-icon"><Home size={18} /></span> Startseite
          </NavLink>
          <NavLink to="/network" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <span className="sidebar-link-icon"><Map size={18} /></span> Netzwerk-Karte
          </NavLink>

          {isAuthenticated ? (
            <>
              <span className="sidebar-section-label">Netzplaner</span>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-link-icon"><LayoutDashboard size={18} /></span> Dashboard
              </NavLink>
              <NavLink to="/stations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-link-icon"><MapPin size={18} /></span> Haltestellen
              </NavLink>
              <NavLink to="/lines" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-link-icon"><Route size={18} /></span> Linien
              </NavLink>
              <NavLink to="/vehicles" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-link-icon"><Bus size={18} /></span> Fahrzeuge
              </NavLink>
            </>
          ) : (
            <>
              <span className="sidebar-section-label">Verwaltung</span>
              <NavLink to="/login" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="sidebar-link-icon"><LogIn size={18} /></span> Netzplaner Login
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {isAuthenticated ? (
            <>
              <div className="sidebar-user">
                <div className="sidebar-user-avatar"><User size={16} /></div>
                <div className="sidebar-user-info">
                  <span>{user?.username}</span>
                  <span>Netzplaner</span>
                </div>
              </div>
              <button className="logout-btn" onClick={logout}>
                <LogOut size={14} /> Abmelden
              </button>
            </>
          ) : (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar"><Eye size={16} /></div>
              <div className="sidebar-user-info">
                <span>Gast</span>
                <span>Nur Leserechte</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
