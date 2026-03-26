import { useState, useEffect, useRef, useCallback } from 'react'
import { getNetworkData } from '../services/neo4j.js'
import { Map, X, ZoomIn, ZoomOut, Maximize2, Filter, Route } from 'lucide-react'

export default function NetworkMap() {
  const [data, setData] = useState({ stations: [], connections: [], lineRoutes: [] })
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)
  const [hoveredStation, setHoveredStation] = useState(null)
  const [hoveredConnection, setHoveredConnection] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showFilter, setShowFilter] = useState(false)
  const [showRouteMenu, setShowRouteMenu] = useState(false)

  // Zoom & Pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 960, h: 540 })
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const BASE_W = 960
  const BASE_H = 540
  const PADDING = 80

  useEffect(() => {
    getNetworkData().then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const { stations, connections, lineRoutes } = data
  const lats = stations.map(s => s.breite_gps).filter(Boolean)
  const lons = stations.map(s => s.laenge_gps).filter(Boolean)

  const minLat = Math.min(...(lats.length ? lats : [0]))
  const maxLat = Math.max(...(lats.length ? lats : [1]))
  const minLon = Math.min(...(lons.length ? lons : [0]))
  const maxLon = Math.max(...(lons.length ? lons : [1]))

  function project(lat, lon) {
    const x = PADDING + ((lon - minLon) / (maxLon - minLon || 1)) * (BASE_W - 2 * PADDING)
    const y = PADDING + ((maxLat - lat) / (maxLat - minLat || 1)) * (BASE_H - 2 * PADDING)
    return { x, y }
  }

  const stationPositions = {}
  stations.forEach(s => {
    if (s.breite_gps && s.laenge_gps) {
      stationPositions[s._id] = project(s.breite_gps, s.laenge_gps)
    }
  })

  function stationType(station) {
    if (station.linien?.some(l => l.typ === 'Tram')) return 'tram'
    return 'bus'
  }

  // ─── Route highlighting ───
  const activeRoute = lineRoutes.find(l => l.lineId === selectedRoute)
  const routeStationIds = activeRoute ? new Set(activeRoute.stationIds) : null
  const routeColor = activeRoute?.typ === 'Tram' ? '#E3000F' : '#2979FF'

  // Build route path: direct lines between consecutive route stations
  const routeSegments = []
  if (activeRoute) {
    for (let i = 0; i < activeRoute.stationIds.length - 1; i++) {
      const fromPos = stationPositions[activeRoute.stationIds[i]]
      const toPos = stationPositions[activeRoute.stationIds[i + 1]]
      if (fromPos && toPos) {
        routeSegments.push({ from: fromPos, to: toPos, fromName: activeRoute.stationNames[i], toName: activeRoute.stationNames[i + 1] })
      }
    }
  }

  // ─── Filter logic ───
  const filteredStations = filter === 'all'
    ? stations
    : stations.filter(s => stationType(s) === filter)
  const filteredStationIds = new Set(filteredStations.map(s => s._id))
  const filteredConnections = connections.filter(c =>
    filteredStationIds.has(c.from) && filteredStationIds.has(c.to)
  )

  // ─── Connectivity for station highlight ───
  function getConnectedIds(stationId) {
    const ids = new Set()
    connections.forEach(c => {
      if (c.from === stationId) ids.add(c.to)
      if (c.to === stationId) ids.add(c.from)
    })
    return ids
  }

  const activeStation = hoveredStation || selectedStation
  const connectedIds = activeStation ? getConnectedIds(activeStation) : new Set()

  // ─── Zoom (buttons) ───
  function zoom(factor) {
    setViewBox(prev => {
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      const nw = Math.max(120, Math.min(BASE_W * 2, prev.w * factor))
      const nh = Math.max(67, Math.min(BASE_H * 2, prev.h * factor))
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }
    })
  }

  function resetZoom() {
    setViewBox({ x: 0, y: 0, w: BASE_W, h: BASE_H })
  }

  // ─── Wheel zoom — directly on the SVG ref ───
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function onWheel(e) {
      e.preventDefault()
      e.stopPropagation()
      const factor = e.deltaY > 0 ? 1.12 : 0.88
      const rect = svg.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width
      const my = (e.clientY - rect.top) / rect.height

      setViewBox(prev => {
        const nw = Math.max(120, Math.min(BASE_W * 2, prev.w * factor))
        const nh = Math.max(67, Math.min(BASE_H * 2, prev.h * factor))
        return {
          x: prev.x + (prev.w - nw) * mx,
          y: prev.y + (prev.h - nh) * my,
          w: nw,
          h: nh,
        }
      })
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [loading])

  // ─── Pan ───
  function handleMouseDown(e) {
    if (e.button !== 0) return
    setIsPanning(true)
    panRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleMouseMove(e) {
    if (!isPanning) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = (e.clientX - panRef.current.x) / rect.width * viewBox.w
    const dy = (e.clientY - panRef.current.y) / rect.height * viewBox.h
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }))
    panRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleMouseUp() { setIsPanning(false) }

  // ─── Click ───
  function handleStationClick(station, e) {
    e.stopPropagation()
    if (selectedStation === station._id) {
      setSelectedStation(null)
      setTooltip(null)
    } else {
      setSelectedStation(station._id)
      setTooltip({ station, pos: stationPositions[station._id] })
    }
  }

  function handleSvgClick() {
    setSelectedStation(null)
    setTooltip(null)
  }

  // ─── Loading / empty ───
  if (loading) {
    return <div className="page-container"><div className="loading"><div className="spinner"></div><span>Lade Netzwerk-Karte...</span></div></div>
  }
  if (lats.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header"><div><h1>Netzwerk-Karte</h1></div></div>
        <div className="empty-state"><div className="empty-state-icon"><Map size={48} /></div><h3>Keine GPS-Daten verfügbar</h3></div>
      </div>
    )
  }

  const zoomLevel = Math.round((1 - viewBox.w / BASE_W) * 100 + 100)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Netzwerk-Karte</h1>
          <p>{filteredStations.length} Haltestellen · {Math.floor(filteredConnections.length / 2)} Verbindungen · Zoom: {zoomLevel}%</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              className={`btn btn-sm ${selectedRoute ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setShowRouteMenu(!showRouteMenu); setShowFilter(false) }}
            >
              <Route size={14} /> {activeRoute ? `Linie ${activeRoute.nummer}` : 'Route wählen'}
            </button>
            {showRouteMenu && (
              <div className="map-filter-dropdown" style={{ maxHeight: '320px', overflowY: 'auto', minWidth: '200px' }}>
                {selectedRoute && (
                  <button className="map-filter-option active"
                    onClick={() => { setSelectedRoute(null); setShowRouteMenu(false) }}>
                    <X size={12} /> Alle anzeigen
                  </button>
                )}
                <div style={{ padding: '6px 14px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>Tram</div>
                {lineRoutes.filter(l => l.typ === 'Tram').map(l => (
                  <button key={l.lineId}
                    className={`map-filter-option ${selectedRoute === l.lineId ? 'active' : ''}`}
                    onClick={() => { setSelectedRoute(l.lineId); setShowRouteMenu(false) }}>
                    <span className="map-dot" style={{ background: '#E3000F' }}></span>
                    Linie {l.nummer}
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{l.stationIds.length} Halte</span>
                  </button>
                ))}
                <div style={{ padding: '6px 14px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, borderTop: '1px solid var(--border-subtle)', marginTop: '4px' }}>Bus</div>
                {lineRoutes.filter(l => l.typ === 'Bus').map(l => (
                  <button key={l.lineId}
                    className={`map-filter-option ${selectedRoute === l.lineId ? 'active' : ''}`}
                    onClick={() => { setSelectedRoute(l.lineId); setShowRouteMenu(false) }}>
                    <span className="map-dot" style={{ background: '#2979FF' }}></span>
                    Linie {l.nummer}
                    {l.nachtlinie && <span className="badge badge-nacht" style={{ fontSize: '9px', padding: '1px 6px' }}>Nacht</span>}
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{l.stationIds.length} Halte</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowFilter(!showFilter); setShowRouteMenu(false) }}>
              <Filter size={14} /> Filter
            </button>
            {showFilter && (
              <div className="map-filter-dropdown">
                <button className={`map-filter-option ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setShowFilter(false) }}>Alle anzeigen</button>
                <button className={`map-filter-option ${filter === 'tram' ? 'active' : ''}`} onClick={() => { setFilter('tram'); setShowFilter(false) }}><span className="map-dot" style={{ background: '#E3000F' }}></span> Nur Tram</button>
                <button className={`map-filter-option ${filter === 'bus' ? 'active' : ''}`} onClick={() => { setFilter('bus'); setShowFilter(false) }}><span className="map-dot" style={{ background: '#2979FF' }}></span> Nur Bus</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="map-legend">
        <span className="map-legend-item"><span className="map-dot" style={{ background: '#E3000F' }}></span> Tram</span>
        <span className="map-legend-item"><span className="map-dot" style={{ background: '#2979FF' }}></span> Bus</span>
        {activeRoute && (
          <span className="map-legend-item" style={{ color: routeColor, fontWeight: 600 }}>
            Linie {activeRoute.nummer} ({activeRoute.typ}) — {activeRoute.stationIds.length} Haltestellen
          </span>
        )}
        <span className="map-legend-item" style={{ opacity: 0.5, marginLeft: 'auto' }}>Scrolle zum Zoomen · Ziehe zum Verschieben</span>
      </div>

      {activeRoute && (
        <div className="route-station-bar">
          {activeRoute.stationNames.map((name, i) => (
            <span key={i} className="route-station-item">
              <span className="route-station-dot" style={{ background: routeColor }}></span>
              {name}
              {i < activeRoute.stationNames.length - 1 && <span className="route-station-arrow">›</span>}
            </span>
          ))}
        </div>
      )}

      <div className="network-map-container" style={{ position: 'relative', cursor: isPanning ? 'grabbing' : 'grab' }}>
        <div className="map-controls">
          <button className="map-control-btn" onClick={() => zoom(0.75)} title="Vergrössern"><ZoomIn size={16} /></button>
          <button className="map-control-btn" onClick={() => zoom(1.33)} title="Verkleinern"><ZoomOut size={16} /></button>
          <button className="map-control-btn" onClick={resetZoom} title="Zurücksetzen"><Maximize2 size={16} /></button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          style={{ width: '100%', height: '540px', userSelect: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgClick}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {filteredConnections.map((c, i) => {
            const from = stationPositions[c.from]
            const to = stationPositions[c.to]
            if (!from || !to) return null

            const isStationHighlighted = activeStation && (c.from === activeStation || c.to === activeStation)
            const isDimmed = selectedRoute || (activeStation && !isStationHighlighted)
            const isHovered = hoveredConnection === i

            let stroke = 'rgba(227, 0, 15, 0.15)'
            let strokeWidth = 1.5
            if (isStationHighlighted) { stroke = '#E3000F'; strokeWidth = 3 }
            else if (isHovered) { stroke = '#FF6B6B'; strokeWidth = 2.5 }

            return (
              <g key={`conn-${i}`}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="transparent" strokeWidth={12} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredConnection(i)}
                  onMouseLeave={() => setHoveredConnection(null)}
                />
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
                  opacity={isDimmed ? 0.06 : 1}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {isHovered && c.distanz && (
                  <g>
                    <rect x={(from.x + to.x) / 2 - 24} y={(from.y + to.y) / 2 - 10}
                      width={48} height={20} rx={4}
                      fill="rgba(20,20,30,0.9)" stroke="rgba(227,0,15,0.4)" strokeWidth={1} />
                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 4}
                      textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">
                      {c.distanz}m
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {routeSegments.map((seg, i) => (
            <g key={`route-seg-${i}`}>
              <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y}
                stroke={routeColor} strokeWidth={4} strokeLinecap="round"
                opacity={0.9}
                filter="url(#glow)"
                style={{ transition: 'all 0.3s ease' }}
              />
              <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y}
                stroke="#fff" strokeWidth={1} strokeLinecap="round"
                opacity={0.2}
                strokeDasharray="4 6"
              />
            </g>
          ))}

          {filteredStations.map(s => {
            const pos = stationPositions[s._id]
            if (!pos) return null
            const isTram = stationType(s) === 'tram'
            const color = isTram ? '#E3000F' : '#2979FF'
            const isActive = activeStation === s._id
            const isConnected = connectedIds.has(s._id)
            const isOnRoute = routeStationIds?.has(s._id)
            const isDimmed = (selectedRoute && !isOnRoute) || (activeStation && !isActive && !isConnected)
            const isHovered = hoveredStation === s._id
            const radius = isActive ? 9 : isOnRoute ? 7 : isHovered ? 8 : isConnected ? 7 : 5

            return (
              <g key={s._id}
                style={{ cursor: 'pointer', transition: 'opacity 0.3s ease' }}
                opacity={isDimmed ? 0.12 : 1}
                onClick={e => handleStationClick(s, e)}
                onMouseEnter={() => setHoveredStation(s._id)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {isActive && (
                  <circle cx={pos.x} cy={pos.y} r={14} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}>
                    <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {isOnRoute && !isActive && (
                  <circle cx={pos.x} cy={pos.y} r={11} fill="none" stroke={routeColor} strokeWidth={1} opacity={0.3} />
                )}
                <circle cx={pos.x} cy={pos.y} r={radius}
                  fill={isOnRoute ? routeColor : color}
                  stroke={isActive || isHovered ? '#fff' : isOnRoute ? routeColor : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isActive ? 2.5 : isHovered ? 2 : isOnRoute ? 1.5 : 1}
                  filter={isActive ? 'url(#glow-strong)' : isHovered || isOnRoute ? 'url(#glow)' : undefined}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text x={pos.x} y={pos.y - radius - 5} textAnchor="middle"
                  fontSize={isActive || isOnRoute ? '11' : isHovered || isConnected ? '10' : '8'}
                  fontWeight={isActive || isHovered || isOnRoute ? '700' : '400'}
                  fill={isDimmed ? 'rgba(152,152,168,0.2)' : isOnRoute ? '#fff' : isActive ? '#fff' : '#9898A8'}
                  style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
                >
                  {s.kurzbezeichnung || s.name}
                </text>
              </g>
            )
          })}
        </svg>

        {tooltip && (
          <div className="map-detail-panel">
            <div className="map-detail-header">
              <h3>{tooltip.station.name}</h3>
              <button className="btn-icon" onClick={() => { setSelectedStation(null); setTooltip(null) }}><X size={14} /></button>
            </div>
            <div className="map-detail-body">
              <div className="map-detail-row"><span>Kurzbezeichnung</span><span>{tooltip.station.kurzbezeichnung}</span></div>
              <div className="map-detail-row"><span>Zone</span><span>{tooltip.station.zone || '–'}</span></div>
              <div className="map-detail-row"><span>GPS</span><span>{tooltip.station.breite_gps?.toFixed(4)}, {tooltip.station.laenge_gps?.toFixed(4)}</span></div>
              <div className="map-detail-row"><span>Barrierefrei</span><span>{tooltip.station.barrierefreiheit ? '✓' : '✗'}</span></div>
              <div className="map-detail-row"><span>Überdacht</span><span>{tooltip.station.ueberdacht ? '✓' : '✗'}</span></div>
              <div className="map-detail-row"><span>Billettautomat</span><span>{tooltip.station.billietautomat ? '✓' : '✗'}</span></div>
              {tooltip.station.linien?.length > 0 && (
                <>
                  <div className="map-detail-divider"></div>
                  <div className="map-detail-label">Linien</div>
                  <div className="relation-list">
                    {tooltip.station.linien.map((l, i) => {
                      const num = l.nummer?.toNumber ? l.nummer.toNumber() : l.nummer
                      const route = lineRoutes.find(r => r.nummer === num)
                      return (
                        <span key={i}
                          className={`badge badge-${l.typ === 'Tram' ? 'tram' : 'bus'}`}
                          style={{ cursor: route ? 'pointer' : 'default' }}
                          onClick={() => route && setSelectedRoute(route.lineId)}>
                          {num}
                        </span>
                      )
                    })}
                  </div>
                </>
              )}
              {connectedIds.size > 0 && (
                <>
                  <div className="map-detail-divider"></div>
                  <div className="map-detail-label">Verbundene Haltestellen</div>
                  <div className="relation-list">
                    {[...connectedIds].map(id => {
                      const s = stations.find(st => st._id === id)
                      return s ? (
                        <span key={id} className="relation-chip clickable"
                          onClick={() => handleStationClick(s, { stopPropagation: () => {} })}>
                          {s.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
