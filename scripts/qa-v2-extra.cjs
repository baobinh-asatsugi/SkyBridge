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
 await page.getByRole('button',{name:'Choose destination on map',exact:true}).click();
 await page.locator('.mission-map').click({position:{x:250,y:220}});
 assert.equal(await page.getByLabel('Destination',{exact:true}).inputValue(),'custom');
 await page.getByRole('button',{name:'Generate Recommendation',exact:true}).click();
 await page.locator('.mission-results').waitFor();
 assert.match(await page.locator('.mission-metrics').first().innerText(),/Unavailable/);
 await page.getByText('Basemap service unavailable. Facility points and modeled path remain visible.',{exact:true}).waitFor();
 await page.getByLabel('Latitude',{exact:true}).fill('91');
 assert.equal(await page.getByLabel('Latitude',{exact:true}).evaluate(e=>e.validity.valid),false);
 await page.getByRole('button',{name:'Load Example Mission',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile Mission Control overflows viewport');
 const failure=await browser.newPage();
 await failure.route('**/data/final_corridor_priority_dataset_terrain_v2_ranked.csv',r=>r.fulfill({status:503,body:'Unavailable'}));
 await failure.goto('http://127.0.0.1:'+server.address().port);
 await failure.locator('.loader.error').waitFor();
 assert.match(await failure.locator('.loader.error').innerText(),/Dataset unavailable/);
 await failure.close();
 assert.deepEqual(errors,[]);
 console.log('PASS: map destination selection, unavailable basemap, invalid coordinates, mobile width and unavailable dataset.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
