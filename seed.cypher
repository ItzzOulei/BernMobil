// 1. INDIZES ERSTELLEN
CREATE INDEX idx_haltestelle_name IF NOT EXISTS FOR (h:Haltestelle) ON (h.name);

// 2. DATEN EINFÜGEN (Echte Daten BernMobil, >20 Entitäten pro Objekttyp)
CREATE 
  // --- HALTESTELLEN (30 Eintraege) ---
  // Zentrum & Länggasse
  (h1:Haltestelle {name: 'Bern Bahnhof', kurzbezeichnung: 'BN', breite_gps: 46.9480, laenge_gps: 7.4390, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h2:Haltestelle {name: 'Bärenplatz', kurzbezeichnung: 'BAE', breite_gps: 46.9475, laenge_gps: 7.4442, zone: 100, barrierefreiheit: true, ueberdacht: false, billietautomat: true}),
  (h3:Haltestelle {name: 'Zytglogge', kurzbezeichnung: 'ZYT', breite_gps: 46.9480, laenge_gps: 7.4478, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h4:Haltestelle {name: 'Rathaus', kurzbezeichnung: 'RAT', breite_gps: 46.9486, laenge_gps: 7.4526, zone: 100, barrierefreiheit: false, billietautomat: true}),
  (h5:Haltestelle {name: 'Nydegg', kurzbezeichnung: 'NYD', breite_gps: 46.9488, laenge_gps: 7.4563, zone: 100, ueberdacht: false}),
  
  // Ost (Bärengraben, Liebegg, ZPK, Ostring, Saali)
  (h6:Haltestelle {name: 'Bärengraben', kurzbezeichnung: 'BGR', breite_gps: 46.9484, laenge_gps: 7.4593, zone: 100, barrierefreiheit: true, billietautomat: true}),
  (h7:Haltestelle {name: 'Liebegg', kurzbezeichnung: 'LIE', breite_gps: 46.9476, laenge_gps: 7.4650, zone: 100, barrierefreiheit: true}),
  (h8:Haltestelle {name: 'Zentrum Paul Klee', kurzbezeichnung: 'ZPK', breite_gps: 46.9493, laenge_gps: 7.4740, zone: 101, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h26:Haltestelle {name: 'Ostring', kurzbezeichnung: 'OST', breite_gps: 46.9450, laenge_gps: 7.4700, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h27:Haltestelle {name: 'Saali', kurzbezeichnung: 'SAA', breite_gps: 46.9420, laenge_gps: 7.4750, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),

  // Nord (Viktoriaplatz, Wankdorf, Breitenrain)
  (h9:Haltestelle {name: 'Viktoriaplatz', kurzbezeichnung: 'VIK', breite_gps: 46.9531, laenge_gps: 7.4485, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h10:Haltestelle {name: 'Kursaal', kurzbezeichnung: 'KUR', breite_gps: 46.9520, laenge_gps: 7.4468, zone: 100, ueberdacht: true, billietautomat: false}),
  (h23:Haltestelle {name: 'Bollwerk', kurzbezeichnung: 'BOL', breite_gps: 46.9504, laenge_gps: 7.4385, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h24:Haltestelle {name: 'Lorraine', kurzbezeichnung: 'LORR', breite_gps: 46.9540, laenge_gps: 7.4420, zone: 100, barrierefreiheit: true, billietautomat: true}),
  (h25:Haltestelle {name: 'Wankdorf Bahnhof', kurzbezeichnung: 'WDB', breite_gps: 46.9650, laenge_gps: 7.4640, zone: 101, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h22:Haltestelle {name: 'Guisanplatz Expo', kurzbezeichnung: 'GUI', breite_gps: 46.9580, laenge_gps: 7.4660, zone: 101, barrierefreiheit: true, billietautomat: true}),
  (h18:Haltestelle {name: 'Victoria', kurzbezeichnung: 'VIC', breite_gps: 46.9510, laenge_gps: 7.4420, zone: 100, billietautomat: true}),
  (h19:Haltestelle {name: 'Rosengarten', kurzbezeichnung: 'ROS', breite_gps: 46.9529, laenge_gps: 7.4604, zone: 100, barrierefreiheit: false}),

  // Süd & Wabern
  (h11:Haltestelle {name: 'Hirschengraben', kurzbezeichnung: 'HIR', breite_gps: 46.9472, laenge_gps: 7.4363, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h12:Haltestelle {name: 'Monbijou', kurzbezeichnung: 'MON', breite_gps: 46.9443, laenge_gps: 7.4357, zone: 100, barrierefreiheit: true, billietautomat: true}),
  (h13:Haltestelle {name: 'Sulgenau', kurzbezeichnung: 'SUL', breite_gps: 46.9410, laenge_gps: 7.4372, zone: 100, barrierefreiheit: true}),
  (h14:Haltestelle {name: 'Wander', kurzbezeichnung: 'WAN', breite_gps: 46.9365, laenge_gps: 7.4400, zone: 100, ueberdacht: true, billietautomat: true}),
  (h21:Haltestelle {name: 'Weissenbühl', kurzbezeichnung: 'WEI', breite_gps: 46.9380, laenge_gps: 7.4280, zone: 100, ueberdacht: true}),

  // West (Eigerplatz, Insel, Bümpliz, Westside)
  (h15:Haltestelle {name: 'Eigerplatz', kurzbezeichnung: 'EIG', breite_gps: 46.9419, laenge_gps: 7.4326, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h16:Haltestelle {name: 'Kaufmännischer Verband', kurzbezeichnung: 'KMA', breite_gps: 46.9445, laenge_gps: 7.4330, zone: 100, ueberdacht: true}),
  (h17:Haltestelle {name: 'Kocherpark', kurzbezeichnung: 'KOC', breite_gps: 46.9460, laenge_gps: 7.4345, zone: 100, barrierefreiheit: true, billietautomat: true}),
  (h20:Haltestelle {name: 'Loryplatz', kurzbezeichnung: 'LOR', breite_gps: 46.9440, laenge_gps: 7.4200, zone: 100, barrierefreiheit: true, billietautomat: true}),
  (h28:Haltestelle {name: 'Bümpliz', kurzbezeichnung: 'BUM', breite_gps: 46.9400, laenge_gps: 7.3950, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h29:Haltestelle {name: 'Brünnen Westside', kurzbezeichnung: 'BRW', breite_gps: 46.9450, laenge_gps: 7.3750, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),
  (h30:Haltestelle {name: 'Inselspital', kurzbezeichnung: 'INS', breite_gps: 46.9480, laenge_gps: 7.4200, zone: 100, barrierefreiheit: true, ueberdacht: true, billietautomat: true}),

  // --- LINIEN (20 Eintraege) ---
  (l3:Linie {nummer: 3, typ: 'Tram', nachtlinie: false}),
  (l6:Linie {nummer: 6, typ: 'Tram', nachtlinie: false}),
  (l7:Linie {nummer: 7, typ: 'Tram', nachtlinie: false}),
  (l8:Linie {nummer: 8, typ: 'Tram', nachtlinie: false}),
  (l9:Linie {nummer: 9, typ: 'Tram', nachtlinie: false}),
  (l10:Linie {nummer: 10, typ: 'Bus', nachtlinie: false}),
  (l11:Linie {nummer: 11, typ: 'Bus', nachtlinie: false}),
  (l12:Linie {nummer: 12, typ: 'Bus', nachtlinie: false}),
  (l17:Linie {nummer: 17, typ: 'Bus', nachtlinie: false}),
  (l19:Linie {nummer: 19, typ: 'Bus', nachtlinie: false}),
  (l20:Linie {nummer: 20, typ: 'Bus', nachtlinie: false}),
  (l21:Linie {nummer: 21, typ: 'Bus', nachtlinie: false}),
  (l27:Linie {nummer: 27, typ: 'Bus', nachtlinie: false}),
  (l28:Linie {nummer: 28, typ: 'Bus', nachtlinie: false}),
  (l29:Linie {nummer: 29, typ: 'Bus', nachtlinie: false}),
  (l30:Linie {nummer: 30, typ: 'Bus', nachtlinie: false}),
  (l31:Linie {nummer: 31, typ: 'Bus', nachtlinie: false}),
  (l32:Linie {nummer: 32, typ: 'Bus', nachtlinie: false}),
  (l91:Linie {nummer: 91, typ: 'Bus', nachtlinie: true}),
  (l92:Linie {nummer: 92, typ: 'Bus', nachtlinie: true}),

  // --- FAHRZEUGE (20 Eintraege) ---
  (f1:Fahrzeug {modell: 'Hess Swisstrolley 5', sitzplaetze: 130, antriebsart: 'Elektro (Trolley)', baujahr: 2018}),
  (f2:Fahrzeug {modell: 'Hess Swisstrolley 5', sitzplaetze: 130, antriebsart: 'Elektro (Trolley)', baujahr: 2018}),
  (f3:Fahrzeug {modell: 'Hess Swisstrolley 5', sitzplaetze: 130, antriebsart: 'Elektro (Trolley)', baujahr: 2019}),
  (f4:Fahrzeug {modell: 'Hess Swisstrolley 5', sitzplaetze: 130, antriebsart: 'Elektro (Trolley)', baujahr: 2019}),
  (f5:Fahrzeug {modell: 'Hess Swisstrolley 5', sitzplaetze: 130, antriebsart: 'Elektro (Trolley)', baujahr: 2020}),
  (f6:Fahrzeug {modell: 'Siemens Combino', sitzplaetze: 236, antriebsart: 'Elektro', baujahr: 2003}),
  (f7:Fahrzeug {modell: 'Siemens Combino', sitzplaetze: 236, antriebsart: 'Elektro', baujahr: 2003}),
  (f8:Fahrzeug {modell: 'Siemens Combino', sitzplaetze: 236, antriebsart: 'Elektro', baujahr: 2004}),
  (f9:Fahrzeug {modell: 'Siemens Combino', sitzplaetze: 236, antriebsart: 'Elektro', baujahr: 2004}),
  (f10:Fahrzeug {modell: 'Siemens Combino', sitzplaetze: 236, antriebsart: 'Elektro', baujahr: 2005}),
  (f11:Fahrzeug {modell: 'Stadler Tramlink', sitzplaetze: 260, antriebsart: 'Elektro', baujahr: 2023}),
  (f12:Fahrzeug {modell: 'Stadler Tramlink', sitzplaetze: 260, antriebsart: 'Elektro', baujahr: 2023}),
  (f13:Fahrzeug {modell: 'Stadler Tramlink', sitzplaetze: 260, antriebsart: 'Elektro', baujahr: 2023}),
  (f14:Fahrzeug {modell: 'Stadler Tramlink', sitzplaetze: 260, antriebsart: 'Elektro', baujahr: 2024}),
  (f15:Fahrzeug {modell: 'Stadler Tramlink', sitzplaetze: 260, antriebsart: 'Elektro', baujahr: 2024}),
  (f16:Fahrzeug {modell: 'Mercedes-Benz Citaro', sitzplaetze: 105, antriebsart: 'Gas', baujahr: 2015}),
  (f17:Fahrzeug {modell: 'Mercedes-Benz Citaro', sitzplaetze: 105, antriebsart: 'Gas', baujahr: 2015}),
  (f18:Fahrzeug {modell: 'Mercedes-Benz Citaro', sitzplaetze: 105, antriebsart: 'Gas', baujahr: 2016}),
  (f19:Fahrzeug {modell: 'Mercedes-Benz Citaro Hybrid', sitzplaetze: 105, antriebsart: 'Hybrid', baujahr: 2020}),
  (f20:Fahrzeug {modell: 'Mercedes-Benz Citaro Hybrid', sitzplaetze: 105, antriebsart: 'Hybrid', baujahr: 2020})

WITH 
  h1, h2, h3, h4, h5, h6, h7, h8, h9, h10, 
  h11, h12, h13, h14, h15, h16, h17, h18, h19, h20, 
  h21, h22, h23, h24, h25, h26, h27, h28, h29, h30,
  l3, l6, l7, l8, l9, l10, l11, l12, l17, l19, 
  l20, l21, l27, l28, l29, l30, l31, l32, l91, l92,
  f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, 
  f11, f12, f13, f14, f15, f16, f17, f18, f19, f20

// --- STRECKENVERLAUF DEFINIEREN (VERBUNDEN_MIT) ---
CREATE (h1)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 2}]->(h2), (h2)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 2}]->(h1)
CREATE (h2)-[:VERBUNDEN_MIT {distanz: 300, fahrzeit: 1}]->(h3), (h3)-[:VERBUNDEN_MIT {distanz: 300, fahrzeit: 1}]->(h2)
CREATE (h3)-[:VERBUNDEN_MIT {distanz: 450, fahrzeit: 2}]->(h4), (h4)-[:VERBUNDEN_MIT {distanz: 450, fahrzeit: 2}]->(h3)
CREATE (h4)-[:VERBUNDEN_MIT {distanz: 250, fahrzeit: 1}]->(h5), (h5)-[:VERBUNDEN_MIT {distanz: 250, fahrzeit: 1}]->(h4)
CREATE (h5)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h6), (h6)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h5)
CREATE (h6)-[:VERBUNDEN_MIT {distanz: 600, fahrzeit: 2}]->(h7), (h7)-[:VERBUNDEN_MIT {distanz: 600, fahrzeit: 2}]->(h6)
CREATE (h7)-[:VERBUNDEN_MIT {distanz: 800, fahrzeit: 2}]->(h8), (h8)-[:VERBUNDEN_MIT {distanz: 800, fahrzeit: 2}]->(h7)
CREATE (h9)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h10), (h10)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h9)
CREATE (h10)-[:VERBUNDEN_MIT {distanz: 850, fahrzeit: 3}]->(h1), (h1)-[:VERBUNDEN_MIT {distanz: 850, fahrzeit: 3}]->(h10)
CREATE (h1)-[:VERBUNDEN_MIT {distanz: 600, fahrzeit: 2}]->(h11), (h11)-[:VERBUNDEN_MIT {distanz: 600, fahrzeit: 2}]->(h1)
CREATE (h11)-[:VERBUNDEN_MIT {distanz: 500, fahrzeit: 2}]->(h12), (h12)-[:VERBUNDEN_MIT {distanz: 500, fahrzeit: 2}]->(h11)
CREATE (h12)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h13), (h13)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h12)
CREATE (h13)-[:VERBUNDEN_MIT {distanz: 550, fahrzeit: 2}]->(h14), (h14)-[:VERBUNDEN_MIT {distanz: 550, fahrzeit: 2}]->(h13)
CREATE (h15)-[:VERBUNDEN_MIT {distanz: 300, fahrzeit: 1}]->(h16), (h16)-[:VERBUNDEN_MIT {distanz: 300, fahrzeit: 1}]->(h15)
CREATE (h16)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h17), (h17)-[:VERBUNDEN_MIT {distanz: 350, fahrzeit: 1}]->(h16)
CREATE (h17)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h11), (h11)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h17)
CREATE (h1)-[:VERBUNDEN_MIT {distanz: 700, fahrzeit: 2}]->(h18), (h18)-[:VERBUNDEN_MIT {distanz: 700, fahrzeit: 2}]->(h1)
CREATE (h18)-[:VERBUNDEN_MIT {distanz: 900, fahrzeit: 3}]->(h19), (h19)-[:VERBUNDEN_MIT {distanz: 900, fahrzeit: 3}]->(h18)
CREATE (h1)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h23), (h23)-[:VERBUNDEN_MIT {distanz: 400, fahrzeit: 1}]->(h1)
CREATE (h23)-[:VERBUNDEN_MIT {distanz: 900, fahrzeit: 3}]->(h24), (h24)-[:VERBUNDEN_MIT {distanz: 900, fahrzeit: 3}]->(h23)
CREATE (h24)-[:VERBUNDEN_MIT {distanz: 1200, fahrzeit: 4}]->(h25), (h25)-[:VERBUNDEN_MIT {distanz: 1200, fahrzeit: 4}]->(h24)
CREATE (h1)-[:VERBUNDEN_MIT {distanz: 800, fahrzeit: 3}]->(h30), (h30)-[:VERBUNDEN_MIT {distanz: 800, fahrzeit: 3}]->(h1)
CREATE (h3)-[:VERBUNDEN_MIT {distanz: 1500, fahrzeit: 5}]->(h26), (h26)-[:VERBUNDEN_MIT {distanz: 1500, fahrzeit: 5}]->(h3)
CREATE (h15)-[:VERBUNDEN_MIT {distanz: 2500, fahrzeit: 8}]->(h28), (h28)-[:VERBUNDEN_MIT {distanz: 2500, fahrzeit: 8}]->(h15)
CREATE (h28)-[:VERBUNDEN_MIT {distanz: 1200, fahrzeit: 4}]->(h29), (h29)-[:VERBUNDEN_MIT {distanz: 1200, fahrzeit: 4}]->(h28)
CREATE (h6)-[:VERBUNDEN_MIT {distanz: 1100, fahrzeit: 4}]->(h27), (h27)-[:VERBUNDEN_MIT {distanz: 1100, fahrzeit: 4}]->(h6)

// --- LINIEN DEN HALTESTELLEN ZUWEISEN (BEDIENT) ---
CREATE (l3)-[:BEDIENT]->(h1), (l3)-[:BEDIENT]->(h21)
CREATE (l6)-[:BEDIENT]->(h1), (l6)-[:BEDIENT]->(h3), (l6)-[:BEDIENT]->(h26)
CREATE (l7)-[:BEDIENT]->(h26), (l7)-[:BEDIENT]->(h3), (l7)-[:BEDIENT]->(h1), (l7)-[:BEDIENT]->(h28)
CREATE (l8)-[:BEDIENT]->(h27), (l8)-[:BEDIENT]->(h6), (l8)-[:BEDIENT]->(h3), (l8)-[:BEDIENT]->(h1), (l8)-[:BEDIENT]->(h29)
CREATE (l9)-[:BEDIENT]->(h9), (l9)-[:BEDIENT]->(h10), (l9)-[:BEDIENT]->(h1), (l9)-[:BEDIENT]->(h11), (l9)-[:BEDIENT]->(h12), (l9)-[:BEDIENT]->(h13), (l9)-[:BEDIENT]->(h14)
CREATE (l10)-[:BEDIENT]->(h15), (l10)-[:BEDIENT]->(h16), (l10)-[:BEDIENT]->(h17), (l10)-[:BEDIENT]->(h11), (l10)-[:BEDIENT]->(h1), (l10)-[:BEDIENT]->(h18), (l10)-[:BEDIENT]->(h19)
CREATE (l11)-[:BEDIENT]->(h1), (l11)-[:BEDIENT]->(h23)
CREATE (l12)-[:BEDIENT]->(h1), (l12)-[:BEDIENT]->(h2), (l12)-[:BEDIENT]->(h3), (l12)-[:BEDIENT]->(h4), (l12)-[:BEDIENT]->(h5), (l12)-[:BEDIENT]->(h6), (l12)-[:BEDIENT]->(h7), (l12)-[:BEDIENT]->(h8)
CREATE (l17)-[:BEDIENT]->(h1), (l17)-[:BEDIENT]->(h15)
CREATE (l19)-[:BEDIENT]->(h1), (l19)-[:BEDIENT]->(h11)
CREATE (l20)-[:BEDIENT]->(h1), (l20)-[:BEDIENT]->(h23), (l20)-[:BEDIENT]->(h24), (l20)-[:BEDIENT]->(h25)
CREATE (l21)-[:BEDIENT]->(h1), (l21)-[:BEDIENT]->(h23)
CREATE (l27)-[:BEDIENT]->(h29)
CREATE (l28)-[:BEDIENT]->(h21), (l28)-[:BEDIENT]->(h25)
CREATE (l29)-[:BEDIENT]->(h14)
CREATE (l30)-[:BEDIENT]->(h1)
CREATE (l31)-[:BEDIENT]->(h28)
CREATE (l32)-[:BEDIENT]->(h29)
CREATE (l91)-[:BEDIENT]->(h1), (l91)-[:BEDIENT]->(h3)
CREATE (l92)-[:BEDIENT]->(h1), (l92)-[:BEDIENT]->(h15)

// --- FAHRZEUGE DEN LINIEN ZUWEISEN (EINGESETZT_AUF) ---
CREATE (f1)-[:EINGESETZT_AUF]->(l12), (f2)-[:EINGESETZT_AUF]->(l12)
CREATE (f3)-[:EINGESETZT_AUF]->(l10), (f4)-[:EINGESETZT_AUF]->(l10), (f5)-[:EINGESETZT_AUF]->(l11)
CREATE (f6)-[:EINGESETZT_AUF]->(l9), (f7)-[:EINGESETZT_AUF]->(l9), (f8)-[:EINGESETZT_AUF]->(l3)
CREATE (f9)-[:EINGESETZT_AUF]->(l6), (f10)-[:EINGESETZT_AUF]->(l7)
CREATE (f11)-[:EINGESETZT_AUF]->(l8), (f12)-[:EINGESETZT_AUF]->(l8), (f13)-[:EINGESETZT_AUF]->(l9)
CREATE (f14)-[:EINGESETZT_AUF]->(l3), (f15)-[:EINGESETZT_AUF]->(l6)
CREATE (f16)-[:EINGESETZT_AUF]->(l20), (f17)-[:EINGESETZT_AUF]->(l20)
CREATE (f18)-[:EINGESETZT_AUF]->(l17), (f19)-[:EINGESETZT_AUF]->(l19), (f20)-[:EINGESETZT_AUF]->(l21);
