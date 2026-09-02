import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
  CloudRain,
  Compass,
  Gauge,
  GitCompare,
  HelpCircle,
  Info,
  Layers,
  MapPinned,
  Plane,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Stethoscope,
  Table2,
  Wind
} from "lucide-react";
import "./styles.css";

const DATA = {
  corridors: "/data/final_corridor_priority_dataset.csv",
  scenarios: "/data/scenario_sensitivity_analysis.csv",
  weather: "/data/weather_risk_monthly.csv",
  health: "/data/health_facilities_clean.csv",
  communes: "/data/commune_master.csv",
  access: "/data/access_gap_commune_ranking_v5_population_2023_proportional.csv",
  uav: "/data/uav_specification_assumptions.csv",
  boundary: "/data/muong_ang_boundary.geojson"
};

const navItems = [
  ["mission", "01", "Mission Control", MapPinned],
  ["explorer", "02", "Corridor Explorer", GitCompare],
  ["priority", "03", "Prioritization", BarChart3],
  ["planner", "04", "Mission Planner", Plane],
  ["scenario", "05", "Scenario Lab", SlidersHorizontal],
  ["seasonal", "06", "Seasonal Operations", CalendarDays]
];

const classificationColors = {
  LAUNCH: "#1f9d68",
  "CONDITIONAL PILOT": "#d49b26",
  "PHASE 2": "#4276a8",
  HOLD: "#8e5963"
};

const scenarioFields = {
  Baseline: "rank_baseline",
  "Equity First": "rank_equity_first",
  "Efficiency First": "rank_efficiency_first",
  "Safety First": "rank_safety_first"
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, coerce(values[index] ?? "")]))
  );
}

function parseHealthCsv(text) {
  const rows = parseCsv(text);
  if ("facility_id" in rows[0]) return rows;
  const raw = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      raw.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  const headers = raw[1].map((value, index) => {
    if (index === 10) return "lat";
    if (index === 11) return "lon";
    return value || `drop_${index}`;
  });
  return raw.slice(2).map((values) => {
    const item = Object.fromEntries(headers.map((header, index) => [header, coerce(values[index] ?? "")]));
    return {
      commune: item.commune_old,
      address: item.address,
      coordinate_source: item.coordinate_source,
      coordinate_status: item.coordinate_status,
      facility_id: item.facility_id,
      facility_name: item.facility_name,
      facility_type: item.facility_type,
      notes: item.notes,
      verification_status: item.verification_status,
      lat: item.lat,
      lon: item.lon
    };
  });
}

function coerce(value) {
  const trimmed = String(value).trim();
  if (trimmed === "" || trimmed === "(No Value)") return "";
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(trimmed)) return asNumber;
  if (trimmed === "True") return true;
  if (trimmed === "False") return false;
  return trimmed;
}

function fmt(value, digits = 1, suffix = "") {
  if (value === undefined || value === null || value === "") return "n/a";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function pct(value) {
  if (value > 1) return fmt(value, 1, "%");
  return fmt(value * 100, 1, "%");
}

function clsClass(value) {
  return String(value).toLowerCase().replaceAll(" ", "-");
}

function useSkybridgeData() {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [corridorsText, scenariosText, weatherText, healthText, communesText, accessText, uavText, boundary] =
        await Promise.all([
          fetch(DATA.corridors).then((res) => res.text()),
          fetch(DATA.scenarios).then((res) => res.text()),
          fetch(DATA.weather).then((res) => res.text()),
          fetch(DATA.health).then((res) => res.text()),
          fetch(DATA.communes).then((res) => res.text()),
          fetch(DATA.access).then((res) => res.text()),
          fetch(DATA.uav).then((res) => res.text()),
          fetch(DATA.boundary).then((res) => res.json())
        ]);
      if (cancelled) return;
      const scenarios = parseCsv(scenariosText);
      const health = parseHealthCsv(healthText);
      const scenarioById = new Map(scenarios.map((item) => [item.corridor_id, item]));
      const facilityById = new Map(health.map((item) => [item.facility_id, item]));
      const corridors = parseCsv(corridorsText)
        .map((item) => {
          const scenario = scenarioById.get(item.corridor_id) || {};
          const origin = facilityById.get(item.origin_id) || {};
          const destination = facilityById.get(item.destination_id) || {};
          return {
            ...item,
            ...scenario,
            scenario,
            origin_lat: origin.lat,
            origin_lon: origin.lon,
            destination_lat: destination.lat,
            destination_lon: destination.lon
          };
        })
        .sort((a, b) => a.rank_baseline - b.rank_baseline);
      setState({
        status: "ready",
        corridors,
        scenarios,
        weather: parseCsv(weatherText),
        health,
        communes: parseCsv(communesText),
        access: parseCsv(accessText),
        uav: parseCsv(uavText)[0],
        boundary
      });
    }
    load().catch((error) => {
      if (!cancelled) setState({ status: "error", error });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function App() {
  const data = useSkybridgeData();
  const [screen, setScreen] = useState("mission");
  const [selectedId, setSelectedId] = useState("HF001_HF004");
  const [notesOpen, setNotesOpen] = useState(false);

  if (data.status === "loading") return <div className="loader">Loading verified SkyBridge data...</div>;
  if (data.status === "error") return <div className="loader error">Could not load data: {String(data.error)}</div>;

  const selected = data.corridors.find((item) => item.corridor_id === selectedId) || data.corridors[0];
  const Screen = {
    mission: MissionControl,
    explorer: CorridorExplorer,
    priority: Prioritization,
    planner: MissionPlanner,
    scenario: ScenarioLab,
    seasonal: SeasonalOperations
  }[screen];

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <div className="brand-mark">SB</div>
          <div>
            <strong>SKYBRIDGE</strong>
            <span>Mission Control</span>
          </div>
        </div>
        <nav>
          {navItems.map(([id, number, label, Icon]) => (
            <button key={id} className={screen === id ? "active" : ""} onClick={() => setScreen(id)}>
              <span>{number}</span>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <button className="methodology-link" onClick={() => setNotesOpen(true)}>
          <Info size={17} />
          Methodology / Data Notes
        </button>
      </aside>
      <main className="workspace">
        <header className="top-bar">
          <div>
            <h1>SkyBridge Mission Control</h1>
            <p>Mường Ảng, Điện Biên</p>
          </div>
          <div className="status-badge"><Activity size={15} /> Planning Prototype</div>
        </header>
        <Screen data={data} selected={selected} setSelectedId={setSelectedId} />
      </main>
      {notesOpen && <MethodologyDrawer data={data} onClose={() => setNotesOpen(false)} />}
    </div>
  );
}

function MissionControl({ data, selected, setSelectedId }) {
  const kpis = [
    ["Candidate Corridors", data.corridors.length, "screened origin-destination links"],
    ["Launch Candidates", data.corridors.filter((c) => c.final_classification_baseline === "LAUNCH").length, "baseline classification"],
    ["Robust Top-3", data.corridors.filter((c) => c.top3_scenario_count === 4).length, "across all four scenarios"],
    ["Maximum Minutes Saved", fmt(Math.max(...data.corridors.map((c) => c.time_saved_base_min)), 1), "modeled estimate"]
  ];
  return (
    <section className="screen mission-grid">
      <div className="kpi-strip">
        {kpis.map(([label, value, note]) => <Kpi key={label} label={label} value={value} note={note} />)}
      </div>
      <div className="map-panel">
        <OperationalMap data={data} selected={selected} setSelectedId={setSelectedId} />
      </div>
      <DecisionPanel selected={selected} />
    </section>
  );
}

function OperationalMap({ data, selected, setSelectedId }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([21.52, 103.22], 11);
    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
  }, []);
  useEffect(() => {
    if (!mapRef.current) return;
    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(mapRef.current);
    layerRef.current = group;
    const boundary = L.polygon(boundaryRings(data.boundary), {
      color: "#627f96",
      weight: 2,
      fillColor: "#eef4ef",
      fillOpacity: 0.82
    }).addTo(group);
    data.corridors.forEach((corridor) => {
      const color = classificationColors[corridor.final_classification_baseline] || "#577";
      const isSelected = corridor.corridor_id === selected.corridor_id;
      L.polyline(
        [[corridor.origin_lat, corridor.origin_lon], [corridor.destination_lat, corridor.destination_lon]],
        { color, weight: isSelected ? 4 : 2, opacity: isSelected ? 0.95 : 0.5, dashArray: isSelected ? "" : "5 7" }
      )
        .on("click", () => setSelectedId(corridor.corridor_id))
        .on("mouseover", (event) => event.target.setStyle({ weight: 4, opacity: 0.95 }))
        .on("mouseout", (event) => event.target.setStyle({ weight: isSelected ? 4 : 2, opacity: isSelected ? 0.95 : 0.5 }))
        .bindTooltip(`${corridor.destination_commune_old}: ${corridor.final_classification_baseline}`)
        .addTo(group);
      const marker = L.circleMarker([corridor.destination_lat, corridor.destination_lon], {
        radius: isSelected ? 9 : 6,
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95
      })
        .on("click", () => setSelectedId(corridor.corridor_id))
        .bindTooltip(`${corridor.destination_name}<br/>Rank #${corridor.rank_baseline} | ${fmt(corridor.time_saved_base_min)} min saved`)
        .addTo(group);
      marker.bringToFront();
    });
    const origin = data.corridors[0];
    L.circleMarker([origin.origin_lat, origin.origin_lon], {
      radius: 10,
      color: "#05233a",
      weight: 3,
      fillColor: "#21a59b",
      fillOpacity: 1
    }).bindTooltip(origin.origin_name).addTo(group);
    mapRef.current.fitBounds(boundary.getBounds().pad(0.08));
  }, [data, selected, setSelectedId]);
  return (
    <div className="map-wrap">
      <div ref={containerRef} className="leaflet-map" />
      <div className="map-caption">
        <Layers size={15} /> Boundary, facilities, and direct candidate UAV links. Road-route polylines are not shown because route geometry is unavailable.
      </div>
      <Legend />
    </div>
  );
}

function boundaryRings(boundary) {
  const geometry = boundary?.features?.[0]?.geometry;
  if (!geometry) return [];
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  return polygons[0][0].map(([lon, lat]) => [lat, lon]);
}

function DecisionPanel({ selected }) {
  const message =
    selected.destination_commune_old === "Ngối Cáy"
      ? "Ngối Cáy emerges as the strongest launch candidate because UAV benefit, preliminary feasibility, and ranking robustness align."
      : `${selected.destination_commune_old} requires operator review across need, benefit, preliminary feasibility, and operational risk before pilot consideration.`;
  return (
    <aside className="decision-panel">
      <div className="recommendation">
        <span>#{selected.rank_baseline} Recommendation</span>
        <Badge className={selected.final_classification_baseline}>{selected.final_classification_baseline}</Badge>
        <h2>{selected.destination_commune_old}</h2>
        <p>{message}</p>
      </div>
      <div className="metric-pair">
        <Metric icon={Compass} label="Modeled road ETA" value={fmt(selected.road_time_base_min, 1, " min")} />
        <Metric icon={Plane} label="Modeled UAV ETA" value={fmt(selected.uav_mission_time_base_min, 1, " min")} />
        <Metric icon={Gauge} label="Minutes saved" value={fmt(selected.time_saved_base_min, 1, " min")} />
        <Metric icon={ChevronsUpDown} label="Percent saved" value={pct(selected.time_saved_base_pct)} />
      </div>
      <ScoreGrid selected={selected} />
      <div className="evidence-note">
        <ShieldAlert size={17} />
        Preliminary screening only. Requires operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures.
      </div>
    </aside>
  );
}

function CorridorExplorer({ data, selected, setSelectedId }) {
  const [query, setQuery] = useState("");
  const filtered = data.corridors.filter((c) => c.destination_commune_old.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="screen explorer-grid">
      <aside className="selector-panel">
        <div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search corridor" /></div>
        <div className="corridor-list">
          {filtered.map((corridor) => (
            <button key={corridor.corridor_id} className={corridor.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(corridor.corridor_id)}>
              <span>#{corridor.rank_baseline} {corridor.destination_commune_old}</span>
              <small>{fmt(corridor.time_saved_base_min)} min saved</small>
            </button>
          ))}
        </div>
      </aside>
      <main className="analysis-area">
        <SectionTitle eyebrow="Road versus air" title={selected.destination_name} />
        <RoadAirGraphic selected={selected} />
        <div className="flow">
          <FlowItem title="Road inefficiency" value={`${fmt(selected.detour_ratio, 2)}x detour`} />
          <ArrowRight size={18} />
          <FlowItem title="UAV bypass potential" value={`${fmt(selected.candidate_aerial_distance_km, 1)} km modeled air path`} />
          <ArrowRight size={18} />
          <FlowItem title="Time benefit" value={`${fmt(selected.time_saved_base_min, 1)} min saved`} />
        </div>
        <ScoreGrid selected={selected} expanded />
      </main>
    </section>
  );
}

function RoadAirGraphic({ selected }) {
  const max = Math.max(selected.road_time_base_min, selected.road_distance_km, 1);
  const rows = [
    ["Road distance", selected.road_distance_km, "km", "Road distance is modeled from available network analysis, but no route polyline is available."],
    ["Aerial distance", selected.candidate_aerial_distance_km, "km", "Candidate aerial distance applies the project aerial route factor."],
    ["Road time", selected.road_time_base_min, "min", "Modeled road travel time from project routing assumptions."],
    ["UAV mission time", selected.uav_mission_time_base_min, "min", "Modeled UAV mission time using the project base cruise speed and fixed mission time."]
  ];
  return (
    <div className="bar-card">
      {rows.map(([label, value, unit, tip]) => (
        <div className="bar-row" key={label}>
          <div className="bar-label">{label}<Tooltip text={tip} /></div>
          <div className="bar-track"><span style={{ width: `${Math.max(8, (value / max) * 100)}%` }} /></div>
          <strong>{fmt(value, 1, ` ${unit}`)}</strong>
        </div>
      ))}
    </div>
  );
}

function Prioritization({ data, selected, setSelectedId }) {
  return (
    <section className="screen priority-grid">
      <main className="analysis-area">
        <SectionTitle eyebrow="Decision intelligence" title="Need x preliminary feasibility" />
        <Matrix data={data} selected={selected} setSelectedId={setSelectedId} />
        <div className="insight-callout">
          <strong>HIGHEST NEED != HIGHEST DEPLOYMENT PRIORITY</strong>
          <span>Prioritization balances healthcare need, UAV benefit, preliminary feasibility, and operational risk using the project methodology.</span>
        </div>
      </main>
      <RankTable data={data} selected={selected} setSelectedId={setSelectedId} />
    </section>
  );
}

function Matrix({ data, selected, setSelectedId }) {
  const pad = 44;
  const w = 650;
  const h = 430;
  return (
    <div className="matrix-card">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Need by feasibility matrix">
        <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} />
        <line x1={pad} x2={pad} y1={pad} y2={h - pad} />
        <text x={w / 2} y={h - 8} textAnchor="middle">Healthcare Accessibility Need</text>
        <text x={15} y={h / 2} transform={`rotate(-90 15 ${h / 2})`} textAnchor="middle">Flight Feasibility</text>
        {data.corridors.map((c) => {
          const x = pad + c.medical_accessibility_need_score * (w - pad * 2);
          const y = h - pad - c.flight_feasibility_score * (h - pad * 2);
          const active = c.corridor_id === selected.corridor_id;
          return (
            <g key={c.corridor_id} onClick={() => setSelectedId(c.corridor_id)} className="matrix-point">
              <circle cx={x} cy={y} r={active ? 13 : 9} fill={classificationColors[c.final_classification_baseline]} stroke="#fff" strokeWidth="3" />
              <text className="rank-marker" x={x} y={y + 4} textAnchor="middle">#{c.rank_baseline}</text>
              {active && <text className="active-label" x={Math.min(x + 18, w - 130)} y={y - 14}>{c.destination_commune_old}</text>}
              <title>{`${c.destination_commune_old}: need ${fmt(c.medical_accessibility_need_score, 2)}, feasibility ${fmt(c.flight_feasibility_score, 2)}`}</title>
            </g>
          );
        })}
      </svg>
      <Legend />
    </div>
  );
}

function MissionPlanner({ data, selected, setSelectedId }) {
  const [origin, setOrigin] = useState(data.corridors[0].origin_id);
  const [missionType, setMissionType] = useState("Essential medicines");
  const [payload, setPayload] = useState("1.5");
  const label = selected.final_classification_baseline === "LAUNCH" ? "FAVORABLE FOR PILOT SCREENING" : selected.final_classification_baseline === "HOLD" ? "HOLD" : "CONDITIONAL";
  return (
    <section className="screen planner-grid">
      <aside className="workflow-panel">
        <Step number="1" title="Select origin">
          <select value={origin} onChange={(e) => setOrigin(e.target.value)}><option value={data.corridors[0].origin_id}>{data.corridors[0].origin_name}</option></select>
        </Step>
        <Step number="2" title="Select destination corridor">
          <select value={selected.corridor_id} onChange={(e) => setSelectedId(e.target.value)}>
            {data.corridors.map((c) => <option key={c.corridor_id} value={c.corridor_id}>{c.destination_commune_old}</option>)}
          </select>
        </Step>
        <Step number="3" title="Select mission type">
          <select value={missionType} onChange={(e) => setMissionType(e.target.value)}>
            <option>Essential medicines</option><option>Diagnostic samples</option><option>Emergency supplies</option>
          </select>
        </Step>
        <Step number="4" title="Optional payload input">
          <input value={payload} onChange={(e) => setPayload(e.target.value)} inputMode="decimal" /> <span>kg prototype input</span>
        </Step>
        <Step number="5" title="Planning context">
          <p>Preliminary screening from modeled logistics metrics and climatological context.</p>
        </Step>
      </aside>
      <main className="screening-panel">
        <SectionTitle eyebrow="Preliminary mission screening" title={selected.destination_commune_old} />
        <div className={`screening-label ${clsClass(selected.final_classification_baseline)}`}>{label}</div>
        <div className="evidence-grid">
          <Metric icon={Compass} label="Modeled road ETA" value={fmt(selected.road_time_base_min, 1, " min")} />
          <Metric icon={Plane} label="Modeled UAV ETA" value={fmt(selected.uav_mission_time_base_min, 1, " min")} />
          <Metric icon={Gauge} label="Estimated time saved" value={fmt(selected.time_saved_base_min, 1, " min")} />
          <Metric icon={GitCompare} label="Detour ratio" value={`${fmt(selected.detour_ratio, 2)}x`} />
          <Metric icon={MapPinned} label="Aerial distance" value={fmt(selected.candidate_aerial_distance_km, 1, " km")} />
          <Metric icon={ShieldAlert} label="Operational risk" value={fmt(selected.operational_risk_score, 3)} />
        </div>
        <ScoreGrid selected={selected} expanded />
        <div className="hard-warning">
          Prototype decision support only. Final dispatch requires operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures.
        </div>
      </main>
    </section>
  );
}

function ScenarioLab({ data, selected, setSelectedId }) {
  const [scenario, setScenario] = useState("Baseline");
  const field = scenarioFields[scenario];
  const ranked = [...data.corridors].sort((a, b) => a[field] - b[field]);
  return (
    <section className="screen scenario-grid">
      <main className="analysis-area">
        <div className="segmented">
          {Object.keys(scenarioFields).map((name) => <button key={name} className={scenario === name ? "active" : ""} onClick={() => setScenario(name)}>{name}</button>)}
        </div>
        <SectionTitle eyebrow="Decision robustness" title={`${scenario} ranking`} />
        <div className="scenario-list">
          {ranked.map((c) => {
            const movement = c.rank_baseline - c[field];
            return (
              <button key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
                <span>#{c[field]}</span><strong>{c.destination_commune_old}</strong><Badge className={c.final_classification_baseline}>{c.final_classification_baseline}</Badge><em>{movement === 0 ? "no move" : movement > 0 ? `up ${movement}` : `down ${Math.abs(movement)}`}</em>
              </button>
            );
          })}
        </div>
      </main>
      <aside className="robust-panel">
        <h3>ROBUST TOP-3</h3>
        {data.corridors.filter((c) => c.top3_scenario_count === 4).map((c) => (
          <button key={c.corridor_id} onClick={() => setSelectedId(c.corridor_id)} className={c.corridor_id === selected.corridor_id ? "selected robust-card" : "robust-card"}>
            <CheckCircle2 size={18} /><strong>{c.destination_commune_old}</strong><span>Top-3 in 4/4 scenarios</span>
          </button>
        ))}
        <RankStability data={data} selected={selected} />
      </aside>
    </section>
  );
}

function SeasonalOperations({ data }) {
  const [month, setMonth] = useState(7);
  const selected = data.weather.find((item) => item.month === month) || data.weather[0];
  const wettest = [...data.weather].sort((a, b) => b.precipitation_total_mean - a.precipitation_total_mean)[0];
  const driest = [...data.weather].sort((a, b) => a.precipitation_total_mean - b.precipitation_total_mean)[0];
  const windiest = [...data.weather].sort((a, b) => b.mean_wind_speed_mean - a.mean_wind_speed_mean)[0];
  return (
    <section className="screen seasonal-grid">
      <main className="analysis-area">
        <SectionTitle eyebrow="Climatological / historical planning context" title="12-month operational context" />
        <WeatherChart data={data.weather} month={month} setMonth={setMonth} />
        <div className="month-strip">
          {data.weather.map((item) => <button key={item.month} className={item.month === month ? "active" : ""} onClick={() => setMonth(item.month)}>{months[item.month - 1]}</button>)}
        </div>
      </main>
      <aside className="weather-panel">
        <h2>{months[selected.month - 1]} Planning Context</h2>
        <Metric icon={CloudRain} label="Mean monthly precipitation" value={fmt(selected.precipitation_total_mean, 1, " mm")} />
        <Metric icon={Wind} label="Mean wind speed" value={fmt(selected.mean_wind_speed_mean, 2, " m/s")} />
        <Metric icon={Activity} label="Mean temperature" value={fmt(selected.mean_temperature_mean, 1, " C")} />
        <Metric icon={AlertTriangle} label="Monthly weather risk score" value={fmt(selected.monthly_weather_risk_score, 3)} />
        <div className="observations">
          <p>Wettest month in the source data: <strong>{months[wettest.month - 1]}</strong>.</p>
          <p>Relatively driest month: <strong>{months[driest.month - 1]}</strong>.</p>
          <p>Relatively windier period peaks in <strong>{months[windiest.month - 1]}</strong>.</p>
          <p>Use higher planning caution when precipitation or wind risk scores rise; this is not a safe/unsafe flight threshold.</p>
        </div>
      </aside>
    </section>
  );
}

function WeatherChart({ data, month, setMonth }) {
  const maxPrecip = Math.max(...data.map((d) => d.precipitation_total_mean));
  const maxWind = Math.max(...data.map((d) => d.mean_wind_speed_mean));
  return (
    <div className="weather-chart">
      {data.map((item) => (
        <button key={item.month} className={item.month === month ? "weather-column active" : "weather-column"} onClick={() => setMonth(item.month)}>
          <span className="precip" style={{ height: `${(item.precipitation_total_mean / maxPrecip) * 78}%` }} />
          <span className="wind" style={{ height: `${(item.mean_wind_speed_mean / maxWind) * 62}%` }} />
          <small>{months[item.month - 1]}</small>
        </button>
      ))}
      <div className="chart-key"><span className="key-precip" /> precipitation <span className="key-wind" /> mean wind</div>
    </div>
  );
}

function RankTable({ data, selected, setSelectedId }) {
  return (
    <aside className="rank-table">
      <h3>Ranked Corridors</h3>
      <table>
        <thead><tr><th>Rank</th><th>Destination</th><th>Need</th><th>Feas.</th><th>Priority</th></tr></thead>
        <tbody>
          {data.corridors.map((c) => (
            <tr key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
              <td>#{c.rank_baseline}</td><td>{c.destination_commune_old}</td><td>{fmt(c.medical_accessibility_need_score, 2)}</td><td>{fmt(c.flight_feasibility_score, 2)}</td><td>{fmt(c.priority_score_baseline, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

function RankStability({ data, selected }) {
  const cols = Object.entries(scenarioFields);
  return (
    <div className="stability">
      <h4>Rank-stability matrix</h4>
      <table>
        <thead><tr><th>Corridor</th>{cols.map(([name]) => <th key={name}>{name.replace(" First", "")}</th>)}</tr></thead>
        <tbody>
          {data.corridors.map((c) => (
            <tr key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""}>
              <td>{c.destination_commune_old}</td>{cols.map(([name, field]) => <td key={name} style={{ opacity: 1 - (c[field] - 1) * 0.07 }}>#{c[field]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreGrid({ selected, expanded = false }) {
  const scores = [
    ["Healthcare need", selected.medical_accessibility_need_score, "Access gap plus population component"],
    ["UAV benefit", selected.uav_benefit_score, "Time saved, percentage saved, and detour ratio"],
    ["Flight feasibility", selected.flight_feasibility_score, "Preliminary feasibility score"],
    ["Operational risk", selected.operational_risk_score, "Distance, terrain, and climatological risk context"],
    ["Priority score", selected.priority_score_baseline, "Baseline weighted score"],
    ["Scenario robustness", `${selected.top3_scenario_count}/4`, selected.robustness_label]
  ];
  return (
    <div className={expanded ? "score-grid expanded" : "score-grid"}>
      {scores.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{typeof value === "number" ? fmt(value, 3) : value}</strong><small>{note}</small></div>)}
    </div>
  );
}

function MethodologyDrawer({ data, onClose }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>Close</button>
        <h2>Methodology / Data Notes</h2>
        <h3>Observed / source data</h3>
        <p>CSV exports from <code>data/SAP data</code>: corridor priority, scenario sensitivity, monthly weather, health facilities, commune master, access-gap ranking, and UAV assumptions. Boundary GeoJSON comes from <code>data/processed/boundaries</code>.</p>
        <h3>Modeled metrics</h3>
        <p>Road distance/time, candidate aerial distance, UAV mission time, minutes saved, percent saved, feasibility, risk, and priority scores are project model outputs.</p>
        <h3>Derived UI outputs</h3>
        <p>Recommendation labels, KPI summaries, scenario movement, and seasonal observations are interface summaries derived from source fields.</p>
        <h3>Limitations</h3>
        <p>No actual origin-to-destination road-route polylines were found; maps show direct candidate UAV links and numeric road-network estimates only. Weather is monthly climatological/historical planning context, not real-time aviation weather. Feasibility is preliminary and rankings depend on project methodology.</p>
        <h3>Verified key finding</h3>
        <p>{data.corridors[0].destination_commune_old} is baseline rank #{data.corridors[0].rank_baseline}, classified {data.corridors[0].final_classification_baseline}, with {fmt(data.corridors[0].road_time_base_min)} min road time, {fmt(data.corridors[0].uav_mission_time_base_min)} min UAV time, {fmt(data.corridors[0].time_saved_base_min)} min saved, and Top-3 in {data.corridors[0].top3_scenario_count}/4 scenarios.</p>
      </aside>
    </div>
  );
}

function Kpi({ label, value, note }) {
  return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric"><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;
}

function Badge({ className, children }) {
  return <span className={`badge ${clsClass(className)}`}>{children}</span>;
}

function Legend() {
  return <div className="legend">{Object.entries(classificationColors).map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>;
}

function Tooltip({ text }) {
  return <span className="tooltip"><HelpCircle size={14} /><em>{text}</em></span>;
}

function FlowItem({ title, value }) {
  return <div><strong>{title}</strong><span>{value}</span></div>;
}

function Step({ number, title, children }) {
  return <div className="step"><b>{number}</b><div><h3>{title}</h3>{children}</div></div>;
}

function SectionTitle({ eyebrow, title }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2></div>;
}

createRoot(document.getElementById("root")).render(<App />);
