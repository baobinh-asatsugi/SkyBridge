# SkyBridge Mission Control

Medical Logistics Decision Support for Mountain Communities.

This is a deployable Vite/React prototype for preliminary planning and operator evidence review in Mường Ảng, Điện Biên. It is not a flight authorization, dispatch, or telemetry system.

## Run Locally

```bash
npm install
npm run dev
```

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
