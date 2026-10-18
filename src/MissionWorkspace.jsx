import React,{useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import {calculateMission,defaults} from './mission-engine.js';
import './mission.css';
const words={
 high:['UAV Candidate — High Potential','Ứng viên UAV — Tiềm năng cao'],
 conditional:['UAV Candidate — Conditional Pilot','Ứng viên UAV — Thí điểm có điều kiện'],
 road:['Road Preferred','Ưu tiên đường bộ'],
 infeasible:['Not Feasible Under Selected Constraints','Không khả thi với giới hạn đã chọn'],
 insufficient:['Insufficient Data','Không đủ dữ liệu'],
 range:['Modeled flight distance exceeds selected one-way range.','Quãng đường bay mô hình vượt tầm bay một chiều đã chọn.'],
 payload:['Payload exceeds selected aircraft capacity.','Tải trọng vượt sức chở UAV đã chọn.'],
 sameLocation:['Origin and destination must be different.','Điểm đi và điểm đến phải khác nhau.'],
 coordinates:['Select facilities or enter valid latitude and longitude.','Chọn cơ sở hoặc nhập vĩ độ và kinh độ hợp lệ.']
};
const fields=[
 ['payloadKg','Payload (kg)','Tải trọng (kg)',0.01,100,0.01],
 ['capacityKg','Payload capacity (kg)','Sức chở (kg)',0.01,100,0.01],
 ['uavSpeedKmh','Cruise speed (km/h)','Tốc độ bay (km/h)',1,200,1],
 ['handlingMinutes','Total handling (min)','Tổng thời gian xử lý (phút)',0,240,1],
 ['detourFactor','Flight detour factor','Hệ số vòng đường bay',1,3,0.01],
 ['maxRangeKm','One-way range limit (km)','Giới hạn tầm bay một chiều (km)',0.1,500,0.1]
];
export default function MissionWorkspace({data,selected,lang='en',draft,setDraft,setSelectedId,setScreen,scenario=false}) {
 const t=(en,vi)=>lang==='vi'?vi:en, w=k=>words[k]?.[lang==='vi'?1:0]??k;
 const template=c=>({...defaults,originId:c.origin_id,destinationId:c.destination_id,customLat:'',customLon:'',templateId:c.corridor_id});
 const [form,setForm]=useState(()=>draft?.templateId===selected.corridor_id?draft:template(selected));
 const [submitted,setSubmitted]=useState(false),[busy,setBusy]=useState(false),[pick,setPick]=useState(false);
 const [search,setSearch]=useState('');
 useEffect(()=>{setDraft(form)},[form,setDraft]);
 const origin=data.health.find(f=>f.facility_id===form.originId);
 const destination=form.destinationId==='custom'?{lat:form.customLat===''?NaN:Number(form.customLat),lon:form.customLon===''?NaN:Number(form.customLon),facility_name:t('Unverified map point','Điểm bản đồ chưa xác minh')}:data.health.find(f=>f.facility_id===form.destinationId);
 const request={...form,origin,destination};
 const result=calculateMission(request,data.corridors);
 const baseline=calculateMission({...request,...defaults},data.corridors);
 useEffect(()=>{if(result.corridor&&result.corridor.corridor_id!==selected.corridor_id)setSelectedId(result.corridor.corridor_id)},[result.corridor?.corridor_id,selected.corridor_id,setSelectedId]);
 const update=(key,value)=>setForm(f=>({...f,[key]:value}));
 const show=submitted||scenario;
 const submit=e=>{e.preventDefault();setBusy(true);setSubmitted(true);window.setTimeout(()=>setBusy(false),100)};
 const load=()=>{const example=data.corridors.find(c=>c.corridor_id==='HF001_HF004')??selected;setSelectedId(example.corridor_id);setForm(template(example));setSubmitted(false);};
 return <section className="mission-v2" data-native-language="true">
 <div className="mission-intro"><div><span className="eyebrow">MEDICAL UAV DECISION INTELLIGENCE</span><h2>{t('Where is a medical delivery needed?','Nhu cầu giao hàng y tế ở đâu?')}</h2><p>{t('Compare road access with a modeled UAV alternative, then review feasibility, evidence, and limitations.','So sánh tiếp cận đường bộ với phương án UAV mô hình, sau đó xem khả thi, bằng chứng và giới hạn.')}</p></div><button type="button" onClick={load}>{t('Load Example Mission','Tải nhiệm vụ mẫu')}</button></div>
 <div className="mission-layout">
 <form className="mission-form" onSubmit={submit}>
 <h3>{t('Mission Request','Yêu cầu nhiệm vụ')}</h3>
 <label>{t('Search facility names','Tìm tên cơ sở')}<input type="search" value={search} onChange={e=>setSearch(e.target.value)} /></label>
 {['originId','destinationId'].map((key,index)=><label key={key}>{index?t('Destination','Điểm đến'):t('Origin','Điểm xuất phát')}<select aria-label={index?t('Destination','Điểm đến'):t('Origin','Điểm xuất phát')} value={form[key]} onChange={e=>update(key,e.target.value)}>
 {data.health.filter(f=>f.facility_id===form[key]||f.facility_name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(f=><option key={f.facility_id} value={f.facility_id}>{f.facility_name}</option>)}
 {index===1&&<option value="custom">{t('Custom coordinates / map point','Tọa độ / điểm bản đồ')}</option>}
 </select></label>)}
 <button type="button" aria-pressed={pick} onClick={()=>setPick(!pick)}>{pick?t('Click the map to choose a destination','Nhấp bản đồ để chọn điểm đến'):t('Choose destination on map','Chọn điểm đến trên bản đồ')}</button>
 {form.destinationId==='custom'&&<div className="mission-fields">{[['customLat','Latitude','Vĩ độ',-90,90],['customLon','Longitude','Kinh độ',-180,180]].map(([key,en,vi,min,max])=><label key={key}>{t(en,vi)}<input type="number" required min={min} max={max} step="any" value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div>}
 <label>{t('Medical cargo','Hàng y tế')}<select value={form.cargoType} onChange={e=>update('cargoType',e.target.value)}>{[['medicines','Essential medicines','Thuốc thiết yếu'],['samples','Diagnostic samples','Mẫu xét nghiệm'],['emergency','Emergency supplies','Vật tư khẩn cấp'],['vaccines','Vaccines','Vắc xin']].map(([id,en,vi])=><option key={id} value={id}>{t(en,vi)}</option>)}</select></label>
 <label>{t('Urgency','Mức khẩn cấp')}<select value={form.urgency} onChange={e=>update('urgency',e.target.value)}>{[['routine','Routine','Thông thường'],['priority','Priority','Ưu tiên'],['emergency','Emergency','Khẩn cấp']].map(([id,en,vi])=><option key={id} value={id}>{t(en,vi)}</option>)}</select></label>
 <div className="mission-fields">{fields.map(([key,en,vi,min,max,step])=><label key={key}>{t(en,vi)}<input aria-label={t(en,vi)} type="number" required min={min} max={max} step={step} value={Number.isNaN(form[key])?'':form[key]} onChange={e=>update(key,e.target.value===''?NaN:Number(e.target.value))}/></label>)}</div>
 <p className="mission-note">{t('Aircraft limits are editable planning assumptions, not certified specifications. Weather and terrain scores remain inherited evidence.','Giới hạn UAV là giả định lập kế hoạch có thể sửa, không phải thông số được chứng nhận. Điểm thời tiết và địa hình là bằng chứng kế thừa.')}</p>
 <button className="mission-submit" disabled={busy}>{busy?t('Calculating…','Đang tính…'):t('Evaluate Mission','Đánh giá nhiệm vụ')}</button>
 <button type="button" onClick={()=>setForm(f=>({...f,...defaults}))}>{t('Reset to Baseline','Đặt lại cơ sở')}</button>
 </form>
 <div><MissionMap data={data} request={request} result={show&&!result.errors.length?result:null} pick={pick} onPick={p=>{setForm(f=>({...f,destinationId:'custom',customLat:p.lat.toFixed(6),customLon:p.lng.toFixed(6)}));setPick(false)}} lang={lang}/>
 <div className="mission-map-note">{t('Blue: origin · Orange: destination · Teal dashed: illustrative UAV path. Road geometry is unavailable in the supplied dataset; road estimates are shown numerically.','Xanh dương: điểm đi · Cam: điểm đến · Nét đứt xanh: đường UAV minh họa. Dữ liệu không có hình học tuyến đường bộ; chỉ hiển thị ước tính bằng số.')}</div>
 <p className="mission-note">{t('Facility coordinates have unverified source provenance. Map points are not validated operating sites. No live weather, telemetry, airspace approval or clinical performance validation.','Nguồn tọa độ cơ sở chưa được xác minh. Điểm bản đồ chưa phải vị trí vận hành được kiểm định. Không có thời tiết trực tiếp, giám sát bay, phê duyệt vùng trời hay xác nhận hiệu quả lâm sàng.')}</p>
 {show&&result.errors.length>0&&<div role="alert" className="mission-error">{result.errors.map(k=><p key={k}>{words[k]?w(k):t('Invalid value: ','Giá trị không hợp lệ: ')+(fields.find(f=>f[0]===k)?.[lang==='vi'?2:1]??k)}</p>)}</div>}
 {show&&!result.errors.length&&!busy&&<MissionResult result={result} baseline={baseline} t={t} w={w} scenario={scenario} setScreen={setScreen}/>}
 {!show&&<div className="mission-empty"><h3>{t('Your mission starts here','Nhiệm vụ bắt đầu tại đây')}</h3><p>{t('Select the endpoints and generate a recommendation. After submission, parameter changes update the results immediately.','Chọn điểm đi và đến rồi tạo khuyến nghị. Sau khi gửi, thay đổi tham số sẽ cập nhật kết quả ngay.')}</p></div>}
 </div></div></section>;
}
function MissionResult({result:r,baseline:b,t,w,scenario,setScreen}) {
 const fmt=(v,s='')=>v===null?t('Unavailable','Không có dữ liệu'):v.toFixed(1)+s;
 return <section className={'mission-results '+r.recommendation} aria-live="polite">
 <div className="recommendation-heading"><div><span className="eyebrow">{t('Planning recommendation','Khuyến nghị lập kế hoạch')}</span><h2>{w(r.recommendation)}</h2></div><span className={`constraint-chip ${r.feasibilityStatus}`}>{r.feasibilityStatus==='failed'?t('Constraints failed','Không đạt giới hạn'):r.feasibilityStatus==='unknown'?t('Evidence incomplete','Thiếu bằng chứng'):t('Numerical constraints pass','Đạt giới hạn số học')}</span></div>
 <div className="primary-mission-metrics">{[
 [t('Road travel time','Thời gian đường bộ'),r.roadTimeMinutes,' min'],
 [t('Modeled UAV Mission Time','Thời gian nhiệm vụ UAV mô hình'),r.uavTimeMinutes,' min'],
 [t('Potential time saved','Thời gian có thể tiết kiệm'),r.minutesSaved,' min']
 ].map(([label,value,unit])=><div key={label}><span>{label}</span><strong>{fmt(value,unit)}</strong></div>)}</div>
 <details className="secondary-metrics"><summary>{t('Distance and efficiency details','Chi tiết khoảng cách và hiệu quả')}</summary><div className="mission-metrics">{[
 [t('Road-network distance','Quãng đường mạng lưới đường bộ'),r.roadDistanceKm,' km'],
 [t('Straight-line geographic distance','Khoảng cách địa lý đường thẳng'),r.aerialDistanceKm,' km'],
 [t('Modeled flight distance','Quãng đường bay mô hình'),r.flightDistanceKm,' km'],
 [t('Time reduction','Giảm thời gian'),r.percentageSaved,' %'],
 [t('Road detour ratio','Tỷ lệ vòng đường bộ'),r.detourRatio,' ×']
 ].map(([label,value,unit])=><div key={label}><span>{label}</span><strong>{fmt(value,unit)}</strong></div>)}</div></details>
 <div className="constraint-summary"><strong>{t('Constraint & feasibility screen','Kiểm tra giới hạn và khả thi')}</strong><span>{r.feasibilityStatus==='failed'?t('Failed — review the violations below.','Không đạt — xem vi phạm bên dưới.'):r.feasibilityStatus==='unknown'?t('Supporting corridor evidence is incomplete.','Bằng chứng tuyến hỗ trợ chưa đầy đủ.'):t('Selected range and payload limits pass; operational review is still required.','Tầm bay và tải trọng đã chọn đạt; vẫn cần rà soát vận hành.')}</span></div><h3>{t('Why this recommendation?','Vì sao có khuyến nghị này?')}</h3>
 <ul><li>{r.minutesSaved===null?t('No matched road estimate is available; a comparative recommendation cannot be established.','Không có ước tính đường bộ phù hợp; chưa thể đưa ra khuyến nghị so sánh.'):r.minutesSaved>0?t('The selected UAV model is faster than the baseline road estimate.','Mô hình UAV đã chọn nhanh hơn ước tính đường bộ cơ sở.'):t('The selected UAV model is no faster than road transport.','Mô hình UAV đã chọn không nhanh hơn đường bộ.')}</li>
 <li>{r.violations.length?r.violations.map(k=>w(k)+(k==='range'?' ('+r.flightDistanceKm.toFixed(3)+' km > '+r.request.maxRangeKm+' km)':' ('+r.request.payloadKg+' kg > '+r.request.capacityKg+' kg)')).join(' '):t('Selected payload and one-way range limits pass the numerical screen; this does not establish safe flight.','Tải trọng và tầm bay một chiều vượt qua kiểm tra số học; điều này không xác nhận an toàn bay.')}</li>
 <li>{r.corridor?t('Exact facility-pair evidence is inherited from the terrain-v2 corridor dataset; urgency does not override constraints.','Bằng chứng đúng cặp cơ sở được kế thừa từ dữ liệu tuyến terrain-v2; mức khẩn cấp không ghi đè giới hạn.'):t('This location pair has no matching corridor evidence. Need, risk and feasibility scores are unavailable.','Cặp địa điểm không có bằng chứng tuyến phù hợp. Không có điểm nhu cầu, rủi ro và khả thi.')}</li></ul>
 <h3>{t('What would change this recommendation?','Điều gì sẽ thay đổi khuyến nghị?')}</h3>
 <p>{t('Try reducing range below','Thử giảm tầm bay dưới')} {fmt(r.flightDistanceKm,' km')}, {t('increasing payload above capacity, or increasing handling time. Break-even total handling time:','tăng tải trọng vượt sức chở hoặc tăng thời gian xử lý. Thời gian xử lý hòa vốn:')} {r.roadTimeMinutes===null?t('unavailable','không có dữ liệu'):fmt(r.roadTimeMinutes-r.flightDistanceKm/r.request.uavSpeedKmh*60,' min')}. {t('Urgency changes context only.','Mức khẩn cấp chỉ thay đổi bối cảnh.')}</p>
 <details className="limitations-details"><summary>{t('Limitations and provenance','Giới hạn và nguồn dữ liệu')}</summary><p>{t('Road figures are precomputed OSM-network model outputs, not current traffic. No road polyline is supplied. Terrain and climatological scores are not recomputed. Site verification, cargo compatibility and cold-chain requirements need operator review.','Số liệu đường bộ là kết quả mô hình mạng OSM tính sẵn, không phải giao thông hiện tại. Không có đường tuyến chi tiết. Điểm địa hình và khí hậu không được tính lại. Cần kiểm tra vị trí, tương thích hàng hóa và chuỗi lạnh.')}</p>
 {r.corridor&&<details><summary>{t('Inherited corridor intelligence and provenance','Thông tin tuyến kế thừa và nguồn dữ liệu')}</summary><p>{r.corridor.destination_name} · {t('Baseline rank','Hạng cơ sở')} #{r.corridor.rank_baseline}</p><div className="mission-metrics">{[['medical_accessibility_need_score','Healthcare need','Nhu cầu y tế'],['uav_benefit_score','UAV benefit','Lợi ích UAV'],['flight_feasibility_score','Flight feasibility','Khả thi bay'],['operational_risk_score','Operational risk','Rủi ro vận hành'],['priority_score_baseline','Priority','Ưu tiên']].map(([k,en,vi])=><div key={k}><span>{t(en,vi)}</span><strong>{r.corridor[k]?.toFixed(3)??'—'}</strong></div>)}</div><p>{t('All these scores and ranks are inherited, not recalculated for this mission. Baseline export UAV time:','Tất cả điểm và hạng được kế thừa, không tính lại cho nhiệm vụ. Thời gian UAV trong bản xuất cơ sở:')} {r.corridor.uav_mission_time_base_min} min. {t('Dynamic results use unrounded arithmetic; small rounding differences are expected.','Kết quả động dùng số học chưa làm tròn; có thể có chênh lệch nhỏ.')}</p><code>{r.dataProvenance}</code></details>}
 </details>
 {setScreen&&<div className="demo-actions"><span>{t('Guided demo next steps','Bước tiếp theo của bản trình diễn')}</span><button onClick={()=>setScreen('intelligence')}>{t('Open corridor prioritization','Mở ưu tiên tuyến')}</button><button onClick={()=>setScreen('scenario')}>{t('Test operational sensitivity','Thử độ nhạy vận hành')}</button></div>}
 {scenario&&<><h3>{t('Baseline vs Modified Scenario','Cơ sở so với kịch bản điều chỉnh')}</h3><div className="mission-table"><table><thead><tr><th>{t('Metric','Chỉ số')}</th><th>{t('Baseline','Cơ sở')}</th><th>{t('Modified','Điều chỉnh')}</th></tr></thead><tbody>{[['uavTimeMinutes',t('UAV time (min)','Thời gian UAV (phút)')],['minutesSaved',t('Minutes saved','Phút tiết kiệm')]].map(([k,label])=><tr key={k}><th>{label}</th><td>{fmt(b[k])}</td><td>{fmt(r[k])}</td></tr>)}<tr><th>{t('Recommendation','Khuyến nghị')}</th><td>{w(b.recommendation)}</td><td>{w(r.recommendation)}</td></tr><tr><th>{t('Constraint violations','Vi phạm giới hạn')}</th><td>{b.violations.map(w).join(' ')||'—'}</td><td>{r.violations.map(w).join(' ')||'—'}</td></tr></tbody></table></div></>}
 </section>;
}
function MissionMap({data,request,result,pick,onPick,lang}) {
 const host=useRef(),map=useRef(),layer=useRef(),callback=useRef(),[tilesFailed,setTilesFailed]=useState(false);
 callback.current={pick,onPick};
 useEffect(()=>{
 const m=L.map(host.current,{zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([21.52,103.23],11);map.current=m;
 const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(m);
 tiles.on('tileerror',()=>setTilesFailed(true));
 L.geoJSON(data.boundary,{style:{color:'#6f8999',weight:1,fillOpacity:0.02}}).addTo(m);
 layer.current=L.layerGroup().addTo(m);
 m.on('click',e=>{if(callback.current.pick)callback.current.onPick(e.latlng)});
 const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(host.current);
 return ()=>{resize.disconnect();m.remove()};
 },[data]);
 useEffect(()=>{
 const l=layer.current;if(!l)return;l.clearLayers();
 data.health.forEach(f=>{if(Number.isFinite(f.lat)&&Number.isFinite(f.lon)) {const tip=document.createElement('span');tip.textContent=f.facility_name;L.circleMarker([f.lat,f.lon],{radius:4,color:'#6f8999'}).bindTooltip(tip).addTo(l)}});
 const points=[];
 [request.origin,request.destination].forEach((p,i)=>{if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180){const tip=document.createElement('span');tip.textContent=p.facility_name;L.circleMarker([p.lat,p.lon],{radius:9,color:i?'#e98b32':'#2479c2',fillOpacity:1}).bindTooltip(tip).addTo(l);points.push([p.lat,p.lon])}});
 if(result){L.polyline(result.mapGeometry.uav,{color:'#009c92',dashArray:'8 8',weight:3}).bindTooltip((lang==='vi'?'UAV mô hình: ':'Modeled UAV: ')+result.flightDistanceKm.toFixed(1)+' km · '+result.uavTimeMinutes.toFixed(1)+' min').addTo(l)}
 if(points.length===2)map.current.fitBounds(points,{padding:[45,45],maxZoom:13,animate:false});
 },[data,request.origin?.lat,request.origin?.lon,request.destination?.lat,request.destination?.lon,result?.uavTimeMinutes,lang]);
 return <div className="mission-map-wrap"><div className="mission-map" ref={host} aria-label={lang==='vi'?'Bản đồ nhiệm vụ':'Mission map'}/>{tilesFailed&&<p role="status">{lang==='vi'?'Không tải được bản đồ nền. Điểm và đường mô hình vẫn hiển thị.':'Basemap service unavailable. Facility points and modeled path remain visible.'}</p>}</div>;
}

export function MissionMethodology({lang='en'}) {
 const t=(en,vi)=>lang==='vi'?vi:en;
 return <section data-native-language="true">
 <h3>{t('V3 dynamic mission model','Mô hình nhiệm vụ động V3')}</h3>
 <p>{t('UAV minutes = straight-line km × detour factor ÷ cruise km/h × 60 + total handling minutes. Baseline: 1.10, 50 km/h and 5 min. Range checks use modeled flight distance, not straight-line distance.','Phút UAV = km đường chim bay × hệ số vòng ÷ tốc độ km/h × 60 + tổng phút xử lý. Cơ sở: 1,10; 50 km/h; 5 phút. Kiểm tra tầm bay dùng quãng đường bay mô hình.')}</p>
 <p>{t('Road figures are inherited OSM network model outputs for the exact directional facility pair. Network edge speeds and processing code are absent, so road time cannot be independently reproduced here. Other pairs return unavailable road estimates.','Số liệu đường bộ được kế thừa từ mô hình mạng OSM cho đúng cặp cơ sở có hướng. Không có tốc độ cạnh mạng và mã xử lý để tái tạo thời gian đường bộ. Các cặp khác không có ước tính.')}</p>
 <p>{t('Healthcare need = 0.60 × normalized operational access gap + 0.40 × normalized proportional 2023 population. UAV benefit = 0.50 × normalized percentage saved + 0.30 × normalized minutes saved + 0.20 × normalized detour ratio. These exported scores are not dynamically renormalized.','Nhu cầu y tế = 0,60 × khoảng trống tiếp cận chuẩn hóa + 0,40 × dân số 2023 phân bổ tỷ lệ chuẩn hóa. Lợi ích UAV = 0,50 × tỷ lệ tiết kiệm chuẩn hóa + 0,30 × phút tiết kiệm chuẩn hóa + 0,20 × tỷ lệ vòng đường chuẩn hóa. Điểm xuất sẵn không được chuẩn hóa lại động.')}</p>
 <p>{t('Feasibility, operational risk and priority weights are inherited from the terrain-v2 export. The full weighting pipeline is absent; V3 introduces no replacement scoring weights. Earlier exports remain in the data folder and can differ in terrain feasibility and rank.','Khả thi, rủi ro vận hành và trọng số ưu tiên được kế thừa từ bản xuất terrain-v2. Không có đầy đủ quy trình tính trọng số; V3 không đưa ra trọng số thay thế. Bản xuất cũ được giữ trong thư mục dữ liệu và có thể khác về khả thi địa hình và hạng.')}</p>
 <p>{t('Provenance: facility/geographic source records → precomputed road and corridor models → dynamically calculated UAV times and constraint checks → user-entered aircraft assumptions. Exact facility IDs plus coordinates within 20 m are required to inherit corridor evidence. Arbitrary points never inherit healthcare need.','Nguồn dữ liệu: cơ sở/địa lý → mô hình đường bộ và tuyến tính sẵn → thời gian UAV và kiểm tra giới hạn tính động → giả định UAV do người dùng nhập. Cần đúng mã cơ sở và tọa độ trong 20 m để kế thừa bằng chứng tuyến. Điểm tùy chọn không kế thừa nhu cầu y tế.')}</p>
 <p>{t('Decision policy: violated constraints → infeasible; missing evidence → insufficient data; no time benefit → road; positive benefit plus baseline LAUNCH → high potential; otherwise conditional pilot. These are proposed planning rules, not flight approval or clinical validation.','Quy tắc: vi phạm giới hạn → không khả thi; thiếu bằng chứng → không đủ dữ liệu; không lợi thời gian → đường bộ; có lợi và cơ sở LAUNCH → tiềm năng cao; còn lại thí điểm có điều kiện. Đây là quy tắc lập kế hoạch đề xuất, không phải phê duyệt bay hay xác nhận lâm sàng.')}</p>
 </section>;
}
