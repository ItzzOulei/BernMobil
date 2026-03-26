import neo4j from 'neo4j-driver'

const NEO4J_URI = import.meta.env.VITE_NEO4J_URI || 'bolt://localhost:17687'
const READ_USER = import.meta.env.VITE_NEO4J_READ_USER || 'app_user'
const READ_PASS = import.meta.env.VITE_NEO4J_READ_PASS || 'b3rnm0bil'

let driver = null
let authDriver = null

// ─── Public read-only driver (for Home page) ───
export function getPublicDriver() {
  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(READ_USER, READ_PASS))
  }
  return driver
}

// ─── Authenticated driver (for Netzplaner) ───
export async function login(username, password) {
  const uri = NEO4J_URI
  const testDriver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  await testDriver.verifyConnectivity()
  authDriver = testDriver
  return { username }
}

export function getAuthDriver() {
  return authDriver
}

export function logout() {
  if (authDriver) {
    authDriver.close()
    authDriver = null
  }
}

export function closeAll() {
  if (driver) { driver.close(); driver = null }
  if (authDriver) { authDriver.close(); authDriver = null }
}

// ─── Helper: run query ───
async function runQuery(cypher, params = {}, useAuth = false) {
  const d = useAuth && authDriver ? authDriver : getPublicDriver()
  const session = d.session({ database: 'neo4j' })
  try {
    const result = await session.run(cypher, params)
    return result.records
  } finally {
    await session.close()
  }
}

// For write operations we always use transaction
async function runWrite(cypher, params = {}) {
  if (!authDriver) throw new Error('Nicht angemeldet')
  const session = authDriver.session({ database: 'neo4j' })
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, params))
    return result.records
  } finally {
    await session.close()
  }
}

// ─── Stats ───
export async function getStats(useAuth = false) {
  const [stations, lines, vehicles] = await Promise.all([
    runQuery('MATCH (h:Haltestelle) RETURN count(h) AS count', {}, useAuth),
    runQuery('MATCH (l:Linie) RETURN count(l) AS count', {}, useAuth),
    runQuery('MATCH (f:Fahrzeug) RETURN count(f) AS count', {}, useAuth),
  ])
  return {
    stations: stations[0]?.get('count').toNumber() || 0,
    lines: lines[0]?.get('count').toNumber() || 0,
    vehicles: vehicles[0]?.get('count').toNumber() || 0,
  }
}

// ─── HALTESTELLEN (Stations) ───
export async function getStations(useAuth = false) {
  const records = await runQuery(
    `MATCH (h:Haltestelle)
     OPTIONAL MATCH (l:Linie)-[:BEDIENT]->(h)
     RETURN h, collect(DISTINCT l.nummer) AS linien
     ORDER BY h.name`,
    {}, useAuth
  )
  return records.map(r => ({
    ...nodeToObj(r.get('h')),
    linien: r.get('linien').map(n => n?.toNumber ? n.toNumber() : n),
  }))
}

export async function createStation(data) {
  const records = await runWrite(
    `CREATE (h:Haltestelle {
       name: $name,
       kurzbezeichnung: $kurzbezeichnung,
       breite_gps: toFloat($breite_gps),
       laenge_gps: toFloat($laenge_gps),
       zone: toInteger($zone),
       barrierefreiheit: $barrierefreiheit,
       ueberdacht: $ueberdacht,
       billietautomat: $billietautomat
     })
     RETURN h`,
    data
  )
  return nodeToObj(records[0].get('h'))
}

export async function updateStation(id, data) {
  const records = await runWrite(
    `MATCH (h:Haltestelle) WHERE elementId(h) = $id
     SET h.name = $name,
         h.kurzbezeichnung = $kurzbezeichnung,
         h.breite_gps = toFloat($breite_gps),
         h.laenge_gps = toFloat($laenge_gps),
         h.zone = toInteger($zone),
         h.barrierefreiheit = $barrierefreiheit,
         h.ueberdacht = $ueberdacht,
         h.billietautomat = $billietautomat
     RETURN h`,
    { id, ...data }
  )
  return nodeToObj(records[0].get('h'))
}

export async function deleteStation(id) {
  await runWrite(
    `MATCH (h:Haltestelle) WHERE elementId(h) = $id DETACH DELETE h`,
    { id }
  )
}

// ─── LINIEN (Lines) ───
export async function getLines(useAuth = false) {
  const records = await runQuery(
    `MATCH (l:Linie)
     OPTIONAL MATCH (l)-[b:BEDIENT]->(h:Haltestelle)
     WITH l, h, b
     ORDER BY COALESCE(b.reihenfolge, 9999)
     RETURN l, collect({name: h.name, id: elementId(h), reihenfolge: b.reihenfolge}) AS haltestellen
     ORDER BY l.nummer`,
    {}, useAuth
  )
  return records.map(r => ({
    ...nodeToObj(r.get('l')),
    haltestellen: r.get('haltestellen').filter(h => h.name !== null).map(h => ({
      name: h.name,
      id: h.id,
      reihenfolge: h.reihenfolge?.toNumber ? h.reihenfolge.toNumber() : (h.reihenfolge ?? 999),
    })),
  }))
}

export async function createLine(data) {
  const records = await runWrite(
    `CREATE (l:Linie {
       nummer: toInteger($nummer),
       typ: $typ,
       nachtlinie: $nachtlinie
     })
     RETURN l`,
    data
  )
  return nodeToObj(records[0].get('l'))
}

export async function updateLine(id, data) {
  const records = await runWrite(
    `MATCH (l:Linie) WHERE elementId(l) = $id
     SET l.nummer = toInteger($nummer),
         l.typ = $typ,
         l.nachtlinie = $nachtlinie
     RETURN l`,
    { id, ...data }
  )
  return nodeToObj(records[0].get('l'))
}

export async function deleteLine(id) {
  await runWrite(
    `MATCH (l:Linie) WHERE elementId(l) = $id DETACH DELETE l`,
    { id }
  )
}

export async function assignStationToLine(lineId, stationId) {
  // Get max order so far on this line, then add at end
  const records = await runWrite(
    `MATCH (l:Linie) WHERE elementId(l) = $lineId
     OPTIONAL MATCH (l)-[b:BEDIENT]->(:Haltestelle)
     WITH l, COALESCE(MAX(b.reihenfolge), 0) AS maxOrder
     MATCH (h:Haltestelle) WHERE elementId(h) = $stationId
     MERGE (l)-[r:BEDIENT]->(h)
     ON CREATE SET r.reihenfolge = maxOrder + 1
     RETURN r`,
    { lineId, stationId }
  )
}

export async function removeStationFromLine(lineId, stationId) {
  await runWrite(
    `MATCH (l:Linie)-[r:BEDIENT]->(h:Haltestelle)
     WHERE elementId(l) = $lineId AND elementId(h) = $stationId
     DELETE r`,
    { lineId, stationId }
  )
}

export async function updateStationOrder(lineId, stationIds) {
  // stationIds is the ordered array of station element IDs
  // Update each BEDIENT relationship's reihenfolge
  await runWrite(
    `MATCH (l:Linie) WHERE elementId(l) = $lineId
     MATCH (l)-[b:BEDIENT]->(h:Haltestelle)
     WITH b, h, $stationIds AS ids
     WITH b, h, [i IN range(0, size(ids)-1) WHERE ids[i] = elementId(h) | i][0] AS pos
     SET b.reihenfolge = COALESCE(pos + 1, 999)`,
    { lineId, stationIds }
  )
}

// ─── FAHRZEUGE (Vehicles) ───
export async function getVehicles(useAuth = false) {
  const records = await runQuery(
    `MATCH (f:Fahrzeug)
     OPTIONAL MATCH (f)-[:EINGESETZT_AUF]->(l:Linie)
     RETURN f, collect(DISTINCT l.nummer) AS linien
     ORDER BY f.modell`,
    {}, useAuth
  )
  return records.map(r => ({
    ...nodeToObj(r.get('f')),
    linien: r.get('linien').map(n => n?.toNumber ? n.toNumber() : n),
  }))
}

export async function createVehicle(data) {
  const records = await runWrite(
    `CREATE (f:Fahrzeug {
       modell: $modell,
       sitzplaetze: toInteger($sitzplaetze),
       antriebsart: $antriebsart,
       baujahr: toInteger($baujahr)
     })
     RETURN f`,
    data
  )
  return nodeToObj(records[0].get('f'))
}

export async function updateVehicle(id, data) {
  const records = await runWrite(
    `MATCH (f:Fahrzeug) WHERE elementId(f) = $id
     SET f.modell = $modell,
         f.sitzplaetze = toInteger($sitzplaetze),
         f.antriebsart = $antriebsart,
         f.baujahr = toInteger($baujahr)
     RETURN f`,
    { id, ...data }
  )
  return nodeToObj(records[0].get('f'))
}

export async function deleteVehicle(id) {
  await runWrite(
    `MATCH (f:Fahrzeug) WHERE elementId(f) = $id DETACH DELETE f`,
    { id }
  )
}

export async function assignVehicleToLine(vehicleId, lineId) {
  await runWrite(
    `MATCH (f:Fahrzeug) WHERE elementId(f) = $vehicleId
     MATCH (l:Linie) WHERE elementId(l) = $lineId
     MERGE (f)-[:EINGESETZT_AUF]->(l)`,
    { vehicleId, lineId }
  )
}

export async function removeVehicleFromLine(vehicleId, lineId) {
  await runWrite(
    `MATCH (f:Fahrzeug)-[r:EINGESETZT_AUF]->(l:Linie)
     WHERE elementId(f) = $vehicleId AND elementId(l) = $lineId
     DELETE r`,
    { vehicleId, lineId }
  )
}

// ─── NETWORK MAP ───
export async function getNetworkData(useAuth = false) {
  const [stationRecords, connectionRecords, lineRouteRecords] = await Promise.all([
    runQuery(
      `MATCH (h:Haltestelle)
       OPTIONAL MATCH (l:Linie)-[:BEDIENT]->(h)
       RETURN h, collect(DISTINCT {nummer: l.nummer, typ: l.typ}) AS linien`,
      {}, useAuth
    ),
    runQuery(
      `MATCH (h1:Haltestelle)-[v:VERBUNDEN_MIT]->(h2:Haltestelle)
       RETURN elementId(h1) AS from, elementId(h2) AS to, v.distanz AS distanz, v.fahrzeit AS fahrzeit`,
      {}, useAuth
    ),
    runQuery(
      `MATCH (l:Linie)-[b:BEDIENT]->(h:Haltestelle)
       WITH l, h, b ORDER BY COALESCE(b.reihenfolge, 9999)
       RETURN elementId(l) AS lineId, l.nummer AS nummer, l.typ AS typ, l.nachtlinie AS nachtlinie,
              collect({id: elementId(h), name: h.name}) AS stationen
       ORDER BY l.nummer`,
      {}, useAuth
    ),
  ])

  const stations = stationRecords.map(r => ({
    ...nodeToObj(r.get('h')),
    linien: r.get('linien').filter(l => l.nummer !== null),
  }))

  const connections = connectionRecords.map(r => ({
    from: r.get('from'),
    to: r.get('to'),
    distanz: r.get('distanz')?.toNumber?.() ?? r.get('distanz'),
    fahrzeit: r.get('fahrzeit')?.toNumber?.() ?? r.get('fahrzeit'),
  }))

  const lineRoutes = lineRouteRecords.map(r => ({
    lineId: r.get('lineId'),
    nummer: r.get('nummer')?.toNumber?.() ?? r.get('nummer'),
    typ: r.get('typ'),
    nachtlinie: r.get('nachtlinie'),
    stationIds: r.get('stationen').map(s => s.id),
    stationNames: r.get('stationen').map(s => s.name),
  }))

  return { stations, connections, lineRoutes }
}

// ─── DYNAMIC PROPERTIES ───
// Known/schema properties per label – everything else is "dynamic"
const SCHEMA_KEYS = {
  Haltestelle: ['name', 'kurzbezeichnung', 'breite_gps', 'laenge_gps', 'zone', 'barrierefreiheit', 'ueberdacht', 'billietautomat'],
  Linie: ['nummer', 'typ', 'nachtlinie'],
  Fahrzeug: ['modell', 'sitzplaetze', 'antriebsart', 'baujahr'],
}

export function getSchemaKeys(labels) {
  for (const label of labels || []) {
    if (SCHEMA_KEYS[label]) return SCHEMA_KEYS[label]
  }
  return []
}

export async function setDynamicProperty(nodeId, key, value) {
  // Always save as string
  const strValue = String(value)

  await runWrite(
    `MATCH (n) WHERE elementId(n) = $id SET n[$key] = $value`,
    { id: nodeId, key, value: strValue }
  )
}

export async function removeDynamicProperty(nodeId, key) {
  await runWrite(
    `MATCH (n) WHERE elementId(n) = $id REMOVE n[$key]`,
    { id: nodeId, key }
  )
}

// ─── Utility ───
function nodeToObj(node) {
  const props = {}
  for (const [key, val] of Object.entries(node.properties)) {
    if (neo4j.isInt(val)) {
      props[key] = val.toNumber()
    } else {
      props[key] = val
    }
  }
  return { _id: node.elementId, _labels: node.labels, ...props }
}
