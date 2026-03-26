import { useState, useEffect } from 'react'
import { getLines, createLine, updateLine, deleteLine, getStations, assignStationToLine, removeStationFromLine, updateStationOrder, getSchemaKeys, setDynamicProperty, removeDynamicProperty } from '../services/neo4j.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import { Plus, Pencil, Trash2, Search, Route, Link2, Unlink, ChevronUp, ChevronDown, GripVertical, ArrowUpDown, X } from 'lucide-react'

const schemaKeys = getSchemaKeys(['Linie'])
const internalKeys = ['_id', '_labels', 'haltestellen']

const emptyLine = { nummer: '', typ: 'Tram', nachtlinie: false }

export default function Lines() {
  const [lines, setLines] = useState([])
  const [allStations, setAllStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'delete'
  const [form, setForm] = useState(emptyLine)
  const [dynamicPropsList, setDynamicPropsList] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [assignStationId, setAssignStationId] = useState('')
  const [orderModal, setOrderModal] = useState(null) // line being reordered
  const [orderList, setOrderList] = useState([])      // temp ordered list
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [l, s] = await Promise.all([getLines(true), getStations(true)])
      setLines(l)
      setAllStations(s)
    } catch (err) {
      toast('Fehler beim Laden', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { 
    setForm(emptyLine); 
    setDynamicPropsList([]); 
    setModal('create') 
  }

  function openEdit(line) {
    setSelected(line)
    setForm({ nummer: line.nummer || '', typ: line.typ || 'Tram', nachtlinie: line.nachtlinie || false })
    
    const dynProps = Object.keys(line)
      .filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k))
      .map(k => ({ key: k, value: String(line[k]), oldKey: k }))
    setDynamicPropsList(dynProps)
    
    setModal('edit')
  }

  function openDelete(line) { setSelected(line); setModal('delete') }

  function openReorder(line) {
    setOrderModal(line)
    setOrderList([...line.haltestellen].sort((a, b) => a.reihenfolge - b.reihenfolge))
  }

  async function handleSave() {
    if (dynamicPropsList.some(p => !p.key.trim())) {
      return toast('Dynamische Schlüssel dürfen nicht leer sein', 'error')
    }

    setSaving(true)
    try {
      let savedEntityId = selected?._id
      if (modal === 'create') {
        const result = await createLine(form)
        savedEntityId = result._id
        toast('Linie erstellt')
      } else {
        await updateLine(selected._id, form)
        toast('Linie aktualisiert')
      }

      const keysToRemove = []
      if (modal === 'edit') {
        const originalKeys = Object.keys(selected).filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k))
        for (const old of originalKeys) {
          const matchingProp = dynamicPropsList.find(p => p.oldKey === old)
          if (!matchingProp || matchingProp.key !== old) {
            keysToRemove.push(old)
          }
        }
      }
      for (const k of keysToRemove) {
        await removeDynamicProperty(savedEntityId, k)
      }
      for (const p of dynamicPropsList) {
        await setDynamicProperty(savedEntityId, p.key, p.value)
      }

      setModal(null)
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteLine(selected._id)
      toast('Linie gelöscht')
      setModal(null)
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignStation() {
    if (!assignStationId) return
    setSaving(true)
    try {
      await assignStationToLine(assignModal._id, assignStationId)
      toast('Haltestelle zugewiesen')
      setAssignModal(null)
      setAssignStationId('')
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveStation(lineId, stationId) {
    try {
      await removeStationFromLine(lineId, stationId)
      toast('Zuweisung entfernt')
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    }
  }

  function moveStation(index, direction) {
    const newList = [...orderList]
    const target = index + direction
    if (target < 0 || target >= newList.length) return
    ;[newList[index], newList[target]] = [newList[target], newList[index]]
    setOrderList(newList)
  }

  async function handleSaveOrder() {
    setSaving(true)
    try {
      const stationIds = orderList.map(h => h.id)
      await updateStationOrder(orderModal._id, stationIds)
      toast('Reihenfolge gespeichert')
      setOrderModal(null)
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = lines.filter(l =>
    String(l.nummer)?.toLowerCase().includes(search.toLowerCase()) ||
    l.typ?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="page-container"><div className="loading"><div className="spinner"></div><span>Lade Linien...</span></div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Linien</h1>
          <p>{lines.length} Linien im Netzwerk</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Search size={16} /></span>
            <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Neue Linie</button>
        </div>
      </div>

      <div className="entity-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Route size={48} /></div>
            <h3>Keine Linien gefunden</h3>
          </div>
        ) : filtered.map(l => (
          <div key={l._id} className="entity-card">
            <div className="entity-card-header">
              <div className="entity-card-title">Linie {l.nummer}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className={`badge badge-${l.typ?.toLowerCase() === 'tram' ? 'tram' : 'bus'}`}>{l.typ}</span>
                {l.nachtlinie && <span className="badge badge-nacht">Nacht</span>}
              </div>
            </div>
            <div className="entity-card-body">
              <div className="entity-card-row"><span>Haltestellen</span><span>{l.haltestellen?.length || 0}</span></div>
              {l.haltestellen?.length > 0 && (
                <div className="station-order-list">
                  {l.haltestellen.map((h, i) => (
                    <span key={h.id || i} className="station-order-chip">
                      <span className="station-order-num">{i + 1}</span>
                      {h.name}
                      <Unlink size={10} className="station-remove-icon" onClick={() => handleRemoveStation(l._id, h.id)} />
                    </span>
                  ))}
                </div>
              )}
              {Object.keys(l).filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k)).map(k => (
                <div key={k} className="entity-card-row">
                  <span>{k}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{String(l[k])}</span>
                </div>
              ))}
            </div>
            <div className="entity-card-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { setAssignModal(l); setAssignStationId('') }}><Link2 size={14} /> Haltestelle</button>
              {l.haltestellen?.length > 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => openReorder(l)}><ArrowUpDown size={14} /> Reihenfolge</button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}><Pencil size={14} /> Bearbeiten</button>
              <button className="btn btn-danger btn-sm" onClick={() => openDelete(l)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Neue Linie' : 'Linie bearbeiten'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Liniennummer</label>
            <input className="form-input" value={form.nummer} onChange={e => setForm({ ...form, nummer: e.target.value })} placeholder="z.B. 7" />
          </div>
          <div className="form-group">
            <label className="form-label">Typ</label>
            <select className="form-select" value={form.typ} onChange={e => setForm({ ...form, typ: e.target.value })}>
              <option value="Tram">Tram</option>
              <option value="Bus">Bus</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" checked={form.nachtlinie} onChange={e => setForm({ ...form, nachtlinie: e.target.checked })} /> Nachtlinie
            </label>
          </div>
          
          <div className="form-group" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <label className="form-label">Weitere Attribute (Dynamisch)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dynamicPropsList.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    className="form-input" 
                    placeholder="Schlüssel (z.B. wlan)" 
                    value={p.key} 
                    onChange={e => {
                      const newList = [...dynamicPropsList]
                      newList[i].key = e.target.value
                      setDynamicPropsList(newList)
                    }} 
                  />
                  <input 
                    className="form-input" 
                    placeholder="Wert (z.B. ja)" 
                    value={p.value} 
                    onChange={e => {
                      const newList = [...dynamicPropsList]
                      newList[i].value = e.target.value
                      setDynamicPropsList(newList)
                    }} 
                  />
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => {
                    setDynamicPropsList(dynamicPropsList.filter((_, idx) => idx !== i))
                  }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                onClick={() => setDynamicPropsList([...dynamicPropsList, { key: '', value: '', oldKey: null }])}
              >
                <Plus size={14} /> Attribut hinzufügen
              </button>
            </div>
          </div>
        </Modal>
      )}

      {assignModal && (
        <Modal
          title={`Haltestelle zu Linie ${assignModal.nummer} zuweisen`}
          onClose={() => setAssignModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleAssignStation} disabled={saving || !assignStationId}>Zuweisen</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Haltestelle auswählen</label>
            <select className="form-select" value={assignStationId} onChange={e => setAssignStationId(e.target.value)}>
              <option value="">-- Haltestelle wählen --</option>
              {allStations
                .filter(s => !assignModal.haltestellen?.some(h => h.id === s._id))
                .map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))
              }
            </select>
          </div>
        </Modal>
      )}

      {orderModal && (
        <Modal
          title={`Haltestellenreihenfolge — Linie ${orderModal.nummer}`}
          onClose={() => setOrderModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setOrderModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleSaveOrder} disabled={saving}>{saving ? 'Speichern...' : 'Reihenfolge speichern'}</button>
            </>
          }
        >
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Verschiebe die Haltestellen mit den Pfeilen in die gewünschte Reihenfolge.
          </p>
          <div className="reorder-list">
            {orderList.map((h, i) => (
              <div key={h.id} className="reorder-item">
                <span className="reorder-grip"><GripVertical size={14} /></span>
                <span className="reorder-num">{i + 1}</span>
                <span className="reorder-name">{h.name}</span>
                <div className="reorder-actions">
                  <button className="reorder-btn" onClick={() => moveStation(i, -1)} disabled={i === 0}>
                    <ChevronUp size={14} />
                  </button>
                  <button className="reorder-btn" onClick={() => moveStation(i, 1)} disabled={i === orderList.length - 1}>
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal
          title="Linie löschen"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Löschen...' : 'Unwiderruflich löschen'}</button>
            </>
          }
        >
          <p className="confirm-text">Möchtest du die Linie <strong>{selected?.nummer}</strong> wirklich löschen?</p>
        </Modal>
      )}
    </div>
  )
}
