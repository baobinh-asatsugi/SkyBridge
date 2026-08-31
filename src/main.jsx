import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CloudRain,
  Compass,
  Gauge,
  GitCompare,
  Info,
  Layers,
  MapPinned,
  Plane,
  ShieldAlert,
  Stethoscope,
  Users,
  Wind
} from "lucide-react";
import "./styles.css";

const DATA = {
  corridors: "/data/final_corridor_priority_dataset.csv",
  scenarios: "/data/scenario_sensitivity_analysis.csv",
  weather: "/data/weather_risk_monthly.csv",
  health: "/data/health_facilities_clean.csv",
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
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
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) =>
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
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    async function load() {
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
          };
        })
        .sort((a, b) => a.rank_baseline - b.rank_baseline);
      setState({
        status: "ready",
        corridors,
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
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function App() {
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
    </div>
  );
}

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
      </div>
      <DecisionPanel selected={selected} />
    </section>
  );
}

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
    </div>
  );
}

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
    </aside>
  );
}

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
            </tr>
          ))}
        </tbody>
      </table>
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
    </div>
  );
}

function MethodologyDrawer({ data, onClose }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}>Close</button>
        <h2>Model assumptions</h2>
        <p><strong>Population.</strong> Uses WorldPop 2023 study-area total allocated to old communes using 2020 commune shares.</p>
        <p><strong>UAV base model.</strong> Base speed 50 km/h, aerial route factor 1.1, fixed mission time 5 minutes. 60 km/h is upper/reference only.</p>
        <p><strong>Priority.</strong> Baseline = 35% Need + 30% Access Benefit + 25% Feasibility + 10% RiskInverse.</p>
        <p><strong>Risk.</strong> Terrain and weather are MVP study-area screens, not flight authorization.</p>
        <p><strong>Robustness.</strong> {data.corridors.filter((c) => c.top3_scenario_count === 4).map((c) => c.destination_commune_old).join(", ")} remain Top-3 across all four tested scenarios.</p>
      </aside>
    </div>
  );
}

function Title({ kicker, title, text }) {
  return <div className="title"><span>{kicker}</span><h2>{title}</h2><p>{text}</p></div>;
}

function Panel({ title, children }) {
  return <div className="panel"><h3>{title}</h3>{children}</div>;
}

function Kpi({ icon: Icon, label, value, note }) {
  return <div className="kpi"><Icon size={18} /><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric"><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;
}

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
}

createRoot(document.getElementById("root")).render(<App />);
