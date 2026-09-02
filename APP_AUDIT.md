# App Audit

## Datasets Used

- `public/data/final_corridor_priority_dataset.csv`
- `public/data/scenario_sensitivity_analysis.csv`
- `public/data/weather_risk_monthly.csv`
- `public/data/health_facilities_clean.csv`
- `public/data/commune_master.csv`
- `public/data/access_gap_commune_ranking_v5_population_2023_proportional.csv`
- `public/data/uav_specification_assumptions.csv`
- `public/data/muong_ang_boundary.geojson`

## Fields Used

Corridor fields: `corridor_id`, `origin_id`, `origin_name`, `destination_id`, `destination_name`, `destination_commune_old`, `straight_distance_km`, `road_distance_km`, `detour_ratio`, `road_time_base_min`, `uav_mission_time_base_min`, `time_saved_base_min`, `time_saved_base_pct`, `candidate_aerial_distance_km`, `population_potentially_served_worldpop_2023_proportional`, `medical_accessibility_need_score`, `uav_benefit_score`, `flight_feasibility_score`, `operational_risk_score`, `priority_score_baseline`, scenario priority scores, `final_classification_baseline`, and `rank_baseline`.

Scenario fields: `rank_baseline`, `rank_equity_first`, `rank_efficiency_first`, `rank_safety_first`, `top3_scenario_count`, and `robustness_label`.

Health facility fields: `facility_id`, `facility_name`, `commune_old`, `lat`, and `lon`. The app reconstructs the SAP crosstab header and joins coordinates to corridors by `origin_id` and `destination_id`.

Weather fields: `month`, `precipitation_total_mean`, `mean_wind_speed_mean`, `mean_temperature_mean`, and `monthly_weather_risk_score`.

## Verified Key Finding

Ngối Cáy is the baseline rank #1 corridor and is classified `LAUNCH`.

- Road time: 53.2 min
- UAV mission time: 14.3 min
- Time saved: 38.9 min
- Percent saved: 73.1%
- Top-3 robustness: 4/4 scenarios

## Calculations and UI Derivations

- Candidate corridors: count of rows in `final_corridor_priority_dataset.csv`.
- Pilot candidates: count where `final_classification_baseline` is `LAUNCH`.
- Robust Top-3: count where `top3_scenario_count` from scenario sensitivity is 4.
- Maximum minutes saved: max of `time_saved_base_min`.
- Scenario movement: baseline rank minus selected scenario rank.
- Seasonal observations: wettest, driest, and windiest months are ranked from monthly source fields.

## Limitations

- `final_corridor_priority_dataset.csv` in the SAP folder does not contain coordinate or robustness columns, so the app joins coordinates from `health_facilities_clean.csv` and robustness from `scenario_sensitivity_analysis.csv`.
- No actual origin-to-destination road-route polylines were found. The map shows study-area boundary, health facility points, and direct candidate UAV links only.
- Road distance and road time are modeled values from the project analysis, not drawn route geometry.
- Weather is monthly climatological or historical planning context, not real-time aviation weather.
- Feasibility, risk, and priority scores are preliminary planning estimates and depend on the project methodology.
- The prototype is not operational flight-control software and does not grant flight permission.
