export const defaults = { payloadKg: 2, capacityKg: 3, uavSpeedKmh: 50, handlingMinutes: 5, detourFactor: 1.1, maxRangeKm: 15, urgency: 'routine', cargoType: 'medicines' };
export function distance(a,b) {
 const r=Math.PI/180;
 return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2)));
}
export function corridorBaselineMetrics(corridor) {
 if(!corridor) return null;
 const straightLineDistanceKm=Number.isFinite(corridor.straight_distance_km)?corridor.straight_distance_km:null;
 const detourFactor=Number.isFinite(corridor.aerial_route_factor)?corridor.aerial_route_factor:defaults.detourFactor;
 const modeledFlightDistanceKm=Number.isFinite(corridor.candidate_aerial_distance_km)?corridor.candidate_aerial_distance_km:straightLineDistanceKm===null?null:straightLineDistanceKm*detourFactor;
 return {
  straightLineDistanceKm,
  modeledFlightDistanceKm,
  roadNetworkDistanceKm:Number.isFinite(corridor.road_distance_km)?corridor.road_distance_km:null,
  roadTimeMinutes:Number.isFinite(corridor.road_time_base_min)?corridor.road_time_base_min:null,
  uavTimeMinutes:Number.isFinite(corridor.uav_mission_time_base_min)?corridor.uav_mission_time_base_min:null,
  minutesSaved:Number.isFinite(corridor.time_saved_base_min)?corridor.time_saved_base_min:null,
  detourFactor
 };
}
export function calculateMission(request,corridors) {
 const q={...defaults,...request}, errors=[];
 for(const [key,min,max] of [['payloadKg',0.01,100],['capacityKg',0.01,100],['uavSpeedKmh',1,200],['handlingMinutes',0,240],['detourFactor',1,3],['maxRangeKm',0.1,500]]) if(!Number.isFinite(q[key])||q[key]<min||q[key]>max) errors.push(key);
 const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
 if(!valid(q.origin)||!valid(q.destination)) errors.push('coordinates');
 if(!['routine','priority','emergency'].includes(q.urgency)) errors.push('urgency');
 if(!['medicines','samples','emergency','vaccines'].includes(q.cargoType)) errors.push('cargoType');
 if(!errors.length&&distance(q.origin,q.destination)<0.001) errors.push('sameLocation');
 if(errors.length) return {errors};
 const c=corridors.find(c=>c.origin_id===q.origin.facility_id&&c.destination_id===q.destination.facility_id&&distance(q.origin,{lat:c.origin_lat,lon:c.origin_lon})<0.02&&distance(q.destination,{lat:c.destination_lat,lon:c.destination_lon})<0.02);
 const aerialDistanceKm=c&&Number.isFinite(c.straight_distance_km)&&c.straight_distance_km>0?c.straight_distance_km:distance(q.origin,q.destination);
 const flightDistanceKm=aerialDistanceKm*q.detourFactor, uavTimeMinutes=flightDistanceKm/q.uavSpeedKmh*60+q.handlingMinutes;
 const roadDistanceKm=c&&Number.isFinite(c.road_distance_km)&&c.road_distance_km>0?c.road_distance_km:null;
 const roadTimeMinutes=roadDistanceKm!==null&&Number.isFinite(c.road_time_base_min)&&c.road_time_base_min>0?c.road_time_base_min:null;
 const minutesSaved=roadTimeMinutes===null?null:roadTimeMinutes-uavTimeMinutes, violations=[];
 if(flightDistanceKm>q.maxRangeKm) violations.push('range');
 if(q.payloadKg>q.capacityKg) violations.push('payload');
 const evidence=c&&['medical_accessibility_need_score','flight_feasibility_score','operational_risk_score'].every(k=>Number.isFinite(c[k]));
 const recommendation=violations.length?'infeasible':!evidence||roadTimeMinutes===null?'insufficient':minutesSaved<=0?'road':c.final_classification_baseline==='LAUNCH'?'high':'conditional';
 return {errors:[],request:q,corridor:c??null,aerialDistanceKm,flightDistanceKm,uavTimeMinutes,roadDistanceKm,roadTimeMinutes,minutesSaved,percentageSaved:minutesSaved===null?null:minutesSaved/roadTimeMinutes*100,detourRatio:roadDistanceKm===null?null:roadDistanceKm/aerialDistanceKm,violations,recommendation,feasibilityStatus:violations.length?'failed':evidence?'screened':'unknown',mapGeometry:{uav:[[q.origin.lat,q.origin.lon],[q.destination.lat,q.destination.lon]],road:null},dataProvenance:c?.road_time_model_source??null};
}
