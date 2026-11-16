import React, { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:8081/api';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('admin123'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); if (!response.ok) throw new Error(response.status === 401 ? 'Incorrect username or password.' : 'Could not sign in. Check that the backend is running.'); onLogin(await response.json()); } catch (err) { setError(err.message || 'Login failed.'); } finally { setBusy(false); } }
  return <div className="login-shell"><form className="login-card" onSubmit={submit}><div className="login-brand"><div className="brand-mark">UH</div><div><strong>UrbanHeat</strong><span>Smart city heat management</span></div></div><h1>Welcome back</h1><p className="login-subtitle">Sign in to access your role-based workspace.</p>{error && <div className="error-banner">{error}</div>}<label>Username<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="primary-button login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><div className="demo-credentials"><strong>Demo accounts</strong><span>Administrator: admin / admin123</span><span>Municipal Authority: authority / authority123</span><span>Public / Resident: resident / resident123</span></div></form></div>;
}


function riskClass(risk = '') {
  return risk.toLowerCase().replace(/\s+/g, '-');
}
function StatCard({ label, value, hint, icon }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}

const emptyZone = { name: '', district: '', temperature: '', humidity: '', riskLevel: 'Moderate', population: '', notes: '' };
const emptyHotspot = { name: '', zone: '', temperature: '', severity: 'Moderate', cause: '', x: '50', y: '50' };

export default function App() {
  const [auth, setAuth] = useState(() => { try { return JSON.parse(localStorage.getItem('urbanheatAuth') || 'null'); } catch { return null; } });
  const token = auth?.token || ''; const user = auth?.user || null; const role = user?.role || '';
  const isAdmin = role === 'ADMINISTRATOR'; const isAuthority = role === 'AUTHORITY'; const isResident = role === 'RESIDENT';
  const apiFetch = (url, options = {}) => fetch(url, { ...options, headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const [dashboard, setDashboard] = useState(null);
  const [weather, setWeather] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [form, setForm] = useState({ name: '', zone: '', address: '', capacity: '60', peoplePresent: '0', waterAvailable: true });

  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [showHotspotForm, setShowHotspotForm] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [hotspotForm, setHotspotForm] = useState(emptyHotspot);
  const [riskForm, setRiskForm] = useState({ zone: '', temperature: '38', humidity: '60', windSpeed: '8' });
  const [riskResult, setRiskResult] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [riskBusy, setRiskBusy] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const dashRes = await apiFetch(`${API}/dashboard`);
      if (dashRes.status === 401 || dashRes.status === 403) throw new Error('Your session is not valid for this request. Please sign in again.');
      if (!dashRes.ok) throw new Error('Dashboard request failed');
      const dash = await dashRes.json(); setDashboard(dash);
      const historyRes = await apiFetch(`${API}/heat-risk/history`);
      if (historyRes.ok) setRiskHistory(await historyRes.json());
      if (role !== 'RESIDENT') { const weatherRes = await apiFetch(`${API}/weather`); if (weatherRes.ok) setWeather(await weatherRes.json()); }
      setSelectedZone(current => dash.zones?.some(z => z.name === current) ? current : (dash.zones?.[0]?.name || ''));
      setRiskForm(current => ({ ...current, zone: dash.zones?.some(z => z.name === current.zone) ? current.zone : (dash.zones?.[0]?.name || '') }));
    } catch (e) {
      setError('Could not connect to UrbanHeat backend. Start Spring Boot in the backend folder with: mvn spring-boot:run');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) loadData(); else setLoading(false); }, [token]);
  function handleLogin(result) { const next = { token: result.token, user: { username: result.username, displayName: result.displayName, role: result.role } }; localStorage.setItem('urbanheatAuth', JSON.stringify(next)); setAuth(next); setTab('Overview'); }
  function logout() { localStorage.removeItem('urbanheatAuth'); setAuth(null); setDashboard(null); setTab('Overview'); setLoading(false); }


  const zones = dashboard?.zones || [];
  const hotspots = dashboard?.hotspots || [];
  const centers = dashboard?.coolingCenters || [];
  const activeZone = zones.find(z => z.name === selectedZone) || zones[0];
  const highRiskZones = zones.filter(z => ['high', 'critical'].includes((z.riskLevel || '').toLowerCase()));
  const selectedHotspots = useMemo(() => activeZone ? hotspots.filter(h => h.zone === activeZone.name) : hotspots, [activeZone, hotspots]);

  function startAddZone() {
    setEditingZone(null);
    setZoneForm(emptyZone);
    setShowZoneForm(true);
    setSuccess('');
    setError('');
  }
  function startEditZone(zone) {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name || '', district: zone.district || '', temperature: String(zone.temperature ?? ''),
      humidity: String(zone.humidity ?? ''), riskLevel: zone.riskLevel || 'Moderate',
      population: String(zone.population ?? ''), notes: zone.notes || ''
    });
    setShowZoneForm(true);
    setSuccess('');
    setError('');
  }
  async function saveZone(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const payload = {
      ...zoneForm,
      temperature: Number(zoneForm.temperature),
      humidity: Number(zoneForm.humidity),
      population: Number(zoneForm.population)
    };
    try {
      const response = await apiFetch(editingZone ? `${API}/zones/${editingZone.id}` : `${API}/zones`, {
        method: editingZone ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Could not save city zone');
      }
      setShowZoneForm(false);
      setEditingZone(null);
      setZoneForm(emptyZone);
      await loadData();
      setTab('City Zones');
      setSuccess(editingZone ? 'City zone updated successfully.' : 'City zone added successfully.');
    } catch (e) {
      setError(e.message || 'Could not save city zone. Please check the entered details.');
    }
  }
  async function deleteZone(zone) {
    if (!window.confirm(`Delete "${zone.name}"? The zone record will be removed from MongoDB. Related hotspot, cooling-center and weather records will remain.`)) return;
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch(`${API}/zones/${zone.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await response.text() || 'Could not delete city zone');
      if (selectedZone === zone.name) setSelectedZone('');
      await loadData();
      setSuccess('City zone deleted successfully.');
    } catch (e) {
      setError(e.message || 'Could not delete city zone.');
    }
  }

  function startAddHotspot() {
    setEditingHotspot(null);
    setHotspotForm({ ...emptyHotspot, zone: zones[0]?.name || '' });
    setShowHotspotForm(true);
    setSuccess('');
    setError('');
  }
  function startEditHotspot(hotspot) {
    setEditingHotspot(hotspot);
    setHotspotForm({
      name: hotspot.name || '', zone: hotspot.zone || '', temperature: String(hotspot.temperature ?? ''),
      severity: hotspot.severity || 'Moderate', cause: hotspot.cause || '',
      x: String(hotspot.x ?? 50), y: String(hotspot.y ?? 50)
    });
    setShowHotspotForm(true);
    setSuccess('');
    setError('');
  }
  async function saveHotspot(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const payload = {
      ...hotspotForm,
      temperature: Number(hotspotForm.temperature),
      x: Number(hotspotForm.x),
      y: Number(hotspotForm.y)
    };
    try {
      const response = await apiFetch(editingHotspot ? `${API}/hotspots/${editingHotspot.id}` : `${API}/hotspots`, {
        method: editingHotspot ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text() || 'Could not save heat hotspot');
      setShowHotspotForm(false);
      setEditingHotspot(null);
      setHotspotForm(emptyHotspot);
      await loadData();
      setTab('Heat Hotspots');
      setSuccess(editingHotspot ? 'Heat hotspot updated successfully.' : 'Heat hotspot added successfully.');
    } catch (e) {
      setError(e.message || 'Could not save heat hotspot. Please check the entered details.');
    }
  }
  async function deleteHotspot(hotspot) {
    if (!window.confirm(`Delete hotspot "${hotspot.name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch(`${API}/hotspots/${hotspot.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await response.text() || 'Could not delete heat hotspot');
      await loadData();
      setSuccess('Heat hotspot deleted successfully.');
    } catch (e) {
      setError(e.message || 'Could not delete heat hotspot.');
    }
  }

  function startAddCenter() { setEditingCenter(null); setForm({ name: '', zone: '', address: '', capacity: '60', peoplePresent: '0', waterAvailable: true }); setShowForm(true); setError(''); setSuccess(''); }
  function startEditCenter(center) { setEditingCenter(center); setForm({ name: center.name || '', zone: center.zone || '', address: center.address || '', capacity: String(center.capacity ?? 60), peoplePresent: String(center.peoplePresent ?? 0), waterAvailable: Boolean(center.waterAvailable) }); setShowForm(true); setError(''); setSuccess(''); }
  async function saveCenter(e) { e.preventDefault(); setError(''); setSuccess(''); const payload = { ...form, capacity: Number(form.capacity), peoplePresent: Number(form.peoplePresent), status: Number(form.peoplePresent) >= Number(form.capacity) ? 'Full' : 'Open' }; try { const response = await apiFetch(editingCenter ? `${API}/cooling-centers/${editingCenter.id}` : `${API}/cooling-centers`, { method: editingCenter ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(await response.text() || 'Could not save cooling center'); setForm({ name: '', zone: '', address: '', capacity: '60', peoplePresent: '0', waterAvailable: true }); setShowForm(false); setEditingCenter(null); await loadData(); setTab('Cooling Centers'); setSuccess(editingCenter ? 'Cooling center updated successfully.' : 'Cooling center added successfully.'); } catch (e) { setError(e.message || 'Could not save the cooling center.'); } }
  async function deleteCenter(center) { if (!window.confirm(`Delete cooling center "${center.name}"?`)) return; try { const response = await apiFetch(`${API}/cooling-centers/${center.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(await response.text()); await loadData(); setSuccess('Cooling center deleted successfully.'); } catch (e) { setError(e.message || 'Could not delete cooling center.'); } }

  async function classifyHeatRisk(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setRiskBusy(true); setRiskResult(null);
    const payload = { zone: riskForm.zone, temperature: Number(riskForm.temperature), humidity: Number(riskForm.humidity), windSpeed: Number(riskForm.windSpeed) };
    try {
      const response = await apiFetch(`${API}/heat-risk/classify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.detail || 'Could not classify heat risk. Please check the input values.');
      setRiskResult(body);
      const historyResponse = await apiFetch(`${API}/heat-risk/history`);
      if (historyResponse.ok) setRiskHistory(await historyResponse.json());
      setSuccess('Heat risk classified and saved to MongoDB history.');
    } catch (err) { setError(err.message || 'Heat risk classification failed.'); }
    finally { setRiskBusy(false); }
  }

  if (!auth?.token) return <LoginScreen onLogin={handleLogin} />;
  if (loading) return <div className="loading-screen"><div className="brand-mark">UH</div><h2>UrbanHeat</h2><p>Connecting to city operations data…</p></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">UH</div><div><strong>UrbanHeat</strong><span>City operations</span></div></div>
      <div className="city-select"><span className="city-dot"></span><div><small>MONITORING CITY</small><strong>Metro District</strong></div><span className="chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      {(isResident ? [['Overview', '▦'], ['Heat Hotspots', '◉'], ['Cooling Centers', '⌂'], ['Heat Risk Analysis', '⚑']] : [['Overview', '▦'], ['Heat Hotspots', '◉'], ['City Zones', '⌘'], ['Cooling Centers', '⌂'], ['Heat Risk Analysis', '⚑'], ...(!isResident ? [['Weather Records', '☼']] : [])]).map(([name, icon]) => <button key={name} className={`nav-item ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}><span className="nav-icon">{icon}</span>{name}{name === 'Heat Hotspots' && <span className="nav-count">{hotspots.length}</span>}</button>)}
      <div className="sidebar-bottom"><div className="live-indicator"><span></span> Signed in · {role}</div><p>UrbanHeat municipal monitoring prototype</p><div className="admin-chip"><div className="avatar">{(user?.displayName || 'U').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><strong>{user?.displayName}</strong><small>{role.replace('_', ' ')}</small></div></div><button className="logout-button" onClick={logout}>Sign out</button></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><div className="breadcrumb">Workspace <span>/</span> {tab}</div><h1>{tab === 'Overview' ? 'City heat overview' : tab}</h1><p>Monitor heat exposure, identify vulnerable zones, and coordinate cooling support.</p></div><div className="top-actions"><div className="updated-chip"><span className="live-dot"></span> {isAdmin ? 'Administrator workspace' : isAuthority ? 'Monitoring workspace' : 'Public information'}</div><button className="refresh-button" onClick={loadData}>↻ <span>Refresh</span></button></div></header>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}
      {!dashboard && <div className="empty-state"><h2>UrbanHeat API is not available</h2><p>Start the backend and refresh this page.</p><button className="primary-button" onClick={loadData}>Try again</button></div>}

      {dashboard && tab === 'Overview' && <>
        <div className="notice"><span className="notice-symbol">!</span><div><strong>Operational demo view</strong><p>Values shown are sample records for project demonstration, not official live alerts.</p></div><span className="notice-tag">DEMO</span></div>
        <section className="stats-grid">
          <StatCard label="City zones monitored" value={dashboard.zoneCount} hint="Across the demo city" icon="⌖" />
          <StatCard label="Heat hotspots" value={dashboard.hotspotCount} hint="Mapped locations" icon="◉" />
          <StatCard label="High-risk zones" value={dashboard.highRiskZones} hint="High or critical status" icon="⚠" />
          <StatCard label="Total cooling centers" value={centers.length} hint="Registered city facilities" icon="⌂" />
        </section>
        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-heading"><div><span className="eyebrow">GEOSPATIAL VIEW</span><h2>Heat hotspot map</h2><p>Select a zone to inspect its heat status.</p></div><span className="map-badge">Schematic map</span></div>
            <div className="map-canvas">
              <div className="map-river"></div><div className="map-park park-one"></div><div className="map-park park-two"></div>
              <div className="map-road road-one"></div><div className="map-road road-two"></div><div className="map-road road-three"></div><div className="map-road road-four"></div>
              <div className="map-grid-lines"></div>
              {zones.map((zone, i) => <button key={zone.id || zone.name} className={`zone-block zone-${(i % 5) + 1} ${selectedZone === zone.name ? 'zone-selected' : ''} ${riskClass(zone.riskLevel)}`} onClick={() => setSelectedZone(zone.name)} title={`Inspect ${zone.name}`}><span>{zone.name}</span><strong>{zone.temperature}°</strong><small>{zone.riskLevel} risk</small></button>)}
              {hotspots.map((spot, i) => <div key={spot.id || spot.name} className={`hotspot-dot ${riskClass(spot.severity)}`} style={{left: `${spot.x ?? 50}%`, top: `${spot.y ?? 50}%`}} title={`${spot.name}: ${spot.temperature}°C`}><span></span></div>)}
              {centers.map((center, i) => <div key={center.id || center.name} className={`cooling-pin pin-${(i % 4) + 1}`} title={`Cooling center: ${center.name}`}>✚</div>)}
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
            <div className="panel-heading"><div><span className="eyebrow">PRIORITY RESPONSE</span><h2>Area-based warnings</h2><p>Zones needing municipal attention.</p></div>{!isResident && <button className="text-button" onClick={() => setTab('City Zones')}>View zones →</button>}</div>
            <div className="warning-list">{highRiskZones.map(z => <div className="warning-row" key={z.id || z.name}><div className={`warning-symbol ${riskClass(z.riskLevel)}`}>!</div><div className="warning-copy"><strong>{z.name}</strong><span>{z.temperature}°C · {z.population.toLocaleString()} residents</span></div><span className={`risk-pill ${riskClass(z.riskLevel)}`}>{z.riskLevel}</span></div>)}</div>
          </div>
          <div className="panel">
            <div className="panel-heading"><div><span className="eyebrow">PUBLIC COOLING</span><h2>Cooling center capacity</h2><p>Sample center occupancy.</p></div><button className="text-button" onClick={() => setTab('Cooling Centers')}>View centers →</button></div>
            <div className="center-summary">{centers.map(c => {const pct = Math.min(100, Math.round((c.peoplePresent / Math.max(c.capacity, 1)) * 100)); return <div className="capacity-row" key={c.id || c.name}><div className="capacity-top"><strong>{c.name}</strong><span>{c.peoplePresent}/{c.capacity}</span></div><div className="capacity-track"><div className={`capacity-fill ${pct >= 90 ? 'near-full' : ''}`} style={{width: `${pct}%`}}></div></div><small>{pct}% occupancy · {c.status}</small></div>})}</div>
          </div>
        </section>
      </>}

      {dashboard && tab === 'City Zones' && <section className="panel page-panel">
        <div className="panel-heading"><div><span className="eyebrow">ZONE MANAGEMENT</span><h2>City zone register ({zones.length})</h2><p>Add, edit or delete city zones. Changes are saved in MongoDB.</p></div>{isAdmin && <button className="primary-button" onClick={showZoneForm ? () => setShowZoneForm(false) : startAddZone}>{showZoneForm ? 'Cancel' : '+ Add city zone'}</button>}</div>
        {isAdmin && showZoneForm && <form className="management-form" onSubmit={saveZone}>
          <h3>{editingZone ? 'Edit city zone' : 'Add new city zone'}</h3>
          <div className="form-grid">
            <label>Zone name<input required value={zoneForm.name} onChange={e => setZoneForm({...zoneForm,name:e.target.value})} placeholder="e.g. Lakeside"/></label>
            <label>District<input required value={zoneForm.district} onChange={e => setZoneForm({...zoneForm,district:e.target.value})} placeholder="e.g. East"/></label>
            <label>Temperature (°C)<input required type="number" step="0.1" min="-20" max="70" value={zoneForm.temperature} onChange={e => setZoneForm({...zoneForm,temperature:e.target.value})}/></label>
            <label>Humidity (%)<input required type="number" min="0" max="100" value={zoneForm.humidity} onChange={e => setZoneForm({...zoneForm,humidity:e.target.value})}/></label>
            <label>Risk level<select value={zoneForm.riskLevel} onChange={e => setZoneForm({...zoneForm,riskLevel:e.target.value})}><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></label>
            <label>Population<input required type="number" min="0" value={zoneForm.population} onChange={e => setZoneForm({...zoneForm,population:e.target.value})}/></label>
            <label className="wide-field">Notes<textarea value={zoneForm.notes} onChange={e => setZoneForm({...zoneForm,notes:e.target.value})} placeholder="Describe the area"/></label>
          </div>
          <div className="form-actions"><button className="primary-button" type="submit">{editingZone ? 'Update city zone' : 'Save city zone'}</button><button className="secondary-button" type="button" onClick={() => setShowZoneForm(false)}>Cancel</button></div>
        </form>}
        <div className="zone-card-grid">{zones.map(z => <div className="zone-card" key={z.id || z.name}>
          <div className="zone-card-top"><span className={`risk-pill ${riskClass(z.riskLevel)}`}>{z.riskLevel} risk</span><span>⌖</span></div>
          <h3>{z.name}</h3><p>{z.notes}</p>
          <div className="zone-card-metrics"><span><small>Temperature</small><strong>{z.temperature}°C</strong></span><span><small>Humidity</small><strong>{z.humidity}%</strong></span><span><small>Population</small><strong>{Number(z.population || 0).toLocaleString()}</strong></span></div>
          <div className="row-actions">{isAdmin && <><button className="secondary-button" onClick={() => startEditZone(z)}>Edit</button><button className="danger-button" onClick={() => deleteZone(z)}>Delete</button></>}<button className="text-button" onClick={() => {setSelectedZone(z.name);setTab('Overview')}}>View insight →</button></div>
        </div>)}</div>
        {!zones.length && <div className="empty-state"><h2>No city zones yet</h2><p>Add your first city zone using the button above.</p></div>}
      </section>}

      {dashboard && tab === 'Heat Hotspots' && <section className="panel page-panel">
        <div className="panel-heading"><div><span className="eyebrow">HOTSPOT REGISTER</span><h2>Known heat hotspots ({hotspots.length})</h2><p>Add, edit or delete hotspot records. Changes are saved in MongoDB.</p></div>{isAdmin && <button className="primary-button" onClick={showHotspotForm ? () => setShowHotspotForm(false) : startAddHotspot}>{showHotspotForm ? 'Cancel' : '+ Add heat hotspot'}</button>}</div>
        {isAdmin && showHotspotForm && <form className="management-form" onSubmit={saveHotspot}>
          <h3>{editingHotspot ? 'Edit heat hotspot' : 'Add new heat hotspot'}</h3>
          <div className="form-grid">
            <label>Hotspot name<input required value={hotspotForm.name} onChange={e => setHotspotForm({...hotspotForm,name:e.target.value})} placeholder="e.g. Station Road"/></label>
            <label>City zone<select required value={hotspotForm.zone} onChange={e => setHotspotForm({...hotspotForm,zone:e.target.value})}><option value="">Select a zone</option>{zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}</select></label>
            <label>Temperature (°C)<input required type="number" step="0.1" min="-20" max="70" value={hotspotForm.temperature} onChange={e => setHotspotForm({...hotspotForm,temperature:e.target.value})}/></label>
            <label>Severity<select value={hotspotForm.severity} onChange={e => setHotspotForm({...hotspotForm,severity:e.target.value})}><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></label>
            <label>Likely cause<input value={hotspotForm.cause} onChange={e => setHotspotForm({...hotspotForm,cause:e.target.value})} placeholder="e.g. Heavy traffic"/></label>
            <label>Map X position (0–100)<input type="number" min="0" max="100" value={hotspotForm.x} onChange={e => setHotspotForm({...hotspotForm,x:e.target.value})}/></label>
            <label>Map Y position (0–100)<input type="number" min="0" max="100" value={hotspotForm.y} onChange={e => setHotspotForm({...hotspotForm,y:e.target.value})}/></label>
          </div>
          <div className="form-actions"><button className="primary-button" type="submit">{editingHotspot ? 'Update hotspot' : 'Save hotspot'}</button><button className="secondary-button" type="button" onClick={() => setShowHotspotForm(false)}>Cancel</button></div>
        </form>}
        <div className="table-wrap"><table><thead><tr><th>Location</th><th>Zone</th><th>Temperature</th><th>Severity</th><th>Likely cause</th><th>Actions</th></tr></thead><tbody>{hotspots.map(h => <tr key={h.id || h.name}><td><strong>{h.name}</strong></td><td>{h.zone}</td><td>{h.temperature}°C</td><td><span className={`risk-pill ${riskClass(h.severity)}`}>{h.severity}</span></td><td>{h.cause}</td><td>{isAdmin ? <div className="row-actions"><button className="secondary-button" onClick={() => startEditHotspot(h)}>Edit</button><button className="danger-button" onClick={() => deleteHotspot(h)}>Delete</button></div> : <span className="muted">View only</span>}</td></tr>)}</tbody></table></div>
        {!hotspots.length && <div className="empty-state"><h2>No heat hotspots yet</h2><p>Add your first hotspot using the button above.</p></div>}
      </section>}

      {dashboard && tab === 'Cooling Centers' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">COOLING INFRASTRUCTURE</span><h2>Cooling center directory</h2><p>Track public cooling facilities, capacity, and basic amenities.</p></div>{isAdmin && <button className="primary-button" onClick={showForm ? () => {setShowForm(false);setEditingCenter(null);} : startAddCenter}>{showForm ? 'Cancel' : '+ Add center'}</button>}</div>
        {isAdmin && showForm && <form className="center-form" onSubmit={saveCenter}><h3>{editingCenter ? 'Edit cooling center' : 'Add cooling center'}</h3><label>Center name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. East Ward Library"/></label><label>Zone<input required value={form.zone} onChange={e => setForm({...form, zone:e.target.value})} placeholder="e.g. Riverside"/></label><label>Address<input required value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Street / landmark"/></label><label>Capacity<input required type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity:e.target.value})}/></label><label>People present<input required type="number" min="0" max={form.capacity} value={form.peoplePresent} onChange={e => setForm({...form, peoplePresent:e.target.value})}/></label><label className="checkbox-label"><input type="checkbox" checked={form.waterAvailable} onChange={e => setForm({...form, waterAvailable:e.target.checked})}/> Drinking water available</label><div className="form-actions"><button className="primary-button" type="submit">{editingCenter ? 'Update center' : 'Save center to database'}</button><button className="secondary-button" type="button" onClick={() => {setShowForm(false);setEditingCenter(null);}}>Cancel</button></div></form>}
        <div className="center-directory">{centers.filter(c => !isResident || (c.status || '').toLowerCase() === 'open').map(c => <div className="center-card" key={c.id || c.name}><div className="center-icon">⌂</div><div className="center-info"><div className="center-title-row"><h3>{c.name}</h3><span className={`status-pill ${(c.status || '').toLowerCase()}`}>{c.status}</span></div><p>{c.address} · {c.zone}</p><div className="center-details"><span>Capacity <strong>{c.capacity}</strong></span><span>Present <strong>{c.peoplePresent}</strong></span><span>{c.waterAvailable ? '✓ Water available' : '○ No water listed'}</span></div><div className="capacity-track"><div className={`capacity-fill ${c.peoplePresent / Math.max(c.capacity, 1) >= .9 ? 'near-full' : ''}`} style={{width:`${Math.min(100,Math.round(c.peoplePresent/Math.max(c.capacity,1)*100))}%`}}></div></div>{isAdmin && <div className="row-actions"><button className="secondary-button" onClick={() => startEditCenter(c)}>Edit</button><button className="danger-button" onClick={() => deleteCenter(c)}>Delete</button></div>}</div></div>)}{isResident && centers.every(c => (c.status || '').toLowerCase() !== 'open') && <p className="muted">No cooling centers are currently listed as open.</p>}</div>
      </section>}


      {dashboard && tab === 'Heat Risk Analysis' && <section className="panel page-panel">
        <div className="panel-heading"><div><span className="eyebrow">INTELLIGENT FEATURE</span><h2>Heat risk classification</h2><p>Enter zone weather conditions to receive a risk level and practical safety guidance.</p></div><span className="map-badge">Rule-based demo</span></div>
        <div className="risk-disclaimer">This educational rule-based assessment is for project demonstration only. It is not an official heat index, medical assessment or emergency warning.</div>
        <form className="management-form" onSubmit={classifyHeatRisk}>
          <h3>Weather input</h3><div className="form-grid">
            <label>City zone<select required value={riskForm.zone} onChange={e => setRiskForm({...riskForm, zone:e.target.value})}><option value="">Select a zone</option>{zones.map(z => <option key={z.id || z.name} value={z.name}>{z.name}</option>)}</select></label>
            <label>Temperature (°C)<input required type="number" step="0.1" min="-20" max="70" value={riskForm.temperature} onChange={e => setRiskForm({...riskForm, temperature:e.target.value})}/></label>
            <label>Humidity (%)<input required type="number" min="0" max="100" value={riskForm.humidity} onChange={e => setRiskForm({...riskForm, humidity:e.target.value})}/></label>
            <label>Wind speed (km/h)<input required type="number" step="0.1" min="0" max="200" value={riskForm.windSpeed} onChange={e => setRiskForm({...riskForm, windSpeed:e.target.value})}/></label>
          </div><div className="form-actions"><button className="primary-button" type="submit" disabled={riskBusy || !riskForm.zone}>{riskBusy ? 'Analysing…' : 'Classify heat risk'}</button></div>
        </form>
        {riskResult && <div className="risk-result"><div className="risk-result-head"><div><span className="eyebrow">CLASSIFICATION RESULT</span><h3>{riskResult.zone}</h3><p>{riskResult.temperature}°C · {riskResult.humidity}% humidity · {riskResult.windSpeed} km/h wind</p></div><span className={`risk-pill ${riskClass(riskResult.riskLevel)}`}>{riskResult.riskLevel} risk</span></div><p className="risk-explanation">{riskResult.explanation}</p><h4>Safety recommendations</h4><ul>{(riskResult.recommendations || []).map((item, index) => <li key={index}>{item}</li>)}</ul><small>Saved at {riskResult.classifiedAt ? new Date(riskResult.classifiedAt).toLocaleString() : 'just now'}</small></div>}
        <div className="history-heading"><div><h3>Recent classification history</h3><p>Latest saved assessments from MongoDB (up to 50 records).</p></div></div>
        {riskHistory.length ? <div className="table-wrap"><table><thead><tr><th>Zone</th><th>Temperature</th><th>Humidity</th><th>Wind</th><th>Risk</th><th>Classified at</th></tr></thead><tbody>{riskHistory.map(item => <tr key={item.id}><td><strong>{item.zone}</strong></td><td>{item.temperature}°C</td><td>{item.humidity}%</td><td>{item.windSpeed} km/h</td><td><span className={`risk-pill ${riskClass(item.riskLevel)}`}>{item.riskLevel}</span></td><td>{item.classifiedAt ? new Date(item.classifiedAt).toLocaleString() : '—'}</td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>No classifications yet</h2><p>Submit weather details above to create the first saved classification.</p></div>}
      </section>}

      {dashboard && tab === 'Weather Records' && <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">WEATHER OBSERVATIONS</span><h2>Zone weather records</h2><p>Stored demonstration weather observations.</p></div></div><div className="table-wrap"><table><thead><tr><th>Zone</th><th>Temperature</th><th>Humidity</th><th>Recorded at</th><th>Source</th></tr></thead><tbody>{weather.map(w => <tr key={w.id || w.zone}><td><strong>{w.zone}</strong></td><td>{w.temperature}°C</td><td>{w.humidity}%</td><td>{w.recordedAt}</td><td>{w.source}</td></tr>)}</tbody></table></div></section>}
      <footer className="footer"><span>UrbanHeat · Municipal heat management prototype</span><span>Sample data · Not for emergency use</span></footer>
    </main>
  </div>;
}
