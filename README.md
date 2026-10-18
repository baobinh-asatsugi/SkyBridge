# SkyBridge V3 — Medical UAV Decision Intelligence

Evidence-based medical UAV corridor planning for Mường Ảng, Điện Biên. V3 unifies mission evaluation, corridor prioritization, operational and strategic sensitivity, and research evidence in four connected workspaces while preserving the established SkyBridge design and terrain-v2 outputs.

This is a research planning prototype, not operational dispatch or flight authorization.

## Run

```sh
npm ci
npm run dev
```

The existing development command builds and serves the production preview (normally http://127.0.0.1:4173). Production output remains dist/.

## Verify

```sh
npm test
npm run build
npm run test:integration
```

Browser tests require Playwright Chromium or an installed Edge browser. PowerShell example: $env:BROWSER_CHANNEL='msedge'. Integration tests start their own server, exercise the mission workflow and save V2 desktop/mobile screenshots.

## Evidence and deployment

- [Architecture and data audit](V2_AUDIT.md)
- [V3 implementation report](V3_IMPLEMENTATION_REPORT.md)
- [Local operation, demo and existing Render update instructions](V2_RUNBOOK.md)
- [Verification results](V2_TEST_RESULTS.md)

Use the existing https://skybridge-a6r8.onrender.com/ service. No new hosting service is required or created.

Road times and corridor scores remain source-backed precomputed models. UAV times and selected payload/range checks are recalculated. No road polylines are supplied, so the map draws only the explicitly illustrative UAV path; road figures remain numeric. Arbitrary locations never inherit unrelated healthcare or feasibility scores.
