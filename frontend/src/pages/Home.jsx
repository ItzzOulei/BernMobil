import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getStations, getLines, getVehicles } from '../services/neo4j.js'
import {
  MapPin, Route, Bus, Search, Map, LogIn,
  Accessibility, ShieldCheck, Ticket
} from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({ stations: 0, lines: 0, vehicles: 0 })
  const [stations, setStations] = useState([])
  const [lines, setLines] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stations')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [s, st, l, v] = await Promise.all([
        getStats(),
        getStations(),
        getLines(),
        getVehicles()
      ])
      setStats(s)
      setStations(st)
      setLines(l)
      setVehicles(v)
    } catch (err) {
      console.error('Fehler beim Laden:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredStations = stations.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.kurzbezeichnung?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredLines = lines.filter(l =>
    String(l.nummer)?.toLowerCase().includes(search.toLowerCase()) ||
    l.typ?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredVehicles = vehicles.filter(v =>
    v.modell?.toLowerCase().includes(search.toLowerCase()) ||
    v.antriebsart?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          <span>Verbinde mit Neo4j Cluster...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="hero">
        <h1>Willkommen bei <span>BernMobil</span></h1>
        <p>Entdecke das Netzwerk des öffentlichen Verkehrs in Bern – Haltestellen, Linien und Fahrzeuge auf einen Blick.</p>
        <div className="hero-actions">
          <Link to="/network" className="btn btn-primary">
            <Map size={16} /> Netzwerk-Karte
          </Link>
          <Link to="/login" className="btn btn-secondary">
            <LogIn size={16} /> Netzplaner Login
          </Link>
        </div>
      </div>

      {/* Stats */}
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
      </div>

      {/* Search & Tabs */}
      <div className="page-header">
        <div>
          <h1>Netzwerk durchsuchen</h1>
          <p>Alle Daten des BernMobil-Netzwerks</p>
        </div>
        <div className="search-bar">
          <span className="search-icon"><Search size={16} /></span>
          <input
            id="home-search"
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'stations' ? 'active' : ''}`} onClick={() => setActiveTab('stations')}>
          <MapPin size={14} /> Haltestellen ({filteredStations.length})
        </button>
        <button className={`tab ${activeTab === 'lines' ? 'active' : ''}`} onClick={() => setActiveTab('lines')}>
          <Route size={14} /> Linien ({filteredLines.length})
        </button>
        <button className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`} onClick={() => setActiveTab('vehicles')}>
          <Bus size={14} /> Fahrzeuge ({filteredVehicles.length})
        </button>
      </div>

      {/* Station Cards */}
      {activeTab === 'stations' && (
        <div className="entity-grid">
          {filteredStations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MapPin size={48} /></div>
              <h3>Keine Haltestellen gefunden</h3>
            </div>
          ) : filteredStations.map(s => (
            <div key={s._id} className="entity-card">
              <div className="entity-card-header">
                <div>
                  <div className="entity-card-title">{s.name}</div>
                  <div className="entity-card-subtitle">{s.kurzbezeichnung}</div>
                </div>
              </div>
              <div className="entity-card-body">
                <div className="entity-card-row">
                  <span>Zone</span><span>{s.zone || '–'}</span>
                </div>
                <div className="entity-card-row">
                  <span>GPS</span><span>{s.breite_gps?.toFixed(4)}, {s.laenge_gps?.toFixed(4)}</span>
                </div>
                <div className="amenity-tags">
                  {s.barrierefreiheit && <span className="amenity-tag"><Accessibility size={10} /> Barrierefrei</span>}
                  {s.ueberdacht && <span className="amenity-tag"><ShieldCheck size={10} /> Überdacht</span>}
                  {s.billietautomat && <span className="amenity-tag"><Ticket size={10} /> Billettautomat</span>}
                </div>
                {s.linien?.length > 0 && (
                  <div className="relation-list">
                    {s.linien.map(l => (
                      <span key={l} className="relation-chip">Linie {l}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Line Cards */}
      {activeTab === 'lines' && (
        <div className="entity-grid">
          {filteredLines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Route size={48} /></div>
              <h3>Keine Linien gefunden</h3>
            </div>
          ) : filteredLines.map(l => (
            <div key={l._id} className="entity-card">
              <div className="entity-card-header">
                <div>
                  <div className="entity-card-title">Linie {l.nummer}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span className={`badge badge-${l.typ?.toLowerCase() === 'tram' ? 'tram' : 'bus'}`}>
                    {l.typ}
                  </span>
                  {l.nachtlinie && <span className="badge badge-nacht">Nacht</span>}
                </div>
              </div>
              <div className="entity-card-body">
                <div className="entity-card-row">
                  <span>Typ</span><span>{l.typ}</span>
                </div>
                <div className="entity-card-row">
                  <span>Haltestellen</span><span>{l.haltestellen?.length || 0}</span>
                </div>
                {l.haltestellen?.length > 0 && (
                  <div className="relation-list">
                    {l.haltestellen.map(h => (
                      <span key={h} className="relation-chip">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Cards */}
      {activeTab === 'vehicles' && (
        <div className="entity-grid">
          {filteredVehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Bus size={48} /></div>
              <h3>Keine Fahrzeuge gefunden</h3>
            </div>
          ) : filteredVehicles.map(v => (
            <div key={v._id} className="entity-card">
              <div className="entity-card-header">
                <div>
                  <div className="entity-card-title">{v.modell}</div>
                </div>
              </div>
              <div className="entity-card-body">
                <div className="entity-card-row">
                  <span>Sitzplätze</span><span>{v.sitzplaetze}</span>
                </div>
                <div className="entity-card-row">
                  <span>Antrieb</span><span>{v.antriebsart}</span>
                </div>
                <div className="entity-card-row">
                  <span>Baujahr</span><span>{v.baujahr}</span>
                </div>
                {v.linien?.length > 0 && (
                  <div className="relation-list">
                    {v.linien.map(l => (
                      <span key={l} className="relation-chip">Linie {l}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
