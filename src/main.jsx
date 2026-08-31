import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
<<<<<<< HEAD
  BarChart3,
  CheckCircle2,
=======
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
  CloudRain,
  Compass,
  Gauge,
  GitCompare,
<<<<<<< HEAD
=======
  HelpCircle,
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
  Info,
  Layers,
  MapPinned,
  Plane,
<<<<<<< HEAD
  ShieldAlert,
  Stethoscope,
  Users,
=======
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Stethoscope,
  Table2,
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
  Wind
} from "lucide-react";
import "./styles.css";

const DATA = {
  corridors: "/data/final_corridor_priority_dataset.csv",
  scenarios: "/data/scenario_sensitivity_analysis.csv",
  weather: "/data/weather_risk_monthly.csv",
  health: "/data/health_facilities_clean.csv",
<<<<<<< HEAD
  communes: "/data/sac_commune_dashboard_simple.csv",
  kpi: "/data/sac_kpi_summary_simple.csv",
  timeKpi: "/data/sac_time_kpi_simple.csv",
  boundary: "/data/muong_ang_boundary.geojson"
};

const NAV = [
  ["hero", "Hero", "Where to launch first?"],
  ["divide", "Dashboard 1", "Mountain Healthcare Divide"],
  ["leftBehind", "Dashboard 2", "Who is being left behind?"],
  ["roadAir", "Dashboard 3", "Road vs Air"],
  ["matrix", "Dashboard 4", "Need x Feasibility"]
];

const COLORS = {
  LAUNCH: "#1f6b51",
  "CONDITIONAL PILOT": "#875500",
  "PHASE 2": "#31577c",
  HOLD: "#9a2d27"
};

=======
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

>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
<<<<<<< HEAD
    const c = text[i];
    const n = text[i + 1];
    if (c === '"' && quote && n === '"') {
      cell += '"';
      i += 1;
    } else if (c === '"') {
      quote = !quote;
    } else if (c === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quote) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(cell);
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) =>
<<<<<<< HEAD
    Object.fromEntries(headers.map((h, i) => [h, coerce(values[i] ?? "")]))
  );
}

function coerce(value) {
  const s = String(value).trim();
  if (!s) return "";
  if (s === "True") return true;
  if (s === "False") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function fmt(v, digits = 1, suffix = "") {
  if (v === "" || v === undefined || v === null || Number.isNaN(Number(v))) return "n/a";
  return `${Number(v).toLocaleString("en-US", { maximumFractionDigits: digits })}${suffix}`;
}

function pct(v) {
  return Number(v) > 1 ? fmt(v, 1, "%") : fmt(Number(v) * 100, 1, "%");
}

function slug(v) {
  return String(v).toLowerCase().replaceAll(" ", "-");
}

function useData() {
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    async function load() {
<<<<<<< HEAD
      const [corr, scen, weather, health, communes, kpi, timeKpi, boundary] = await Promise.all([
        fetch(DATA.corridors).then((r) => r.text()),
        fetch(DATA.scenarios).then((r) => r.text()),
        fetch(DATA.weather).then((r) => r.text()),
        fetch(DATA.health).then((r) => r.text()),
        fetch(DATA.communes).then((r) => r.text()),
        fetch(DATA.kpi).then((r) => r.text()),
        fetch(DATA.timeKpi).then((r) => r.text()),
        fetch(DATA.boundary).then((r) => r.json())
      ]);
      if (cancelled) return;
      const healthRows = parseCsv(health);
      const facilityById = new Map(healthRows.map((x) => [x.facility_id, x]));
      const scenarioById = new Map(parseCsv(scen).map((x) => [x.corridor_id, x]));
      const corridors = parseCsv(corr)
        .map((x) => {
          const origin = facilityById.get(x.origin_id) || {};
          const dest = facilityById.get(x.destination_id) || {};
          return {
            ...x,
            ...scenarioById.get(x.corridor_id),
            origin_lat: origin.latitude,
            origin_lon: origin.longitude,
            destination_lat: dest.latitude,
            destination_lon: dest.longitude
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
          };
        })
        .sort((a, b) => a.rank_baseline - b.rank_baseline);
      setState({
        status: "ready",
        corridors,
<<<<<<< HEAD
        scenarios: parseCsv(scen),
        weather: parseCsv(weather),
        health: healthRows,
        communes: parseCsv(communes),
        kpi: parseCsv(kpi)[0],
        timeKpi: parseCsv(timeKpi)[0],
        boundary
      });
    }
    load().catch((error) => !cancelled && setState({ status: "error", error }));
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function App() {
<<<<<<< HEAD
  const data = useData();
  const [page, setPage] = useState("hero");
  const [selectedId, setSelectedId] = useState("HF001_HF004");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (data.status === "loading") return <div className="loader">Loading SkyBridge prototype...</div>;
  if (data.status === "error") return <div className="loader error">Data load failed: {String(data.error)}</div>;

  const selected = data.corridors.find((c) => c.corridor_id === selectedId) || data.corridors[0];
  const pages = {
    hero: <Hero data={data} selected={selected} setSelectedId={setSelectedId} />,
    divide: <DashboardDivide data={data} />,
    leftBehind: <DashboardLeftBehind data={data} />,
    roadAir: <DashboardRoadAir data={data} selected={selected} setSelectedId={setSelectedId} />,
    matrix: <DashboardMatrix data={data} selected={selected} setSelectedId={setSelectedId} />
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>SB</span>
          <div>
            <strong>SkyBridge</strong>
            <small>Mường Ảng UAV health logistics</small>
          </div>
        </div>
        <nav>
          {NAV.map(([id, kicker, label]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
              <small>{kicker}</small>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="method" onClick={() => setDrawerOpen(true)}>
          <Info size={16} />
          Model assumptions
        </button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>SkyBridge Mission Control Prototype</h1>
            <p>Decision support for medical UAV corridor prioritization in Mường Ảng, Điện Biên.</p>
          </div>
          <div className="pill"><Activity size={15} /> MVP prototype</div>
        </header>
        {pages[page]}
      </main>
      {drawerOpen && <MethodologyDrawer data={data} onClose={() => setDrawerOpen(false)} />}
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    </div>
  );
}

<<<<<<< HEAD
function Hero({ data, selected, setSelectedId }) {
  const top3 = data.corridors.slice(0, 3);
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <span className="eyebrow">Where should we launch first?</span>
        <h2>{data.corridors[0].destination_commune_old} is the strongest first-launch corridor.</h2>
        <p>
          The model ranks corridors by medical access need, UAV access benefit, preliminary flight feasibility,
          and operational risk. The top three remain stable across baseline, equity-first, efficiency-first, and safety-first scenarios.
        </p>
        <div className="hero-actions">
          {top3.map((c) => (
            <button key={c.corridor_id} className={selected.corridor_id === c.corridor_id ? "active" : ""} onClick={() => setSelectedId(c.corridor_id)}>
              #{c.rank_baseline} {c.destination_commune_old}
            </button>
          ))}
        </div>
      </div>
      <div className="map-card">
        <CorridorMap data={data} selected={selected} setSelectedId={setSelectedId} />
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
      </div>
      <DecisionPanel selected={selected} />
    </section>
  );
}

<<<<<<< HEAD
function DashboardDivide({ data }) {
  const longest = data.communes.slice().sort((a, b) => b.road_time_min - a.road_time_min)[0];
  return (
    <section className="dashboard">
      <Title kicker="Dashboard 1" title="The Mountain Healthcare Divide" text="Mountainous road conditions turn kilometres into hours." />
      <div className="kpi-row">
        <Kpi icon={Users} label="Population covered" value={fmt(data.kpi.total_population, 0)} note="WorldPop 2023 proportional estimate" />
        <Kpi icon={MapPinned} label="Communes" value={fmt(data.kpi.communes, 0)} note="old Mường Ảng commune set" />
        <Kpi icon={Compass} label="Avg road access time" value={fmt(data.timeKpi.avg_time, 1, " min")} note="to higher-level care" />
        <Kpi icon={AlertTriangle} label="Longest road access" value={fmt(data.timeKpi.max_time, 1, " min")} note={longest.commune} />
      </div>
      <div className="two-col">
        <CommuneMap data={data} />
        <BarPanel title="Road time to higher-level facility" rows={data.communes} label="commune" value="road_time_min" suffix=" min" colorBy="gap_level" />
      </div>
      <FacilityStrip facilities={data.health} />
    </section>
  );
}

function DashboardLeftBehind({ data }) {
  return (
    <section className="dashboard">
      <Title kicker="Dashboard 2" title="Who is being left behind?" text="Access gaps concentrate where long road travel overlaps with population exposure and lower connectivity." />
      <div className="kpi-row">
        <Kpi icon={Users} label="Population outside 30 min" value={fmt(data.kpi.population_outside_30_min, 0)} note={`${data.kpi.communes_outside_30_min} communes`} />
        <Kpi icon={Users} label="Population outside 60 min" value={fmt(data.kpi.population_outside_60_min, 0)} note={`${data.kpi.communes_outside_60_min} communes`} />
        <Kpi icon={Stethoscope} label="Mapped facilities" value={fmt(data.kpi.mapped_facilities, 0)} note="1 coordinate still fallback/audit-sensitive" />
        <Kpi icon={Gauge} label="Highest access gap" value={fmt(Math.max(...data.communes.map((c) => c.access_gap)), 3)} note="normalized score" />
      </div>
      <div className="two-col">
        <BarPanel title="Communes ranked by access gap" rows={data.communes} label="commune" value="access_gap" suffix="" colorBy="gap_level" />
        <BandPanel rows={data.communes} />
      </div>
      <CommuneTable rows={data.communes} />
    </section>
  );
}

function DashboardRoadAir({ data, selected, setSelectedId }) {
  return (
    <section className="dashboard road-air-grid">
      <Title kicker="Dashboard 3" title="Road vs Air" text="UAV creates value only where geography makes conventional transport inefficient." />
      <aside className="corridor-picker">
        {data.corridors.map((c) => (
          <button key={c.corridor_id} className={selected.corridor_id === c.corridor_id ? "active" : ""} onClick={() => setSelectedId(c.corridor_id)}>
            <strong>#{c.rank_baseline} {c.destination_commune_old}</strong>
            <span>{fmt(c.time_saved_base_min, 1, " min saved")} | {fmt(c.detour_ratio, 2)}x detour</span>
          </button>
        ))}
      </aside>
      <div className="road-air-main">
        <RoadAirBars selected={selected} />
        <div className="flow">
          <FlowItem title="Road detour" value={`${fmt(selected.detour_ratio, 2)}x`} />
          <ArrowRight />
          <FlowItem title="UAV air path" value={fmt(selected.candidate_aerial_distance_km, 1, " km")} />
          <ArrowRight />
          <FlowItem title="Time saved" value={fmt(selected.time_saved_base_min, 1, " min")} />
        </div>
        <InsightBox>
          {selected.destination_commune_old} saves an estimated {fmt(selected.time_saved_base_min, 1)} minutes per mission under the base UAV assumption.
          The result is strongest where road time and detour ratio are high.
        </InsightBox>
      </div>
    </section>
  );
}

function DashboardMatrix({ data, selected, setSelectedId }) {
  return (
    <section className="dashboard matrix-grid">
      <Title kicker="Dashboard 4" title="Need x Feasibility Matrix" text="High need and feasible corridors become first-priority candidates; high need but harder operations remain conditional." />
      <div className="matrix-wrap">
        <NeedFeasibilitySvg data={data} selected={selected} setSelectedId={setSelectedId} />
      </div>
      <div className="rank-panel">
        <h3>Final corridor priority</h3>
        <PriorityTable data={data} selected={selected} setSelectedId={setSelectedId} />
      </div>
      <div className="sensitivity-panel">
        <h3>Scenario robustness</h3>
        {data.corridors.filter((c) => c.top3_scenario_count === 4).map((c) => (
          <div key={c.corridor_id} className="robust">
            <CheckCircle2 size={17} />
            <strong>{c.destination_commune_old}</strong>
            <span>Top-3 in {c.top3_scenario_count}/4 scenarios</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CorridorMap({ data, selected, setSelectedId }) {
  const ref = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  useEffect(() => {
    if (!ref.current || map.current) return;
    map.current = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([21.52, 103.22], 11);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
  }, []);
  useEffect(() => {
    if (!map.current) return;
    if (layer.current) layer.current.remove();
    const group = L.layerGroup().addTo(map.current);
    layer.current = group;
    const boundary = L.polygon(boundaryRing(data.boundary), { color: "#6f8793", weight: 2, fillColor: "#eef1ec", fillOpacity: 0.82 }).addTo(group);
    data.corridors.forEach((c) => {
      const color = COLORS[c.final_classification_baseline] || "#666";
      const active = c.corridor_id === selected.corridor_id;
      L.polyline([[c.origin_lat, c.origin_lon], [c.destination_lat, c.destination_lon]], {
        color,
        weight: active ? 5 : 2,
        opacity: active ? 0.95 : 0.48,
        dashArray: active ? "" : "6 7"
      })
        .on("click", () => setSelectedId(c.corridor_id))
        .bindTooltip(`#${c.rank_baseline} ${c.destination_commune_old}: ${c.final_classification_baseline}`)
        .addTo(group);
      L.circleMarker([c.destination_lat, c.destination_lon], {
        radius: active ? 9 : 6,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 1
      })
        .on("click", () => setSelectedId(c.corridor_id))
        .bindTooltip(`${c.destination_name}<br>${fmt(c.time_saved_base_min)} min saved`)
        .addTo(group);
    });
    const first = data.corridors[0];
    L.circleMarker([first.origin_lat, first.origin_lon], { radius: 10, fillColor: "#169a92", color: "#071b2d", weight: 3, fillOpacity: 1 })
      .bindTooltip(first.origin_name)
      .addTo(group);
    map.current.fitBounds(boundary.getBounds().pad(0.08));
  }, [data, selected, setSelectedId]);
  return (
    <div className="map-holder">
      <div className="map" ref={ref} />
      <Legend />
      <div className="map-note"><Layers size={15} /> Direct UAV candidate links. Road route geometry is summarized numerically, not drawn as polylines.</div>
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    </div>
  );
}

<<<<<<< HEAD
function CommuneMap({ data }) {
  const ref = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  useEffect(() => {
    if (!ref.current || map.current) return;
    map.current = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([21.52, 103.22], 11);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
  }, []);
  useEffect(() => {
    if (!map.current) return;
    if (layer.current) layer.current.remove();
    const group = L.layerGroup().addTo(map.current);
    layer.current = group;
    const boundary = L.polygon(boundaryRing(data.boundary), { color: "#708895", weight: 2, fillColor: "#eef1ec", fillOpacity: 0.75 }).addTo(group);
    data.communes.forEach((c) => {
      const color = c.access_gap >= 0.75 ? "#9a2d27" : c.access_gap >= 0.5 ? "#875500" : c.access_gap >= 0.25 ? "#31577c" : "#1f6b51";
      L.circleMarker([c.lat, c.lon], {
        radius: 5 + c.pop_2023 / 1800,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 0.92
      }).bindTooltip(`${c.commune}<br>Access gap ${fmt(c.access_gap, 3)}<br>Road time ${fmt(c.road_time_min, 1)} min`).addTo(group);
    });
    data.health.forEach((f) => {
      L.circleMarker([f.latitude, f.longitude], {
        radius: f.facility_type === "District Medical Center" ? 8 : 4,
        fillColor: "#169a92",
        color: "#071b2d",
        weight: 1.5,
        fillOpacity: 1
      }).bindTooltip(f.facility_name).addTo(group);
    });
    map.current.fitBounds(boundary.getBounds().pad(0.08));
  }, [data]);
  return <Panel title="Commune access-gap map"><div className="small-map" ref={ref} /></Panel>;
}

function boundaryRing(boundary) {
  const geom = boundary?.features?.[0]?.geometry;
  const coords = geom?.type === "MultiPolygon" ? geom.coordinates[0][0] : geom?.coordinates?.[0];
  return (coords || []).map(([lon, lat]) => [lat, lon]);
}

function DecisionPanel({ selected }) {
  return (
    <aside className="decision-card">
      <span className="eyebrow">Selected corridor</span>
      <h3>Trung tâm Y tế Mường Ảng to {selected.destination_commune_old}</h3>
      <Badge value={selected.final_classification_baseline} />
      <div className="metric-grid">
        <Metric icon={Compass} label="Road time" value={fmt(selected.road_time_base_min, 1, " min")} />
        <Metric icon={Plane} label="UAV time" value={fmt(selected.uav_mission_time_base_min, 1, " min")} />
        <Metric icon={Gauge} label="Time saved" value={fmt(selected.time_saved_base_min, 1, " min")} />
        <Metric icon={GitCompare} label="Detour ratio" value={`${fmt(selected.detour_ratio, 2)}x`} />
      </div>
      <ScoreCards selected={selected} />
      <InsightBox>
        Recommendation is preliminary. Validate landing site, current weather, airspace, aircraft endurance, operator SOPs, and medical workflow before real-world deployment.
      </InsightBox>
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    </aside>
  );
}

<<<<<<< HEAD
function BarPanel({ title, rows, label, value, suffix }) {
  const sorted = rows.slice().sort((a, b) => b[value] - a[value]);
  const max = Math.max(...sorted.map((x) => Number(x[value])));
  return (
    <Panel title={title}>
      <div className="bars">
        {sorted.map((row) => (
          <div className="bar" key={`${title}-${row[label]}`}>
            <span>{row[label]}</span>
            <div><i style={{ width: `${Math.max(4, (row[value] / max) * 100)}%` }} /></div>
            <strong>{fmt(row[value], value.includes("score") || value === "access_gap" ? 3 : 1, suffix)}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BandPanel({ rows }) {
  const groups = ["Within 30 min", "30-60 min", "Outside 60 min"].map((band) => ({
    band,
    pop: rows.filter((x) => x.time_band === band).reduce((s, x) => s + x.pop_2023, 0)
  }));
  const max = Math.max(...groups.map((g) => g.pop));
  return (
    <Panel title="Population by access-time band">
      <div className="band-bars">
        {groups.map((g) => (
          <div key={g.band}>
            <strong>{g.band}</strong>
            <span style={{ height: `${Math.max(12, (g.pop / max) * 220)}px` }} />
            <em>{fmt(g.pop, 0)}</em>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RoadAirBars({ selected }) {
  const rows = [
    ["Road distance", selected.road_distance_km, "km"],
    ["UAV aerial path", selected.candidate_aerial_distance_km, "km"],
    ["Road time", selected.road_time_base_min, "min"],
    ["UAV mission time", selected.uav_mission_time_base_min, "min"]
  ];
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <Panel title={`Road vs air: ${selected.destination_commune_old}`}>
      <div className="comparison-bars">
        {rows.map(([label, value, unit]) => (
          <div key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${Math.max(5, (value / max) * 100)}%` }} /></div>
            <strong>{fmt(value, 1, ` ${unit}`)}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function NeedFeasibilitySvg({ data, selected, setSelectedId }) {
  const w = 720;
  const h = 430;
  const pad = 54;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="matrix-svg" role="img" aria-label="Need by feasibility matrix">
      <rect x={pad} y={pad} width={(w - pad * 2) / 2} height={(h - pad * 2) / 2} className="zone conditional" />
      <rect x={pad + (w - pad * 2) / 2} y={pad} width={(w - pad * 2) / 2} height={(h - pad * 2) / 2} className="zone priority" />
      <rect x={pad} y={pad + (h - pad * 2) / 2} width={(w - pad * 2) / 2} height={(h - pad * 2) / 2} className="zone hold" />
      <rect x={pad + (w - pad * 2) / 2} y={pad + (h - pad * 2) / 2} width={(w - pad * 2) / 2} height={(h - pad * 2) / 2} className="zone phase2" />
      <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} />
      <line x1={pad} x2={pad} y1={pad} y2={h - pad} />
      <text x={w / 2} y={h - 15} textAnchor="middle">Healthcare access need</text>
      <text x="18" y={h / 2} transform={`rotate(-90 18 ${h / 2})`} textAnchor="middle">Flight feasibility</text>
      <text x={w - 180} y={pad + 28}>Priority</text>
      <text x={pad + 22} y={pad + 28}>Conditional</text>
      <text x={w - 180} y={h - pad - 18}>Phase 2</text>
      <text x={pad + 22} y={h - pad - 18}>Hold</text>
      {data.corridors.map((c) => {
        const x = pad + c.medical_accessibility_need_score * (w - pad * 2);
        const y = h - pad - c.flight_feasibility_score * (h - pad * 2);
        const active = c.corridor_id === selected.corridor_id;
        return (
          <g key={c.corridor_id} className="matrix-point" onClick={() => setSelectedId(c.corridor_id)}>
            <circle cx={x} cy={y} r={active ? 14 : 10} fill={COLORS[c.final_classification_baseline]} />
            <text x={x} y={y + 4} textAnchor="middle">#{c.rank_baseline}</text>
            <title>{`${c.destination_commune_old}: need ${fmt(c.medical_accessibility_need_score, 3)}, feasibility ${fmt(c.flight_feasibility_score, 3)}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function PriorityTable({ data, selected, setSelectedId }) {
  return (
    <table className="priority-table">
      <thead>
        <tr><th>Rank</th><th>Corridor</th><th>Priority</th><th>Class</th></tr>
      </thead>
      <tbody>
        {data.corridors.map((c) => (
          <tr key={c.corridor_id} className={selected.corridor_id === c.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
            <td>#{c.rank_baseline}</td>
            <td>{c.destination_commune_old}</td>
            <td>{fmt(c.priority_score_baseline, 3)}</td>
            <td><Badge value={c.final_classification_baseline} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CommuneTable({ rows }) {
  return (
    <Panel title="Commune detail">
      <table className="priority-table">
        <thead>
          <tr><th>Rank</th><th>Commune</th><th>Population</th><th>Road time</th><th>Road density</th><th>Access gap</th><th>Band</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.commune}>
              <td>#{r.rank_gap}</td><td>{r.commune}</td><td>{fmt(r.pop_2023, 0)}</td><td>{fmt(r.road_time_min, 1)} min</td><td>{fmt(r.road_density, 2)}</td><td>{fmt(r.access_gap, 3)}</td><td>{r.time_band}</td>
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
            </tr>
          ))}
        </tbody>
      </table>
<<<<<<< HEAD
    </Panel>
  );
}

function FacilityStrip({ facilities }) {
  const district = facilities.filter((f) => f.facility_type === "District Medical Center").length;
  const stations = facilities.length - district;
  return (
    <div className="facility-strip">
      <div><Stethoscope size={20} /><strong>{district}</strong><span>district medical centre</span></div>
      <div><MapPinned size={20} /><strong>{stations}</strong><span>commune health stations / facilities</span></div>
      <div><ShieldAlert size={20} /><strong>1</strong><span>coordinate still uses fallback/audit handling</span></div>
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
    </div>
  );
}

function MethodologyDrawer({ data, onClose }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
<<<<<<< HEAD
        <button onClick={onClose}>Close</button>
        <h2>Model assumptions</h2>
        <p><strong>Population.</strong> Uses WorldPop 2023 study-area total allocated to old communes using 2020 commune shares.</p>
        <p><strong>UAV base model.</strong> Base speed 50 km/h, aerial route factor 1.1, fixed mission time 5 minutes. 60 km/h is upper/reference only.</p>
        <p><strong>Priority.</strong> Baseline = 35% Need + 30% Access Benefit + 25% Feasibility + 10% RiskInverse.</p>
        <p><strong>Risk.</strong> Terrain and weather are MVP study-area screens, not flight authorization.</p>
        <p><strong>Robustness.</strong> {data.corridors.filter((c) => c.top3_scenario_count === 4).map((c) => c.destination_commune_old).join(", ")} remain Top-3 across all four tested scenarios.</p>
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
      </aside>
    </div>
  );
}

<<<<<<< HEAD
function Title({ kicker, title, text }) {
  return <div className="title"><span>{kicker}</span><h2>{title}</h2><p>{text}</p></div>;
}

function Panel({ title, children }) {
  return <div className="panel"><h3>{title}</h3>{children}</div>;
}

function Kpi({ icon: Icon, label, value, note }) {
  return <div className="kpi"><Icon size={18} /><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
=======
function Kpi({ label, value, note }) {
  return <div className="kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric"><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;
}

<<<<<<< HEAD
function Badge({ value }) {
  return <span className={`badge ${slug(value)}`} style={{ background: COLORS[value] }}>{value}</span>;
}

function Legend() {
  return <div className="legend">{Object.entries(COLORS).map(([k, v]) => <span key={k}><i style={{ background: v }} />{k}</span>)}</div>;
}

function ScoreCards({ selected }) {
  const items = [
    ["Need", selected.medical_accessibility_need_score],
    ["Benefit", selected.uav_benefit_score],
    ["Feasibility", selected.flight_feasibility_score],
    ["Risk", selected.operational_risk_score],
    ["Priority", selected.priority_score_baseline],
    ["Top-3 scenarios", `${selected.top3_scenario_count}/4`]
  ];
  return <div className="scorecards">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{typeof value === "number" ? fmt(value, 3) : value}</strong></div>)}</div>;
}

function FlowItem({ title, value }) {
  return <div className="flow-item"><strong>{title}</strong><span>{value}</span></div>;
}

function InsightBox({ children }) {
  return <div className="insight"><AlertTriangle size={17} /> <p>{children}</p></div>;
=======
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
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
}

createRoot(document.getElementById("root")).render(<App />);
