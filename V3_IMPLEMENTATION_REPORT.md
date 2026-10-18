# SkyBridge V3 Implementation Report

## Current architecture

SkyBridge remains a static React 19 / Vite 7 application. `src/main.jsx` owns navigation, shared corridor/language/mission-draft state, data loading, corridor intelligence, scenarios, and evidence views. `src/MissionWorkspace.jsx` owns the end-to-end mission UI and Leaflet map. `src/mission-engine.js` is the shared pure calculation and recommendation engine. Research inputs remain unchanged under `public/data/`.

This supplied folder is not a Git checkout (`.git` is absent), so no feature branch was created. No commit, push, deployment, hosting change, or dataset deletion was performed.

## Product changes implemented

- Replaced the fragmented navigation with four primary destinations: Decision Workspace, Corridor Intelligence, Scenario Studio, and Evidence & Methodology.
- Made Decision Workspace the default screen. It contains the only mission request form and presents the map and recommendation together.
- Added persistent shared state for selected corridor, live mission draft, language, and planning month.
- Added cross-page handoff from a corridor to the exact origin/destination mission and from the active mission to operational sensitivity.
- Added two Scenario Studio modes: operational parameter what-if and source-backed strategic ranking scenarios.
- Added two/three-corridor comparison and a unified detail / priority / comparison sub-navigation.
- Consolidated the complete seasonal analysis into Evidence & Methodology without reducing its charts, month selector, caution classes, or corridor context.
- Added explicit policy and material-limitation views.

## Final refinement and consistency audit

- Standardized distance terminology across mission and corridor views: **straight-line geographic distance** is the geodesic endpoint distance, **modeled flight distance** applies the selected detour factor, and **road-network distance** is the precomputed research output.
- Added a shared `corridorBaselineMetrics` adapter so Corridor Intelligence and mission calculations use the same field definitions. Ngối Cáy remains 7.040 km straight-line, 7.744 km modeled flight, 17.711 km road-network distance, 53.2 road minutes, 14.3 UAV minutes, and 38.9 minutes saved.
- Reorganized the Decision Workspace result hierarchy around recommendation status and the three primary time metrics. Secondary distances, limitations, and provenance remain available through expandable detail.
- Added compact guided-demo continuation actions from an evaluated mission to corridor prioritization and operational sensitivity.
- Expanded Strategic Prioritization with scenario objective, exact source fields, risers/fallers, component-score context, and an explicit “Why did rankings change?” section. Rankings remain loaded from exported scenario fields and are never recomputed in the browser.
- Replaced operational-scenario summary cards with a baseline/modified comparison table, explicit constraint comparison, and recommendation-change status. Only materially changed metrics receive emphasis.
- Fixed Scenario Studio corridor switching so the displayed corridor, endpoint pair, calculation, and shared mission draft change atomically.
- Reworked corridor comparison into compact score-focused cards for need, benefit, feasibility, risk, and priority, plus a data-grounded highest-need versus highest-rank insight.

## Component disposition

| Existing component | V3 decision | Reason |
|---|---|---|
| Deep-navy shell, teal accent, typography, cards, spacing | KEEP | Established professional SkyBridge identity. |
| Mission Request controls | REFACTOR | Kept functional controls and validation; made this the only mission form and renamed the action to Evaluate Mission. |
| Leaflet / OpenStreetMap map | KEEP + REFACTOR | Preserved markers, pan/zoom, fit bounds, map picking, boundary, and dashed UAV candidate. Retained honest missing-road-geometry fallback. |
| Shared mission engine | KEEP + EXTEND | Same geodesic/time/constraint/recommendation pipeline is used by Decision Workspace and operational sensitivity. |
| Corridor Explorer list, bars, score cards | MERGE | Preserved inside Corridor Intelligence and connected to comparison and mission evaluation. |
| Prioritization need × feasibility matrix | MERGE | Preserved category colors, quadrants, point selection, ranked table, and source ranks inside Corridor Intelligence. |
| Ranked corridor table and rank stability visual | KEEP | Source-backed ranking and scenario outputs remain unchanged. |
| Scenario Lab mission form | REMOVE | It duplicated Mission Control. Replaced by parameter-only operational sensitivity using the active mission. |
| Existing named ranking scenarios | KEEP + REFRAME | Exposed as Strategic Prioritization. No invented weights were introduced because the executable weighting pipeline is absent. |
| Seasonal Readiness | MERGE | Full 12-month overlay, precipitation/wind/temperature plots, caution classes, and corridor context moved intact to Evidence & Methodology. |
| Methodology drawer | MERGE | Core model explanation and provenance were promoted into a primary evidence page. |
| Legacy Mission Control static KPI screen | REMOVE | Replaced by the functional mission-to-recommendation workflow; static KPIs could conflict with the active mission. |

## Preserved evidence and methodology

- Active corridor source: `final_corridor_priority_dataset_terrain_v2_ranked.csv`.
- Baseline UAV formula: `(detour factor × straight-line km / cruise km/h) × 60 + handling minutes`.
- Baseline assumptions: 1.10 detour factor, 50 km/h, 5 minutes handling, 15 km one-way range, 3 kg capacity, 2 kg reference payload.
- Exact directional facility IDs and near-exact coordinates are required before corridor evidence is inherited.
- Road distance/time remain precomputed research outputs. No road polyline is fabricated.
- Healthcare need, UAV benefit, feasibility, risk, priority, classifications, and rankings remain the supplied terrain-v2 values.
- Reference corridor `HF001_HF004` remains 53.2 road minutes, 14.3 UAV minutes, and 38.9 minutes saved.

Recommendation order remains deterministic: constraint violation → not feasible; missing evidence/road result → insufficient data; no positive time benefit → road preferred; positive benefit plus source `LAUNCH` → high potential; otherwise conditional pilot. Urgency never overrides constraints.

## Strategic sensitivity integrity

The repository contains exported scores/ranks for Baseline, Equity First, Efficiency First, and Safety First, but not the executable composite weighting pipeline or authoritative slider weights. V3 therefore uses those four validated scenarios exactly as supplied. It deliberately does not reverse-engineer or invent adjustable weights. The UI states this limitation and frames the results as sensitivity analysis rather than optimal policy.

## Tests and verification

- `npm.cmd test`: 16/16 calculation tests passed, including distance-definition consistency and detour-factor dependency.
- `npm.cmd run build`: production Vite build passed.
- `$env:BROWSER_CHANNEL='msedge'; npm.cmd run test:integration`: both Playwright suites passed.

Browser coverage includes example mission values, speed/handling/range/payload changes, negative savings, missing road evidence, map point selection, missing basemap fallback, corridor-to-mission handoff, all four V3 pages, matrix and comparison views, operational and strategic scenarios, all 12 seasonal months, policy/limitations, EN/VI switching, SPA refresh fallback, dataset failure, and mobile horizontal-overflow checks.

The final regression also verifies Ngối Cáy values across Decision Workspace, Corridor Intelligence, and Scenario Studio; atomic scenario corridor switching; the exported Equity First leader; comparison insight rendering; and strategic ranking explanations.

## Known limitations

- Facility coordinates are not field-verified; HF006 uses a commune-centroid fallback.
- No road-route polylines or reproducible road-network processing code are supplied.
- No live weather, traffic, telemetry, airspace, permit, battery, return-leg, terrain-clearance, or cold-chain service is connected.
- Terrain and weather evidence are not dynamically recalculated from operational sliders.
- The strategic weighting pipeline is not present, so only supplied scenario scores/ranks are used.
- Some values differ only by display rounding: the Ngối Cáy dynamic formula produces 14.2928 minutes and is displayed as 14.3, matching the precomputed export. Its 7.744 km modeled flight distance is computed from 7.040 × 1.10.
- Búng Lao's exported modeled flight distance is 15.006 km, marginally above the 15 km user constraint even though its source screening flag describes it as near the reference radius limit. The deterministic mission constraint therefore marks 15.0 km as insufficient for that corridor; the source classification itself is not overwritten.
- The application is a planning prototype and never represents flight authorization.

## Local run

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

For browser QA with installed Microsoft Edge:

```powershell
$env:BROWSER_CHANNEL='msedge'
npm.cmd run test:integration
```

## Existing Render redeployment

Keep the existing Render static-site service and public URL. Use the current repository as its source, `npm ci && npm run build` as the build command if required by the service, and `dist` as the publish directory. Confirm SPA fallback/rewrites still route unknown paths to `index.html`. Redeploy only after explicit authorization; this implementation did not access or modify Render.
