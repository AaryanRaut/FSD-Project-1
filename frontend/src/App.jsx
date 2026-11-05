import React, { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:8081/api';

function riskClass(risk = '') {
  return risk.toLowerCase().replace(/\s+/g, '-');
}
function StatCard({ label, value, hint, icon }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [weather, setWeather] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', zone: '', address: '', capacity: '60', peoplePresent: '0', waterAvailable: true });

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [dashRes, weatherRes] = await Promise.all([fetch(`${API}/dashboard`), fetch(`${API}/weather`)]);
      if (!dashRes.ok || !weatherRes.ok) throw new Error('The API returned an error. Is the backend running on port 8081?');
      const dash = await dashRes.json();
      setDashboard(dash);
      setWeather(await weatherRes.json());
      if (!selectedZone && dash.zones?.length) setSelectedZone(dash.zones[0].name);
    } catch (e) {
      setError('Could not connect to UrbanHeat backend. Start Spring Boot in the backend folder with: mvn spring-boot:run');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const zones = dashboard?.zones || [];
  const hotspots = dashboard?.hotspots || [];
  const centers = dashboard?.coolingCenters || [];
  const activeZone = zones.find(z => z.name === selectedZone) || zones[0];
  const highRiskZones = zones.filter(z => ['high', 'critical'].includes((z.riskLevel || '').toLowerCase()));

  const selectedHotspots = useMemo(() => activeZone ? hotspots.filter(h => h.zone === activeZone.name) : hotspots, [activeZone, hotspots]);

  async function addCenter(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/cooling-centers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, capacity: Number(form.capacity), peoplePresent: Number(form.peoplePresent),
          status: Number(form.peoplePresent) >= Number(form.capacity) ? 'Full' : 'Open'
        })
      });
      if (!response.ok) throw new Error('Could not save cooling center');
      setForm({ name: '', zone: '', address: '', capacity: '60', peoplePresent: '0', waterAvailable: true });
      setShowForm(false);
      await loadData();
      setTab('Cooling Centers');
    } catch { setError('Could not save the cooling center. Check the backend terminal and try again.'); }
  }

  if (loading) return <div className="loading-screen"><div className="brand-mark">UH</div><h2>UrbanHeat</h2><p>Connecting to city operations data…</p></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">UH</div><div><strong>UrbanHeat</strong><span>City operations</span></div></div>
      <div className="city-select"><span className="city-dot"></span><div><small>MONITORING CITY</small><strong>Metro District</strong></div><span className="chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      {[
        ['Overview', '▦'], ['Heat Hotspots', '◉'], ['City Zones', '⌘'], ['Cooling Centers', '⌂'], ['Weather Records', '☼']
      ].map(([name, icon]) => <button key={name} className={`nav-item ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}><span className="nav-icon">{icon}</span>{name}{name === 'Heat Hotspots' && <span className="nav-count">{hotspots.length}</span>}</button>)}
      <div className="sidebar-bottom"><div className="live-indicator"><span></span> Demo data loaded</div><p>UrbanHeat municipal monitoring prototype</p><div className="admin-chip"><div className="avatar">CA</div><div><strong>City Administrator</strong><small>Operations dashboard</small></div></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><div className="breadcrumb">Workspace <span>/</span> {tab}</div><h1>{tab === 'Overview' ? 'City heat overview' : tab}</h1><p>Monitor heat exposure, identify vulnerable zones, and coordinate cooling support.</p></div><div className="top-actions"><div className="updated-chip"><span className="live-dot"></span> Demo snapshot</div><button className="refresh-button" onClick={loadData}>↻ <span>Refresh</span></button></div></header>
      {error && <div className="error-banner">{error}</div>}
      {!dashboard && <div className="empty-state"><h2>UrbanHeat API is not available</h2><p>Start the backend and refresh this page.</p><button className="primary-button" onClick={loadData}>Try again</button></div>}

      {dashboard && tab === 'Overview' && <>
        <div className="notice"><span className="notice-symbol">!</span><div><strong>Operational demo view</strong><p>Values shown are sample records for project demonstration, not official live alerts.</p></div><span className="notice-tag">DEMO</span></div>
        <section className="stats-grid">
          <StatCard label="City zones monitored" value={dashboard.zoneCount} hint="Across the demo city" icon="⌖" />
          <StatCard label="Heat hotspots" value={dashboard.hotspotCount} hint="Mapped locations" icon="◉" />
          <StatCard label="High-risk zones" value={dashboard.highRiskZones} hint="High or critical status" icon="⚠" />
          <StatCard
  label="Total cooling centers"
  value={centers.length}
  hint="Registered city facilities"
  icon="⌂"
/>
        </section>
        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-heading"><div><span className="eyebrow">GEOSPATIAL VIEW</span><h2>Heat hotspot map</h2><p>Select a zone to inspect its heat status.</p></div><span className="map-badge">Schematic map</span></div>
            <div className="map-canvas">
              <div className="map-river"></div><div className="map-park park-one"></div><div className="map-park park-two"></div>
              <div className="map-road road-one"></div><div className="map-road road-two"></div><div className="map-road road-three"></div><div className="map-road road-four"></div>
              <div className="map-grid-lines"></div>
              {zones.map((zone, i) => <button key={zone.id || zone.name} className={`zone-block zone-${i + 1} ${selectedZone === zone.name ? 'zone-selected' : ''} ${riskClass(zone.riskLevel)}`} onClick={() => setSelectedZone(zone.name)} title={`Inspect ${zone.name}`}><span>{zone.name}</span><strong>{zone.temperature}°</strong><small>{zone.riskLevel} risk</small></button>)}
              {hotspots.map((spot, i) => <div key={spot.id || spot.name} className={`hotspot-dot hotspot-${i + 1} ${riskClass(spot.severity)}`} title={`${spot.name}: ${spot.temperature}°C`}><span></span></div>)}
              {centers.map((center, i) => <div key={center.id || center.name} className={`cooling-pin pin-${i + 1}`} title={`Cooling center: ${center.name}`}>✚</div>)}
              <div className="map-label map-label-n">N ↑</div><div className="map-attribution">Illustrative city zones · not geographic coordinates</div>
            </div>
            <div className="map-legend"><span><i className="legend-dot critical"></i> Critical</span><span><i className="legend-dot high"></i> High</span><span><i className="legend-dot moderate"></i> Moderate</span><span><i className="legend-plus">+</i> Cooling center</span></div>
          </div>
          <div className="panel zone-panel">
            <div className="panel-heading"><div><span className="eyebrow">ZONE INSIGHT</span><h2>{activeZone?.name || 'Select a zone'}</h2><p>{activeZone?.district || 'District'} district</p></div>{activeZone && <span className={`risk-pill ${riskClass(activeZone.riskLevel)}`}>{activeZone.riskLevel}</span>}</div>
            {activeZone && <><div className="temperature-block"><div><span>Recorded temperature</span><strong>{activeZone.temperature}°<small>C</small></strong></div><div className="temp-icon">☀</div></div><div className="mini-metrics"><div><span>Humidity</span><strong>{activeZone.humidity}%</strong></div><div><span>Population</span><strong>{activeZone.population.toLocaleString()}</strong></div></div><div className="zone-note"><strong>Zone observation</strong><p>{activeZone.notes}</p></div><div className="zone-hotspots"><strong>Hotspots in this zone <span>{selectedHotspots.length}</span></strong>{selectedHotspots.length ? selectedHotspots.map(h => <div className="hotspot-row" key={h.id || h.name}><span className={`tiny-status ${riskClass(h.severity)}`}></span><div><strong>{h.name}</strong><small>{h.cause}</small></div><b>{h.temperature}°C</b></div>) : <p className="muted">No hotspot record listed for this zone.</p>}</div></>}
          </div>
        </section>
        <section className="content-grid lower-grid">
          <div className="panel">
            <div className="panel-heading"><div><span className="eyebrow">PRIORITY RESPONSE</span><h2>Area-based warnings</h2><p>Zones needing municipal attention.</p></div><button className="text-button" onClick={() => setTab('City Zones')}>View zones →</button></div>
            <div className="warning-list">{highRiskZones.map(z => <div className="warning-row" key={z.id || z.name}><div className={`warning-symbol ${riskClass(z.riskLevel)}`}>!</div><div className="warning-copy"><strong>{z.name}</strong><span>{z.temperature}°C · {z.population.toLocaleString()} residents</span></div><span className={`risk-pill ${riskClass(z.riskLevel)}`}>{z.riskLevel}</span></div>)}</div>
          </div>
          <div className="panel">
            <div className="panel-heading"><div><span className="eyebrow">PUBLIC COOLING</span><h2>Cooling center capacity</h2><p>Sample center occupancy.</p></div><button className="text-button" onClick={() => setTab('Cooling Centers')}>View centers →</button></div>
            <div className="center-summary">{centers.map(c => {const pct = Math.min(100, Math.round((c.peoplePresent / Math.max(c.capacity, 1)) * 100)); return <div className="capacity-row" key={c.id || c.name}><div className="capacity-top"><strong>{c.name}</strong><span>{c.peoplePresent}/{c.capacity}</span></div><div className="capacity-track"><div className={`capacity-fill ${pct >= 90 ? 'near-full' : ''}`} style={{width: `${pct}%`}}></div></div><small>{pct}% occupancy · {c.status}</small></div>})}</div>
          </div>
        </section>
      </>}

      {dashboard && tab === 'Heat Hotspots' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">HOTSPOT REGISTER</span><h2>Known heat hotspots</h2><p>Sample locations flagged for municipal review.</p></div></div><div className="table-wrap"><table><thead><tr><th>Location</th><th>Zone</th><th>Temperature</th><th>Severity</th><th>Likely cause</th></tr></thead><tbody>{hotspots.map(h => <tr key={h.id || h.name}><td><strong>{h.name}</strong></td><td>{h.zone}</td><td>{h.temperature}°C</td><td><span className={`risk-pill ${riskClass(h.severity)}`}>{h.severity}</span></td><td>{h.cause}</td></tr>)}</tbody></table></div></section>}

      {dashboard && tab === 'City Zones' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">ZONE MANAGEMENT</span><h2>City zone register</h2><p>Compare heat conditions and population exposure by area.</p></div></div><div className="zone-card-grid">{zones.map(z => <button className="zone-card" key={z.id || z.name} onClick={() => {setSelectedZone(z.name); setTab('Overview')}}><div className="zone-card-top"><span className={`risk-pill ${riskClass(z.riskLevel)}`}>{z.riskLevel} risk</span><span>↗</span></div><h3>{z.name}</h3><p>{z.notes}</p><div className="zone-card-metrics"><span><small>Temperature</small><strong>{z.temperature}°C</strong></span><span><small>Humidity</small><strong>{z.humidity}%</strong></span><span><small>Population</small><strong>{z.population.toLocaleString()}</strong></span></div></button>)}</div></section>}

      {dashboard && tab === 'Cooling Centers' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">COOLING INFRASTRUCTURE</span><h2>Cooling center directory</h2><p>Track public cooling facilities, capacity, and basic amenities.</p></div><button className="primary-button" onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : '+ Add center'}</button></div>
        {showForm && <form className="center-form" onSubmit={addCenter}><label>Center name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. East Ward Library"/></label><label>Zone<input required value={form.zone} onChange={e => setForm({...form, zone:e.target.value})} placeholder="e.g. Riverside"/></label><label>Address<input required value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Street / landmark"/></label><label>Capacity<input required type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity:e.target.value})}/></label><label>People present<input required type="number" min="0" value={form.peoplePresent} onChange={e => setForm({...form, peoplePresent:e.target.value})}/></label><label className="checkbox-label"><input type="checkbox" checked={form.waterAvailable} onChange={e => setForm({...form, waterAvailable:e.target.checked})}/> Drinking water available</label><button className="primary-button" type="submit">Save center to database</button></form>}
        <div className="center-directory">{centers.map(c => <div className="center-card" key={c.id || c.name}><div className="center-icon">⌂</div><div className="center-info"><div className="center-title-row"><h3>{c.name}</h3><span className={`status-pill ${c.status.toLowerCase()}`}>{c.status}</span></div><p>{c.address} · {c.zone}</p><div className="center-details"><span>Capacity <strong>{c.capacity}</strong></span><span>Present <strong>{c.peoplePresent}</strong></span><span>{c.waterAvailable ? '✓ Water available' : '○ No water listed'}</span></div><div className="capacity-track"><div className={`capacity-fill ${c.peoplePresent / Math.max(c.capacity, 1) >= .9 ? 'near-full' : ''}`} style={{width:`${Math.min(100,Math.round(c.peoplePresent/Math.max(c.capacity,1)*100))}%`}}></div></div></div></div>)}</div>
      </section>}

      {dashboard && tab === 'Weather Records' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">WEATHER OBSERVATIONS</span><h2>Zone weather records</h2><p>Stored demonstration weather observations.</p></div></div><div className="table-wrap"><table><thead><tr><th>Zone</th><th>Temperature</th><th>Humidity</th><th>Recorded at</th><th>Source</th></tr></thead><tbody>{weather.map(w => <tr key={w.id || w.zone}><td><strong>{w.zone}</strong></td><td>{w.temperature}°C</td><td>{w.humidity}%</td><td>{w.recordedAt}</td><td>{w.source}</td></tr>)}</tbody></table></div></section>}
      <footer className="footer"><span>UrbanHeat · Municipal heat management prototype</span><span>Sample data · Not for emergency use</span></footer>
    </main>
  </div>;
}
