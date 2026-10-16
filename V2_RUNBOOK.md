# SkyBridge V2 — run, test and update the existing service

## Local
Requires Node 20.19+ or supported newer Node (Vite 7 requirement).

```sh
npm ci
npm run test
npm run build
npm run preview
npm run test:integration
```

Preview binds to 127.0.0.1 on Vite's default preview port (normally 4173). The existing npm run dev builds then previews. Integration tests start their own static server. Install Playwright Chromium with npx playwright install chromium, or set BROWSER_CHANNEL=msedge for an installed Edge browser.

## Demo
1. Mission Control → Load Example Mission → Generate Recommendation.
2. Ngối Cáy uses the supplied 53.2-minute road estimate and dynamically computes 14.2928 minutes UAV, displayed as 14.3; savings 38.9 minutes.
3. Change speed or handling and watch the result update. Set range to 1 km or payload above 3 kg to trigger constraints. Set handling to 60 minutes to prefer road.
4. Corridor Explorer → select a corridor → Use as Mission Template.
5. Scenario Lab compares baseline assumptions and modified inputs using the same engine, retaining the original scenario-rank tables.
6. Switch EN / VI; select a custom map point to see explicit missing-data behavior.

## Existing Render service only
Target: https://skybridge-a6r8.onrender.com/

No deployment was performed and no new service was created. Verify the service type and existing connected repository/branch in Render before updating:
- Preserve the existing service, domain, repository connection and root directory.
- For a Static Site, use build command npm ci && npm run build and publish directory dist.
- Preserve/add the SPA rewrite from /* to /index.html with action Rewrite, after any asset-specific rules.
- If the existing service is a Web Service, retain its production static-server/start configuration and ensure it serves dist with index.html fallback, binds 0.0.0.0 and uses Render's PORT. Do not replace it with the localhost-only preview command.
- Review the pre-existing staged deletion/untracked-file state before committing. Stage the intended final files deliberately; do not commit the old index blindly.
- Commit/push the reviewed changes to the service's configured branch, then use that existing service's deployment flow.
- Verify the root page, refreshed route, CSV/GeoJSON loading, template workflow and language toggle on the existing URL.

No API keys are required. Basemap tiles require network access; a visible fallback handles unavailable tiles. No road routing service, current-weather feed or flight authorization integration is present.

See V2_AUDIT.md for evidence, score versioning, decision policy and limitations.
