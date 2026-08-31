<<<<<<< HEAD
# SkyBridge Mission Control Prototype

Prototype dashboard for the SkyBridge ASEAN DSE concept: medical UAV corridor prioritization in Mường Ảng, Điện Biên.

This is a local Vite + React + Leaflet app. It uses the latest processed project CSVs copied into `public/data`.

## Run by CMD

Open Command Prompt and run:

```cmd
cd /d D:\SkyBridge-main\SkyBridge-main
=======
# SkyBridge Mission Control

Medical Logistics Decision Support for Mountain Communities.

This is a deployable Vite/React prototype for preliminary planning and operator evidence review in Mường Ảng, Điện Biên. It is not a flight authorization, dispatch, or telemetry system.

## Run Locally

```bash
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
npm install
npm run dev
```

<<<<<<< HEAD
Then open the URL shown in the terminal, usually:

```text
http://127.0.0.1:4173/
```

If port 4173 is busy, Vite will show another local URL. Use the URL printed by the terminal.

## What the Prototype Contains

- Hero dashboard: answers "Where should we launch first?"
- Dashboard 1: The Mountain Healthcare Divide
- Dashboard 2: Who is being left behind?
- Dashboard 3: Road vs Air
- Dashboard 4: Need x Feasibility Matrix
- Clickable corridor map and decision panel
- Scenario robustness notes
- Model assumptions drawer

## Data Notes

- Population uses WorldPop 2023 proportional allocation.
- UAV base assumption: 50 km/h, aerial route factor 1.1, fixed mission time 5 minutes.
- Risk and feasibility are MVP screening indicators, not flight authorization.
- Road route geometry is summarized numerically; the map draws direct UAV candidate links.

## Build

```cmd
npm run build
```

Build output is written to `dist`.
=======
The dev command builds the app and serves the production preview. This avoids a Vite dependency-optimizer issue observed on the local Windows OneDrive path while preserving the requested `npm run dev` entrypoint.

## Build

```bash
npm run build
```

Build output is written to `dist/`.

## Preview Build

```bash
npm run preview
```

## Screenshots

Screenshots are saved in `screenshots/`. To regenerate them while the app is running:

```bash
npm run screenshots -- http://127.0.0.1:5176/
```

## Vercel Deployment

1. Create a new Vercel project from this `mission-control` folder.
2. Use framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. No environment variables are required.

## Netlify Deployment

1. Create a new Netlify site from this `mission-control` folder.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. No environment variables are required.

## Important Limitation

The prototype uses modeled and derived planning metrics, monthly climatological context, and preliminary feasibility/risk scores. Final dispatch would require operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures.
>>>>>>> b3c4bd170e5606955e0ae731d930d19e0a530493
