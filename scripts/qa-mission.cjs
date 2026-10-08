const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  const root = path.resolve(__dirname, '../dist');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json' };
    fs.readFile(file, (error, data) => {
      res.writeHead(error ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'text/plain; charset=utf-8' });
      res.end(error ? 'Not found' : data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.addInitScript(() => localStorage.setItem('skybridge-language', 'en'));
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Browser:', error.stack); });
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /04 Mission Planner/ }).click();
    assert.equal(await page.getByRole('combobox', { name: /^Destination/ }).inputValue(), 'HF001_HF004');
    assert.equal(await page.getByLabel('Payload (kg)', { exact: true }).inputValue(), '1.5');
    assert.equal(await page.locator('.mission-route-map').count(), 0);
    const evaluate = () => page.getByRole('button', { name: 'Evaluate Mission', exact: true }).click();
    await evaluate();
    await page.locator('.mission-route-map').waitFor();
    await page.locator('.mission-route-map .leaflet-overlay-pane svg').waitFor();
    assert.equal(await page.locator('.screening-label').innerText(), 'LAUNCH CANDIDATE');
    const expectedDemo = ['0.58', '53.2', '14.3', '38.9', '0.91', '#1'];
    const values = await page.locator('.mission-kpis .kpi strong').allTextContents();
    expectedDemo.forEach((value, index) => assert(values[index].startsWith(value), `${values[index]} != ${value}`));
    await page.screenshot({ path: path.resolve(__dirname, '../screenshots/mission-recommendation.png'), fullPage: true });
    const lines = fs.readFileSync(path.resolve(__dirname, '../public/data/final_corridor_priority_dataset_terrain_v2_ranked.csv'), 'utf8').trim().split(/\r?\n/).map(line => line.slice(1, -1).split('\",\"'));
    const rows = lines.slice(1).map(values => Object.fromEntries(lines[0].map((name, index) => [name, values[index]])));
    for (const row of rows) {
      await page.getByRole('combobox', { name: /^Destination/ }).selectOption(row.corridor_id);
      if (row.corridor_id !== 'HF001_HF004') assert.equal(await page.locator('.mission-route-map').count(), 0);
      await evaluate();
      const actual = await page.locator('.mission-kpis .kpi strong').allTextContents();
      ['medical_accessibility_need_score', 'road_time_base_min', 'uav_mission_time_base_min', 'time_saved_base_min', 'flight_feasibility_score'].forEach((field, i) => {
        const expected = Number(row[field]).toLocaleString('en-US', { maximumFractionDigits: [0, 4].includes(i) ? 2 : 1 });
        assert(actual[i].startsWith(expected), `${row.corridor_id} ${field}: ${actual[i]} != ${expected}`);
      });
      assert.equal(actual[5], '#' + row.rank_baseline);
      assert.equal(await page.locator('.screening-label').innerText(), row.final_classification_baseline === 'LAUNCH' ? 'LAUNCH CANDIDATE' : row.final_classification_baseline);
      assert((await page.locator('.mission-route-map').getAttribute('aria-label')).includes(row.destination_commune_old));
      assert.equal(await page.locator('.mission-route-map path.leaflet-interactive[stroke="#00A89D"]').count(), 1);
      assert((await page.locator('.mission-road-note').innerText()).includes('no road path is drawn'));
    }
    await page.getByRole('combobox', { name: /^Destination/ }).selectOption('HF001_HF004');
    await page.getByRole('combobox', { name: /^Cargo Type/ }).selectOption('Diagnostic Kit');
    await page.getByRole('combobox', { name: /^Urgency/ }).selectOption('Routine');
    await page.getByLabel('Payload (kg)', { exact: true }).fill('2');
    await evaluate();
    assert.deepEqual(await page.locator('.mission-kpis .kpi strong').allTextContents(), values);
    await page.getByRole('button', { name: 'Review corridor details', exact: true }).click();
    await page.locator('.mission-review-panel').waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    for (const payload of ['', '-1', '0']) {
      await page.getByLabel('Payload (kg)', { exact: true }).fill(payload);
      await evaluate();
      assert.equal(await page.locator('.mission-route-map').count(), 0);
    }
    for (const label of ['01 Mission Control', '02 Corridor Explorer', '03 Prioritization', '05 Scenario Lab', '06 Seasonal Readiness', '04 Mission Planner']) {
      await page.getByRole('button', { name: new RegExp(label) }).click();
      assert.equal(await page.locator('.screen').count(), 1);
    }
    await evaluate();
    await page.locator('.mission-route-map').waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS: ${rows.length} destinations match source data; default demo, context-only inputs, validation, map lifecycle, details, and all six pages. No browser errors.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });