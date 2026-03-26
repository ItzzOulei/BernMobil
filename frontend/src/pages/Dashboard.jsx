import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getStats } from '../services/neo4j.js'
import { MapPin, Route, Bus, TrendingUp, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ stations: 0, lines: 0, vehicles: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats(true).then(s => {
      setStats(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading"><div className="spinner"></div><span>Lade Dashboard...</span></div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Willkommen zurück, {user?.username}</p>
        </div>
        <span className="badge badge-success">Netzplaner</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><MapPin size={22} /></div>
          <div>
            <div className="stat-value">{stats.stations}</div>
            <div className="stat-label">Haltestellen</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Route size={22} /></div>
          <div>
            <div className="stat-value">{stats.lines}</div>
            <div className="stat-label">Linien</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Bus size={22} /></div>
          <div>
            <div className="stat-value">{stats.vehicles}</div>
            <div className="stat-label">Fahrzeuge</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value">{stats.stations + stats.lines + stats.vehicles}</div>
            <div className="stat-label">Total Entitäten</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Schnellzugriff</h2>
      <div className="entity-grid">
        <Link to="/stations" className="entity-card" style={{ textDecoration: 'none' }}>
          <div className="entity-card-header">
            <div className="entity-card-title"><MapPin size={16} style={{ display: 'inline', verticalAlign: '-2px' }} /> Haltestellen verwalten</div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="entity-card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Haltestellen erstellen, bearbeiten und löschen. Ausstattung und GPS-Koordinaten pflegen.
            </p>
          </div>
        </Link>

        <Link to="/lines" className="entity-card" style={{ textDecoration: 'none' }}>
          <div className="entity-card-header">
            <div className="entity-card-title"><Route size={16} style={{ display: 'inline', verticalAlign: '-2px' }} /> Linien verwalten</div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="entity-card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tram- und Buslinien verwalten. Haltestellen zuweisen und Nachtlinien markieren.
            </p>
          </div>
        </Link>

        <Link to="/vehicles" className="entity-card" style={{ textDecoration: 'none' }}>
          <div className="entity-card-header">
            <div className="entity-card-title"><Bus size={16} style={{ display: 'inline', verticalAlign: '-2px' }} /> Fahrzeuge verwalten</div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="entity-card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Fahrzeugflotte verwalten. Modell, Antriebsart und Linienzuweisung pflegen.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
