# V2 verification results

Verified locally on Windows with Node 20.20.2, Vite 7.3.6 and headless Microsoft Edge.

## Results
- npm test: **14/14 passed** using the actual terrain-v2 CSV as the numerical fixture.
- npm run build: **passed**. dist/index.html, CSS and JavaScript assets generated. Final build: 1,596 modules; JS 439.82 kB (135.31 kB gzip), CSS 49.34 kB.
- scripts/qa-v2.cjs: **passed**, no browser exceptions.
- scripts/qa-v2-extra.cjs: **passed**, no browser exceptions.
- All original public/data files match the committed Git source blobs; no analytical datasets were edited.

| Acceptance | Evidence |
|---|---|
| A: supported mission | Real Ngối Cáy data, submission, numeric outputs and SVG UAV overlay verified. |
| B: same location | Engine and browser reject identical coordinates. |
| C/D: speed/handling | Formula sensitivity verified; browser results update after input changes. |
| E/F: range/payload | Both hard constraints tested; emergency urgency cannot override payload. |
| G: no UAV benefit | Negative savings preserved; Road Preferred displayed. |
| H: missing data | Arbitrary point receives no road time or unrelated corridor scores. |
| I: corridor template | Selected corridor's destination populates the mission form; fresh template clears old assumptions. |
| J: scenarios | Shared-engine baseline tests plus browser persistence/comparison verified. |
| K: bilingual | New controls and scenario comparison exercised in VI and EN; legacy page heading returns to English. |
| L: production/refresh | Production build passes; local SPA fallback and refreshed /mission path tested. Actual Render deployment remains unverified. |

Additional browser checks: map-point selection, missing basemap tiles, out-of-bounds coordinates, 390 px mobile page width, dataset HTTP 503 failure and desktop/mobile screenshot capture. Tests intentionally block public map tiles to make offline behavior deterministic. Live basemap availability is not asserted.

## Corrected issues found during verification
- Default payload step mismatch blocked native form submission.
- Mapped-drive realpath restrictions required Vite preserveSymlinks.
- Windows Node 20 required an explicit test filename instead of a shell glob.
- Leaflet zoom transitions could outlive navigation; mission map transitions are disabled.
- Legacy DOM translations did not restore English; original/translated text is now tracked without remounting mission state.

## Remaining limitations
- No road geometry/routing network exists in the supplied repository. Numeric precomputed road estimates are retained; no road line is fabricated.
- No live weather, telemetry, aviation authorization or clinical validation.
- Full score-generation and road-network processing pipelines are absent; inherited scores are not recomputed.
- npm audit reports one existing high-severity transitive source-map-js advisory (GHSA-68fv-2mgg-jv7q). Dependency remediation was not included in this functional upgrade.
- The existing Render service was not deployed or tested remotely. Its service type, configured branch and routing configuration must be checked before updating.
- The original Git index contained staged deletions with working files untracked. That index was intentionally left untouched.

## Main implementation files
- src/mission-engine.js: pure validation, geographic evidence matching, model, hard constraints and five decision outcomes.
- src/MissionWorkspace.jsx: bilingual form, map, explanations, inherited evidence, scenario comparison and methodology.
- src/mission.css: responsive mission layout.
- src/main.jsx: navigation integration, templates, data-error handling and reversible legacy translations.
- vite.config.cjs: mapped-drive-compatible resolution.
- tests/mission.test.js, scripts/qa-v2.cjs, scripts/qa-v2-extra.cjs: automated verification.
- README.md, V2_AUDIT.md, V2_RUNBOOK.md: audit, operating instructions and existing-service deployment guidance.

Screenshots: screenshots/v2-mission.png, screenshots/v2-scenario.png and screenshots/v2-mobile.png.
