# Design Notes

## Design System

The visual direction is healthcare operations, aviation planning, mountain geography, and decision intelligence. The interface uses a persistent dark navy navigation rail, off-white workspace background, white operational panels, healthcare teal accents, and restrained classification colors.

Classification colors:

- `LAUNCH`: green
- `CONDITIONAL PILOT`: amber
- `PHASE 2`: muted blue
- `HOLD`: muted rose

## Typography

The app uses a system sans-serif stack for reliable deployment and Vietnamese rendering. Headings are bold and compact, while metric labels use small uppercase text for operational scanability.

## Layout

The first screen is map-centric, with a KPI strip, large geographic operating picture, and right-side decision panel. Explorer, prioritization, planner, scenario, and seasonal screens use focused two-column task layouts sized for a 1440x900 laptop demo.

## Interaction Decisions

- Corridor selection is shared across screens.
- Map markers and candidate UAV links are clickable and hoverable.
- Corridor Explorer includes searchable corridor selection and plain-language metric tooltips.
- Prioritization uses a Need x Feasibility matrix without artificial quadrant thresholds.
- Mission Planner uses a step workflow but labels outputs as preliminary screening.
- Scenario Lab uses segmented scenario controls and rank-movement indicators.
- Seasonal Readiness uses a month selector and data-derived seasonal observations without safe/unsafe weather claims.

## Safety and Scientific Wording

The app consistently uses language such as preliminary screening, planning context, modeled estimate, and operator verification. It avoids fake live weather, actual drone position, completed missions, emergency claims, flight permissions, and invented road-route geometry.
