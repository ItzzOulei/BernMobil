import { useState, useEffect } from 'react'
import { getStations, createStation, updateStation, deleteStation, getSchemaKeys, setDynamicProperty, removeDynamicProperty } from '../services/neo4j.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import { Plus, Pencil, Trash2, Search, MapPin, Accessibility, ShieldCheck, Ticket, X } from 'lucide-react'

const schemaKeys = getSchemaKeys(['Haltestelle'])
const internalKeys = ['_id', '_labels', 'linien']

const emptyStation = {
  name: '', kurzbezeichnung: '', breite_gps: '', laenge_gps: '',
  zone: '', barrierefreiheit: false, ueberdacht: false, billietautomat: false
}

export default function Stations() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyStation)
  const [dynamicPropsList, setDynamicPropsList] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await getStations(true)
      setStations(data)
    } catch (err) {
      toast('Fehler beim Laden der Haltestellen', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(emptyStation)
    setDynamicPropsList([])
    setModal('create')
  }

  function openEdit(station) {
    setSelected(station)
    setForm({
      name: station.name || '',
      kurzbezeichnung: station.kurzbezeichnung || '',
      breite_gps: station.breite_gps ?? '',
      laenge_gps: station.laenge_gps ?? '',
      zone: station.zone ?? '',
      barrierefreiheit: station.barrierefreiheit || false,
      ueberdacht: station.ueberdacht || false,
      billietautomat: station.billietautomat || false,
    })

    const dynProps = Object.keys(station)
      .filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k))
      .map(k => ({ key: k, value: String(station[k]), oldKey: k }))
    setDynamicPropsList(dynProps)

    setModal('edit')
  }

  function openDelete(station) {
    setSelected(station)
    setModal('delete')
  }

  async function handleSave() {
    if (dynamicPropsList.some(p => !p.key.trim())) {
      return toast('Dynamische Schlüssel dürfen nicht leer sein', 'error')
    }

    setSaving(true)
    try {
      let savedEntityId = selected?._id
      if (modal === 'create') {
        const result = await createStation(form)
        savedEntityId = result._id
        toast('Haltestelle erstellt')
      } else {
        await updateStation(selected._id, form)
        toast('Haltestelle aktualisiert')
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
      await deleteStation(selected._id)
      toast('Haltestelle gelöscht')
      setModal(null)
      await loadData()
    } catch (err) {
      toast('Fehler: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = stations.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.kurzbezeichnung?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="page-container"><div className="loading"><div className="spinner"></div><span>Lade Haltestellen...</span></div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Haltestellen</h1>
          <p>{stations.length} Haltestellen im Netzwerk</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Search size={16} /></span>
            <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Neue Haltestelle
          </button>
        </div>
      </div>

      <div className="entity-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MapPin size={48} /></div>
            <h3>Keine Haltestellen gefunden</h3>
          </div>
        ) : filtered.map(s => (
          <div key={s._id} className="entity-card">
            <div className="entity-card-header">
              <div>
                <div className="entity-card-title">{s.name}</div>
                <div className="entity-card-subtitle">{s.kurzbezeichnung}</div>
              </div>
            </div>
            <div className="entity-card-body">
              <div className="entity-card-row"><span>Zone</span><span>{s.zone || '–'}</span></div>
              <div className="entity-card-row"><span>GPS</span><span>{s.breite_gps?.toFixed(4)}, {s.laenge_gps?.toFixed(4)}</span></div>
              <div className="amenity-tags">
                {s.barrierefreiheit && <span className="amenity-tag"><Accessibility size={10} /> Barrierefrei</span>}
                {s.ueberdacht && <span className="amenity-tag"><ShieldCheck size={10} /> Überdacht</span>}
                {s.billietautomat && <span className="amenity-tag"><Ticket size={10} /> Billettautomat</span>}
              </div>
              {s.linien?.length > 0 && (
                <div className="relation-list">
                  {s.linien.map(l => <span key={l} className="relation-chip">Linie {l}</span>)}
                </div>
              )}
              {Object.keys(s).filter(k => !schemaKeys.includes(k) && !internalKeys.includes(k)).map(k => (
                <div key={k} className="entity-card-row">
                  <span>{k}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{String(s[k])}</span>
                </div>
              ))}
            </div>
            <div className="entity-card-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Pencil size={14} /> Bearbeiten</button>
              <button className="btn btn-danger btn-sm" onClick={() => openDelete(s)}><Trash2 size={14} /> Löschen</button>
            </div>
          </div>
        ))}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Neue Haltestelle' : 'Haltestelle bearbeiten'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="z.B. Bern Bahnhof" />
          </div>
          <div className="form-group">
            <label className="form-label">Kurzbezeichnung</label>
            <input className="form-input" value={form.kurzbezeichnung} onChange={e => setForm({ ...form, kurzbezeichnung: e.target.value })} placeholder="z.B. BN" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Breite (GPS)</label>
              <input className="form-input" type="number" step="any" value={form.breite_gps} onChange={e => setForm({ ...form, breite_gps: e.target.value })} placeholder="46.9480" />
            </div>
            <div className="form-group">
              <label className="form-label">Länge (GPS)</label>
              <input className="form-input" type="number" step="any" value={form.laenge_gps} onChange={e => setForm({ ...form, laenge_gps: e.target.value })} placeholder="7.4390" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Zone</label>
            <input className="form-input" type="number" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="z.B. 100" />
          </div>
          <div className="form-group">
            <label className="form-label">Ausstattung</label>
            <div className="form-checkbox-group">
              <label className="form-checkbox-label">
                <input type="checkbox" checked={form.barrierefreiheit} onChange={e => setForm({ ...form, barrierefreiheit: e.target.checked })} /> Barrierefrei
              </label>
              <label className="form-checkbox-label">
                <input type="checkbox" checked={form.ueberdacht} onChange={e => setForm({ ...form, ueberdacht: e.target.checked })} /> Überdacht
              </label>
              <label className="form-checkbox-label">
                <input type="checkbox" checked={form.billietautomat} onChange={e => setForm({ ...form, billietautomat: e.target.checked })} /> Billettautomat
              </label>
            </div>
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

      {modal === 'delete' && (
        <Modal
          title="Haltestelle löschen"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Löschen...' : 'Unwiderruflich löschen'}
              </button>
            </>
          }
        >
          <p className="confirm-text">
            Möchtest du die Haltestelle <strong>{selected?.name}</strong> wirklich löschen?
            Alle Beziehungen (BEDIENT, VERBUNDEN_MIT) werden ebenfalls entfernt.
          </p>
        </Modal>
      )}
    </div>
  )
}
