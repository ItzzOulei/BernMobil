import { useState, useEffect } from 'react'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getLines, assignVehicleToLine, removeVehicleFromLine, getSchemaKeys, setDynamicProperty, removeDynamicProperty } from '../services/neo4j.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import { Plus, Pencil, Trash2, Search, Bus, Link2, Unlink, X } from 'lucide-react'

const schemaKeys = getSchemaKeys(['Fahrzeug'])
const internalKeys = ['_id', '_labels', 'linien']

const emptyVehicle = { modell: '', sitzplaetze: '', antriebsart: 'Elektro', baujahr: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [allLines, setAllLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyVehicle)
  const [dynamicPropsList, setDynamicPropsList] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [assignLineId, setAssignLineId] = useState('')
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [v, l] = await Promise.all([getVehicles(true), getLines(true)])
      setVehicles(v)
      setAllLines(l)
    } catch (err) {
      toast('Fehler beim Laden', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { 
    setForm(emptyVehicle); 
    setDynamicPropsList([]); 
    setModal('create') 
  }

  function openEdit(vehicle) {
    setSelected(vehicle)
    setForm({
      modell: vehicle.modell || '',
      sitzplaetze: vehicle.sitzplaetze ?? '',
      antriebsart: vehicle.antriebsart || 'Elektro',
      baujahr: vehicle.baujahr ?? '',
    })
    
    const dynProps = Object.keys(vehicle)
      .filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k))
      .map(k => ({ key: k, value: String(vehicle[k]), oldKey: k }))
    setDynamicPropsList(dynProps)
    
    setModal('edit')
  }

  function openDelete(vehicle) { setSelected(vehicle); setModal('delete') }

  async function handleSave() {
    if (dynamicPropsList.some(p => !p.key.trim())) {
      return toast('Dynamische Schlüssel dürfen nicht leer sein', 'error')
    }

    setSaving(true)
    try {
      let savedEntityId = selected?._id
      if (modal === 'create') {
        const result = await createVehicle(form)
        savedEntityId = result._id
        toast('Fahrzeug erstellt')
      } else {
        await updateVehicle(selected._id, form)
        toast('Fahrzeug aktualisiert')
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
      await deleteVehicle(selected._id)
      toast('Fahrzeug gelöscht')
      setModal(null)
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignLine() {
    if (!assignLineId) return
    setSaving(true)
    try {
      await assignVehicleToLine(assignModal._id, assignLineId)
      toast('Linie zugewiesen')
      setAssignModal(null)
      setAssignLineId('')
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveLine(vehicleId, lineNummer) {
    const line = allLines.find(l => l.nummer === lineNummer)
    if (!line) return
    try {
      await removeVehicleFromLine(vehicleId, line._id)
      toast('Zuweisung entfernt')
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    }
  }

  const filtered = vehicles.filter(v =>
    v.modell?.toLowerCase().includes(search.toLowerCase()) ||
    v.antriebsart?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="page-container"><div className="loading"><div className="spinner"></div><span>Lade Fahrzeuge...</span></div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Fahrzeuge</h1>
          <p>{vehicles.length} Fahrzeuge in der Flotte</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Search size={16} /></span>
            <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Neues Fahrzeug</button>
        </div>
      </div>

      <div className="entity-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bus size={48} /></div>
            <h3>Keine Fahrzeuge gefunden</h3>
          </div>
        ) : filtered.map(v => (
          <div key={v._id} className="entity-card">
            <div className="entity-card-header">
              <div className="entity-card-title">{v.modell}</div>
            </div>
            <div className="entity-card-body">
              <div className="entity-card-row"><span>Sitzplätze</span><span>{v.sitzplaetze}</span></div>
              <div className="entity-card-row"><span>Antrieb</span><span>{v.antriebsart}</span></div>
              <div className="entity-card-row"><span>Baujahr</span><span>{v.baujahr}</span></div>
               {v.linien?.length > 0 && (
                <div className="relation-list">
                  {v.linien.map(l => (
                    <span key={l} className="relation-chip" style={{ cursor: 'pointer' }} onClick={() => handleRemoveLine(v._id, l)}>
                      Linie {l} <Unlink size={10} />
                    </span>
                  ))}
                </div>
              )}
              {Object.keys(v).filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k)).map(k => (
                <div key={k} className="entity-card-row">
                  <span>{k}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{String(v[k])}</span>
                </div>
              ))}
            </div>
            <div className="entity-card-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { setAssignModal(v); setAssignLineId('') }}><Link2 size={14} /> Linie</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}><Pencil size={14} /> Bearbeiten</button>
              <button className="btn btn-danger btn-sm" onClick={() => openDelete(v)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Neues Fahrzeug' : 'Fahrzeug bearbeiten'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Modell</label>
            <input className="form-input" value={form.modell} onChange={e => setForm({ ...form, modell: e.target.value })} placeholder="z.B. Combino Be 6/8" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sitzplätze</label>
              <input className="form-input" type="number" value={form.sitzplaetze} onChange={e => setForm({ ...form, sitzplaetze: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Baujahr</label>
              <input className="form-input" type="number" value={form.baujahr} onChange={e => setForm({ ...form, baujahr: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Antriebsart</label>
            <select className="form-select" value={form.antriebsart} onChange={e => setForm({ ...form, antriebsart: e.target.value })}>
              <option value="Elektro">Elektro</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Wasserstoff">Wasserstoff</option>
            </select>
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
          title={`Linie zu ${assignModal.modell} zuweisen`}
          onClose={() => setAssignModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleAssignLine} disabled={saving || !assignLineId}>Zuweisen</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Linie auswählen</label>
            <select className="form-select" value={assignLineId} onChange={e => setAssignLineId(e.target.value)}>
              <option value="">-- Linie wählen --</option>
              {allLines.map(l => (
                <option key={l._id} value={l._id}>Linie {l.nummer} ({l.typ})</option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal
          title="Fahrzeug löschen"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Löschen...' : 'Unwiderruflich löschen'}</button>
            </>
          }
        >
          <p className="confirm-text">Möchtest du das Fahrzeug <strong>{selected?.modell}</strong> wirklich löschen?</p>
        </Modal>
      )}
    </div>
  )
}
