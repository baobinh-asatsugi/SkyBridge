import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateMission,defaults} from '../src/mission-engine.js';
const lines=fs.readFileSync(new URL('../public/data/final_corridor_priority_dataset_terrain_v2_ranked.csv',import.meta.url),'utf8').trim().split(/\r?\n/).map(l=>l.slice(1,-1).split('","'));
const corridors=lines.slice(1).map(row=>Object.fromEntries(lines[0].map((k,i)=>[k,row[i]!==''&&Number.isFinite(Number(row[i]))?Number(row[i]):row[i]])));
const c=corridors.find(c=>c.corridor_id==='HF001_HF004');
const request={...defaults,origin:{facility_id:c.origin_id,lat:c.origin_lat,lon:c.origin_lon},destination:{facility_id:c.destination_id,lat:c.destination_lat,lon:c.destination_lon}};
const run=patch=>calculateMission({...request,...patch},corridors);
test('A: source-backed baseline uses exact formula and existing road model',()=>{
 const r=run({}); assert.equal(r.roadTimeMinutes,53.2);assert.equal(r.uavTimeMinutes,7.04*1.1/50*60+5);assert.equal(r.recommendation,'high');assert.equal(r.mapGeometry.road,null);assert.equal(r.uavTimeMinutes.toFixed(1),'14.3');assert.equal(r.minutesSaved.toFixed(1),'38.9');
});
test('B: identical coordinates rejected even with different IDs',()=>assert.deepEqual(run({destination:{...request.origin,facility_id:'other'}}).errors,['sameLocation']));
test('C: speed sensitivity follows formula',()=>assert.equal(run({uavSpeedKmh:25}).uavTimeMinutes,(run({}).uavTimeMinutes-5)*2+5));
test('D: handling increases time and reduces savings',()=>{assert.equal(run({handlingMinutes:15}).uavTimeMinutes,run({}).uavTimeMinutes+10)});
test('E: range is applied to modeled flight distance',()=>{assert.equal(run({maxRangeKm:7.5}).recommendation,'infeasible');assert.deepEqual(run({maxRangeKm:7.5}).violations,['range'])});
test('F: payload hard limit and urgency cannot override it',()=>assert.equal(run({payloadKg:4,urgency:'emergency'}).recommendation,'infeasible'));
test('G: slow UAV returns negative savings and Road Preferred',()=>{const r=run({handlingMinutes:60});assert(r.minutesSaved<0);assert(r.percentageSaved<0);assert.equal(r.recommendation,'road')});
test('H: arbitrary coordinate never inherits unrelated evidence',()=>{const r=run({destination:{lat:21.6,lon:103.3}});assert.equal(r.recommendation,'insufficient');assert.equal(r.roadTimeMinutes,null);assert.equal(r.corridor,null)});
test('Spoofed facility ID with changed coordinates cannot inherit scores',()=>assert.equal(run({destination:{...request.destination,lat:22}}).corridor,null));
test('Reverse pair cannot inherit directional road estimate',()=>assert.equal(run({origin:request.destination,destination:request.origin}).roadDistanceKm,null));
test('Invalid and nonfinite parameters rejected',()=>{for(const p of [{payloadKg:0},{capacityKg:-1},{uavSpeedKmh:NaN},{detourFactor:0.9},{maxRangeKm:Infinity},{handlingMinutes:-1},{destination:{lat:91,lon:103}}])assert(run(p).errors.length)});
test('All source corridors preserve road data; baseline and scenario use shared engine',()=>{
 for(const c of corridors){const q={...defaults,origin:{facility_id:c.origin_id,lat:c.origin_lat,lon:c.origin_lon},destination:{facility_id:c.destination_id,lat:c.destination_lat,lon:c.destination_lon}};const r=calculateMission(q,corridors);assert.equal(r.roadTimeMinutes,c.road_time_base_min);const m=calculateMission({...q,uavSpeedKmh:40},corridors);assert(m.uavTimeMinutes>r.uavTimeMinutes);assert.deepEqual(calculateMission({...q,...defaults},corridors),r)}
});
test('Conditional outcome is reachable from existing corridor evidence',()=>{const c=corridors.find(c=>c.final_classification_baseline==='CONDITIONAL PILOT');assert(c);assert.equal(calculateMission({...defaults,maxRangeKm:100,origin:{facility_id:c.origin_id,lat:c.origin_lat,lon:c.origin_lon},destination:{facility_id:c.destination_id,lat:c.destination_lat,lon:c.destination_lon}},corridors).recommendation,'conditional')});
test('Missing road values remain null, never zero or invented',()=>{const r=calculateMission(request,[{...c,road_time_base_min:null}]);assert.equal(r.roadTimeMinutes,null);assert.equal(r.minutesSaved,null);assert.equal(r.recommendation,'insufficient')});
