# SkyBridge V2 implementation audit

## Checkout state
The working folder initially contained data and documentation but no src/, scripts/ or Vite configuration. Git's index recorded deletions of all tracked files, with many corresponding working files untracked. Missing application files were recovered from HEAD without resetting or staging the index. Review this pre-existing index state before committing.

## KEEP / REFACTOR / REPLACE
| Module | Decision | Evidence and implementation |
|---|---|---|
| React 19 / Vite 7 frontend | KEEP | Existing JavaScript/JSX single entry application, Leaflet 1.9, lucide icons, CSS. No TypeScript migration. |
| Backend / API | KEEP static architecture | No backend, telemetry, weather API, routing server or secret configuration exists. Client engine uses embedded evidence. |
| Dataset loader | REFACTOR | Existing CSV parser and SAP facility crosstab reconstruction retained. Explicit HTTP failures added. |
| Mission Control | REPLACE screen | Previously precomputed KPIs, selected corridor and map. Now form, validation, shared calculations, map and explainable outcome. |
| Mission Planner | CONSOLIDATE | Previous payload and urgency were context only; now routed to the same mission workspace. Duplicate navigation removed. |
| Corridor Explorer | KEEP + EXTEND | Original metrics preserved; exact corridor origin/destination populate a fresh mission template. |
| Prioritization | KEEP | Interactive selected-corridor comparison, independent need/benefit/feasibility/risk and existing weighted rankings retained. |
| Scenario Lab | REFACTOR | Original ranking-sensitivity tables retained below live mission what-if comparison. Same engine as Mission Control. |
| Seasonal Readiness | KEEP | Monthly climatological context only; no live weather claims. |
| Maps | REFACTOR | Existing Leaflet geography retained; mission markers, pick destination, fit bounds, dashed illustrative UAV segment, tile-service fallback added. No fabricated road polyline. |
| Tests | REPLACE obsolete mission assertions | Existing tests expected context-only payload behavior. New Node calculation tests and Playwright workflow tests cover V2. |
| Render | DOCUMENT | No Render service configuration or credentials in repository. Vite dist remains deployable to the existing service. No new service created. |

## Data and calculations
- Active analytical version: public/data/final_corridor_priority_dataset_terrain_v2_ranked.csv.
- Earlier version: final_corridor_priority_dataset.csv. Retained unchanged; terrain-v2 priority/feasibility differ from the earlier export.
- Other data: health_facilities_clean.csv, commune_master.csv, access_gap_commune_ranking_v5_population_2023_proportional.csv, scenario_sensitivity_analysis.csv, weather_risk_monthly.csv, uav_specification_assumptions.csv, SAC summary exports.
- Geography: muong_ang_boundary.geojson and muong_ang_communes.geojson. No road-route geometries or routable network files.
- Road distance/time are precomputed integrated_v3_osm_rerun_with_uploaded_facility_coordinates model outputs. Network processing code and edge speeds are absent, so the original travel-time derivation cannot be reproduced here.
- UAV baseline: (1.10 × straight_distance_km / 50) × 60 + 5 minutes. Mission engine recalculates without rounding until display.
- Need formula in data: 0.60 × operational access-gap normalization + 0.40 × proportionally allocated 2023 population normalization.
- Benefit formula: 0.50 × saved-percentage normalization + 0.30 × saved-minutes normalization + 0.20 × detour-ratio normalization.
- Terrain-v2 uses corrected slope statistics within a 500 m aerial corridor buffer. Weather remains district-level climatology. Composite feasibility, risk and priority are inherited outputs; their full executable pipeline and priority weighting definitions are not included. No replacement weights introduced.
- Aircraft reference: speed 50 km/h, factor 1.1, handling 5 minutes, effective one-way radius 15 km, baseline payload 3 kg and required medical MVP payload 2 kg. These are explicitly scenario assumptions, not a certified aircraft specification.
- Dynamic checks use modeled flight distance against selected one-way range and payload against selected capacity. No battery, return leg, winds, terrain clearance or payload-dependent speed model is implied.
- Geographic evidence matches exact directional facility IDs and coordinates within 20 m of their dataset coordinates (to accommodate export precision). Arbitrary map points never inherit evidence.
- All facility coordinates have source-unverified or centroid-fallback provenance. They are candidate sites, not validated operating locations.

## Recommendation rules (new planning policy, not a replacement weighted score)
1. Exceeded payload or range: Not Feasible Under Selected Constraints.
2. Missing corridor evidence or road time: Insufficient Data.
3. UAV time at least road time: Road Preferred.
4. Positive time benefit with inherited LAUNCH classification: High Potential candidate.
5. Other positive-time supported corridors: Conditional Pilot candidate.
Urgency is context only and never overrides feasibility. All outcomes require operator review. Baseline scores/ranks remain unchanged.

## Honest limitations
Actual road geometry is unavailable. The map therefore shows no road line; numeric road estimates retain their source label. A future OSRM-compatible adapter should return distance, duration, GeoJSON, routing version and errors for the exact endpoints, with snapping validation. Routing alone must never grant healthcare/terrain/site evidence to arbitrary coordinates. No external routing service is claimed as integrated.

The public deployed URL could not be inspected with the available web tool. Local tests establish local behavior, not the deployed service state.
