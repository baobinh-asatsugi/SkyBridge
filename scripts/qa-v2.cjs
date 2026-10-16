const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
async function main(){
 const root=path.resolve(__dirname,'../dist');
 const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return}
 if(!path.extname(file))file=path.join(root,'index.html');
 const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.geojson':'application/json'};
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':(type[path.extname(file)]||'text/plain')+'; charset=utf-8'});res.end(err?'Not found':data)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Deterministically exercise the offline tile fallback; no public tile server dependency in tests.
 await page.route('**/tile.openstreetmap.org/**',route=>route.abort());
 await page.route('**/*.tile.openstreetmap.org/**',route=>route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.getByRole('button',{name:'Load Example Mission',exact:true}).click();
 await page.getByRole('button',{name:'Generate Recommendation',exact:true}).click();
 await page.locator('.mission-results').waitFor();
 assert.match(await page.locator('.mission-results h2').innerText(),/High Potential/); await page.screenshot({path:path.resolve(__dirname,'../screenshots/v2-mission.png'),fullPage:true});
 assert.match(await page.locator('.mission-metrics').first().innerText(),/53.2/);
 assert.equal(await page.locator('.mission-map path[stroke="#009c92"]').count(),1);
 await page.getByLabel('Cruise speed (km/h)',{exact:true}).fill('25');
 assert.match(await page.locator('.mission-metrics').first().innerText(),/23.6/);
 await page.getByLabel('Total handling (min)',{exact:true}).fill('60');
 assert.equal(await page.locator('.mission-results h2').innerText(),'Road Preferred');
 await page.getByLabel('One-way range limit (km)',{exact:true}).fill('1');
 assert.equal(await page.locator('.mission-results h2').innerText(),'Not Feasible Under Selected Constraints');
 await page.getByRole('button',{name:'Reset to Baseline',exact:true}).click();
 await page.getByLabel('Payload (kg)',{exact:true}).fill('4');
 assert.equal(await page.locator('.mission-results h2').innerText(),'Not Feasible Under Selected Constraints');
 await page.getByRole('button',{name:'Reset to Baseline',exact:true}).click();
 await page.getByLabel('Destination',{exact:true}).selectOption('HF001');
 await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/must be different/);
 await page.getByLabel('Destination',{exact:true}).selectOption('custom');
 await page.getByLabel('Latitude',{exact:true}).fill('21.6');await page.getByLabel('Longitude',{exact:true}).fill('103.3');
 assert.equal(await page.locator('.mission-results h2').innerText(),'Insufficient Data');
 assert.match(await page.locator('.mission-metrics').first().innerText(),/Unavailable/);
 await page.getByRole('button',{name:/02 Corridor Explorer/}).click();
 await page.locator('.corridor-list button').nth(1).click();
 const corridorTitle=await page.locator('.corridor-hero h2').innerText();
 await page.getByRole('button',{name:'Use as Mission Template',exact:true}).click();
 assert.equal(await page.getByLabel('Destination',{exact:true}).locator('option:checked').innerText(),corridorTitle);
 await page.getByRole('button',{name:'Generate Recommendation',exact:true}).click();
 await page.locator('.mission-results').waitFor();
 await page.getByLabel('Cruise speed (km/h)',{exact:true}).fill('40');
 const modified=await page.locator('.mission-metrics').first().innerText();
 await page.getByRole('button',{name:/05 Scenario Lab/}).click();
 assert.equal(await page.locator('.mission-metrics').first().innerText(),modified);
 await page.getByRole('heading',{name:'Baseline vs Modified Scenario',exact:true}).waitFor();
 await page.getByRole('button',{name:'VI',exact:true}).click();
 await page.getByRole('heading',{name:'Cơ sở so với kịch bản điều chỉnh',exact:true}).waitFor();
 await page.getByLabel('Tốc độ bay (km/h)',{exact:true}).fill('50');
 await page.getByRole('button',{name:'EN',exact:true}).click();
 await page.getByLabel('Cruise speed (km/h)',{exact:true}).waitFor(); assert.equal(await page.locator('.top-bar h1').innerText(),'Scenario Lab');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.resolve(__dirname,'../screenshots/v2-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1050});
 await page.screenshot({path:path.resolve(__dirname,'../screenshots/v2-scenario.png'),fullPage:true});
 await page.goto('http://127.0.0.1:'+server.address().port+'/mission');
 await page.getByRole('button',{name:'Generate Recommendation',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: mission submission, model/map updates, validation, range, payload, negative savings, missing data, templates, scenarios, EN/VI, responsive capture and SPA fallback; no browser exceptions.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
