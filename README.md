# SkyBridge Mission Control Prototype

Prototype dashboard for the SkyBridge ASEAN DSE concept: medical UAV corridor prioritization in Mường Ảng, Điện Biên.

This is a local Vite + React + Leaflet app. It uses the latest processed project CSVs copied into `public/data`.

## Run by CMD

Open Command Prompt and run:

```cmd
cd /d D:\SkyBridge-main\SkyBridge-main
npm install
npm run dev
```

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
