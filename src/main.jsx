import MissionWorkspace, { MissionMethodology } from './MissionWorkspace.jsx';
import { calculateMission, corridorBaselineMetrics, defaults } from './mission-engine.js';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, BarChart3, CalendarDays, CheckCircle2, ChevronsUpDown, CloudRain, Compass, Gauge, GitCompare, HelpCircle, Info, Layers, MapPinned, Plane, RotateCcw, Search, ShieldAlert, SlidersHorizontal, Stethoscope, Table2, Wind } from "lucide-react";
import "./styles.css";

const DATA = {
  corridors: "/data/final_corridor_priority_dataset_terrain_v2_ranked.csv",
  scenarios: "/data/scenario_sensitivity_analysis.csv",
  weather: "/data/weather_risk_monthly.csv",
  health: "/data/health_facilities_clean.csv",
  communes: "/data/commune_master.csv",
  access: "/data/access_gap_commune_ranking_v5_population_2023_proportional.csv",
  uav: "/data/uav_specification_assumptions.csv",
  boundary: "/data/muong_ang_boundary.geojson",
  communeBoundaries: "/data/muong_ang_communes.geojson"
};

const navItems = [
  ["decision", "01", "Decision Workspace", MapPinned],
  ["intelligence", "02", "Corridor Intelligence", GitCompare],
  ["scenario", "03", "Scenario Studio", SlidersHorizontal],
  ["evidence", "04", "Evidence & Methodology", Info]
];

const classificationColors = {
  LAUNCH: "#00A89D",
  "CONDITIONAL PILOT": "#E5A11A",
  "PHASE 2": "#3278B8",
  HOLD: "#A34B57"
};

const pageMeta = {
  decision: ["Decision Workspace", "Define a medical delivery and generate an explainable planning recommendation."],
  intelligence: ["Corridor Intelligence", "Rank, compare, and inspect healthcare corridors using the established evidence model."],
  evidence: ["Evidence & Methodology", "Trace the data, assumptions, seasonal context, policy evidence, and limitations."],
  mission: ["Mission Control", "Create a medical mission and compare road and UAV options."],
  explorer: ["Corridor Explorer", "Compare road access with modeled UAV alternatives."],
  priority: ["Prioritization", "Identify high-need corridors with viable preliminary flight conditions."],
  planner: ["Mission Planner", "Screen a candidate healthcare delivery mission."],
  scenario: ["Scenario Studio", "Test operational assumptions and established strategic ranking scenarios."],
  seasonal: ["Seasonal Readiness", "Identify lower- and higher-friction planning periods using historical climatological context."]
};

const contextScreens = new Set(["intelligence", "scenario", "evidence"]);
const priorityScoreTooltip = "Composite screening score combining healthcare need, UAV benefit, flight feasibility, and operational risk under the displayed decision scenario. Scores are inherited; the complete weighting pipeline is not supplied.";

const scenarioFields = {
  Baseline: "rank_baseline",
  "Equity First": "rank_equity_first",
  "Efficiency First": "rank_efficiency_first",
  "Safety First": "rank_safety_first"
};
const scenarioMetadata = {
  Baseline: { objective: "Reference research prioritization used for the published baseline.", source: "terrain-v2 export: priority_score_baseline and rank_baseline", cue: "No rank movement; component scores provide the reference context." },
  "Equity First": { objective: "Explore greater emphasis on equitable healthcare access.", source: "terrain-v2 export: priority_score_equity_first and rank_equity_first", cue: "Healthcare-need scores may help interpret movement, but the absent weighting pipeline prevents causal attribution." },
  "Efficiency First": { objective: "Explore greater emphasis on modeled transport benefit.", source: "terrain-v2 export: priority_score_efficiency_first and rank_efficiency_first", cue: "UAV-benefit scores may help interpret movement, but exported ranks—not UI recomputation—determine the result." },
  "Safety First": { objective: "Explore greater emphasis on preliminary deployment conditions.", source: "terrain-v2 export: priority_score_safety_first and rank_safety_first", cue: "Flight-feasibility and operational-risk scores may help interpret movement; their exact scenario weights are unavailable." }
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const LANG_STORAGE_KEY = "skybridge-language";

const viExact = { "Use as Mission Template": "Dùng làm mẫu nhiệm vụ", "Create a medical mission and compare road and UAV options.": "Tạo nhiệm vụ y tế và so sánh đường bộ với UAV",
  "Mission Control": "Trung tâm Điều phối",
  "Corridor Explorer": "Phân tích Tuyến",
  "Prioritization": "Xếp hạng Ưu tiên",
  "Mission Planner": "Lập kế hoạch Nhiệm vụ",
  "Scenario Lab": "Phân tích Kịch bản",
  "Seasonal Readiness": "Mức độ Sẵn sàng theo Mùa",
  "Healthcare UAV screening": "Sàng lọc UAV y tế",
  "Planning Prototype": "Nguyên mẫu lập kế hoạch",
  "Loading verified SkyBridge data...": "Đang tải dữ liệu SkyBridge đã kiểm tra...",
  "Selected corridor": "Tuyến đã chọn",
  "Methodology / Data Notes": "Phương pháp / Ghi chú dữ liệu",
  "RECOMMENDED FOR PILOT REVIEW": "ĐỀ XUẤT RÀ SOÁT THÍ ĐIỂM",
  "REQUIRES CONDITIONAL PILOT REVIEW": "CẦN RÀ SOÁT THÍ ĐIỂM CÓ ĐIỀU KIỆN",
  "DEFER TO PHASE 2": "CHUYỂN SANG GIAI ĐOẠN 2",
  "NOT CURRENTLY PRIORITIZED": "CHƯA ƯU TIÊN HIỆN TẠI",
  "PILOT CANDIDATE": "Ứng viên Thí điểm",
  "PILOT CANDIDATE FOR REVIEW": "ỨNG VIÊN RÀ SOÁT THÍ ĐIỂM",
  "CONDITIONAL PILOT": "Thí điểm Có điều kiện",
  "CONDITIONAL": "CÓ ĐIỀU KIỆN",
  "PHASE 2": "Giai đoạn 2",
  "HOLD": "Tạm hoãn",
  "Candidate Corridors": "Tuyến ứng viên",
  "Pilot Candidates": "Ứng viên thí điểm",
  "Robust Top-3": "Top 3 ổn định",
  "Maximum Minutes Saved": "Số phút tiết kiệm tối đa",
  "Save up to": "Tiết kiệm tối đa",
  "Why this recommendation?": "Vì sao khuyến nghị này?",
  "Explore corridor": "Phân tích tuyến",
  "Search corridor": "Tìm tuyến",
  "Why air changes the access picture": "Vì sao tuyến bay cải thiện tiếp cận",
  "Modeled road detour versus direct UAV path": "Mức vòng đường bộ so với tuyến UAV trực tiếp",
  "Road detour": "Mức vòng đường bộ",
  "Direct air path": "Tuyến bay trực tiếp",
  "Time benefit": "Lợi ích thời gian",
  "View prioritization": "Xem xếp hạng ưu tiên",
  "Road distance": "Quãng đường bộ",
  "Aerial distance": "Khoảng cách đường không",
  "Road time": "Thời gian đường bộ",
  "UAV mission time": "Thời gian nhiệm vụ UAV",
  "Healthcare Accessibility Need": "Nhu cầu Tiếp cận Y tế",
  "Flight Feasibility": "Khả năng Thực hiện Chuyến bay",
  "Need x Flight Feasibility": "Nhu cầu x Khả năng Thực hiện Chuyến bay",
  "Decision intelligence": "Thông tin ra quyết định",
  "HIGHEST NEED != HIGHEST DEPLOYMENT PRIORITY": "NHU CẦU CAO NHẤT KHÔNG LUÔN LÀ ƯU TIÊN TRIỂN KHAI CAO NHẤT",
  "Plan mission": "Lập kế hoạch nhiệm vụ",
  "PILOT PRIORITY": "ƯU TIÊN THÍ ĐIỂM",
  "HIGH NEED / REQUIRES FEASIBILITY REVIEW": "NHU CẦU CAO / CẦN RÀ SOÁT KHẢ THI",
  "PHASE 2 OPPORTUNITY": "CƠ HỘI GIAI ĐOẠN 2",
  "LOWER IMMEDIATE PRIORITY": "ƯU TIÊN TRƯỚC MẮT THẤP HƠN",
  "Ranked Corridors": "Xếp hạng tuyến",
  "Rank": "Hạng",
  "Destination": "Điểm đến",
  "Need": "Nhu cầu",
  "Feas.": "Khả thi",
  "Priority": "Ưu tiên",
  "Priority score": "Điểm Ưu tiên",
  "Healthcare need": "Nhu cầu y tế",
  "UAV benefit": "Lợi ích UAV",
  "UAV Benefit": "Lợi ích UAV",
  "UAV BENEFIT": "LỢI ÍCH UAV",
  "Flight feasibility": "Khả năng Thực hiện Chuyến bay",
  "Operational risk": "Rủi ro Vận hành",
  "Scenario robustness": "Độ ổn định qua Kịch bản",
  "Define mission": "Xác định nhiệm vụ",
  "Planning inputs": "Thông tin lập kế hoạch",
  "Select origin": "Chọn điểm xuất phát",
  "Select destination corridor": "Chọn tuyến đích",
  "Select mission type": "Chọn loại nhiệm vụ",
  "Planning month": "Tháng lập kế hoạch",
  "Payload reference": "Tải trọng tham chiếu",
  "Planning context": "Bối cảnh lập kế hoạch",
  "Preliminary mission screening": "Sàng lọc nhiệm vụ sơ bộ",
  "Mission": "Nhiệm vụ",
  "Mission type": "Loại nhiệm vụ",
  "Payload input": "Tải trọng nhập",
  "Performance": "Hiệu năng",
  "Road ETA": "ETA đường bộ",
  "UAV ETA": "ETA UAV",
  "Time saved": "Thời gian tiết kiệm",
  "Detour ratio": "Tỷ lệ vòng đường",
  "Seasonal context": "Bối cảnh theo mùa",
  "Review corridor details": "Rà soát chi tiết tuyến",
  "Review seasonal context": "Xem bối cảnh theo mùa",
  "Detailed Review": "Rà soát chi tiết",
  "PLANNING ASSESSMENT ONLY": "CHỈ ĐÁNH GIÁ LẬP KẾ HOẠCH",
  "Modeled performance": "Hiệu năng mô hình hóa",
  "Seasonal overlay": "Lớp bối cảnh theo mùa",
  "Required before field operation": "Cần hoàn tất trước vận hành thực địa",
  "Operator verification": "Xác minh bởi đơn vị vận hành",
  "Current weather verification": "Xác minh thời tiết hiện tại",
  "Airspace / applicable authorization review": "Rà soát vùng trời / phê duyệt liên quan",
  "Aircraft and payload compatibility": "Tương thích UAV và tải trọng",
  "Applicable aviation procedures": "Quy trình hàng không áp dụng",
  "ACROSS ALL FOUR SCENARIOS": "TRÊN CẢ BỐN KỊCH BẢN",
  "Decision robustness": "Độ ổn định quyết định",
  "What changed?": "Điều gì thay đổi?",
  "Scenario sensitivity": "Độ nhạy kịch bản",
  "ROBUST TOP-3": "TOP 3 ỔN ĐỊNH",
  "Rank movement": "Dịch chuyển hạng",
  "Plan selected corridor": "Lập kế hoạch tuyến đã chọn",
  "Corridor": "Tuyến",
  "Best planning context": "Bối cảnh lập kế hoạch tốt nhất",
  "Higher seasonal caution": "Mức thận trọng cao",
  "Healthcare Need": "Nhu cầu y tế",
  "Corridor Terrain Feasibility": "Khả thi Địa hình Tuyến",
  "Baseline Operational Risk": "Rủi ro vận hành cơ sở",
  "Baseline Recommendation": "Khuyến nghị cơ sở",
  "Lower-friction planning window": "Giai đoạn lập kế hoạch ít cản trở",
  "Highest seasonal caution": "Mức thận trọng theo mùa cao nhất",
  "Selected corridor baseline status": "Trạng thái cơ sở của tuyến đã chọn",
  "Seasonal planning context": "Bối cảnh lập kế hoạch theo mùa",
  "12-month readiness overlay": "Lớp sẵn sàng 12 tháng",
  "Precipitation": "Lượng mưa",
  "Wind": "Gió",
  "Temperature": "Nhiệt độ",
  "How to read this overlay": "Cách đọc lớp bối cảnh này",
  "Why this month?": "Vì sao tháng này?",
  "Selected month decision context": "Bối cảnh quyết định của tháng đã chọn",
  "Planning Context": "Bối cảnh lập kế hoạch",
  "Mean monthly precipitation": "Lượng mưa TB tháng",
  "Mean wind speed": "Tốc độ gió TB",
  "Mean temperature": "Nhiệt độ TB",
  "Monthly weather risk": "Rủi ro thời tiết tháng",
  "Why this matters": "Vì sao quan trọng",
  "Baseline corridor status": "Trạng thái cơ sở của tuyến",
  "Selected month planning overlay": "Lớp bối cảnh tháng đã chọn",
  "Planning interpretation": "Diễn giải lập kế hoạch",
  "Return to Mission Planner": "Quay lại Lập kế hoạch Nhiệm vụ",
  "Data lineage": "Dòng dữ liệu",
  "Source data": "Dữ liệu nguồn",
  "Modeled metrics": "Chỉ số mô hình hóa",
  "Derived scores": "Điểm số dẫn xuất",
  "Decision screening": "Sàng lọc quyết định",
  "Road network": "Mạng lưới đường bộ",
  "Population": "Dân số",
  "Weather": "Thời tiết",
  "Operational assumptions": "Giả định vận hành",
  "Limitations": "Giới hạn",
  "Verified key finding": "Kết quả chính đã kiểm tra",
  "Close": "Đóng",
  "Baseline": "Cơ sở",
  "Equity First": "Ưu tiên Công bằng",
  "Efficiency First": "Ưu tiên Hiệu quả",
  "Safety First": "Ưu tiên An toàn",
  "Equity": "Công bằng",
  "Efficiency": "Hiệu quả",
  "Safety": "An toàn",
  "Essential medicines": "Thuốc thiết yếu",
  "Diagnostic samples": "Mẫu xét nghiệm",
  "Emergency supplies": "Vật tư khẩn cấp",
  "Lower caution": "Mức thận trọng thấp",
  "Moderate caution": "Mức thận trọng trung bình",
  "Higher caution": "Mức thận trọng cao",
  "Lower climatological friction": "Cản trở khí hậu thấp hơn",
  "Moderate seasonal caution": "Mức thận trọng theo mùa trung bình",
  "Very high": "Rất cao",
  "High": "Cao",
  "Moderate / elevated": "Trung bình / tăng",
  "Moderate": "Trung bình",
  "Managed": "Có thể kiểm soát",
  "Lower": "Thấp hơn",
  "Limited": "Hạn chế",
  "Low": "Thấp",
  "n/a": "không có",
  "min": "phút",
  "minutes": "phút",
  "no move": "không đổi",
  "UAV origin": "Điểm xuất phát UAV",
  "Commune boundary": "Ranh giới xã",
  "Administrative area": "Đơn vị hành chính"
};

const viReplacements = [
  [/Screen corridor priorities and identify candidates for UAV pilot review\./g, "Sàng lọc mức ưu tiên tuyến và xác định ứng viên rà soát thí điểm UAV."],
  [/Compare road access with modeled UAV alternatives\./g, "So sánh tiếp cận đường bộ với phương án UAV mô hình hóa."],
  [/Identify high-need corridors with viable preliminary flight conditions\./g, "Xác định các tuyến nhu cầu cao có điều kiện bay sơ bộ phù hợp."],
  [/Screen a candidate healthcare delivery mission\./g, "Sàng lọc một nhiệm vụ vận chuyển y tế ứng viên."],
  [/Test whether corridor priorities remain stable under different decision objectives\./g, "Kiểm tra độ ổn định ưu tiên tuyến theo các mục tiêu quyết định khác nhau."],
  [/Identify lower- and higher-friction planning periods using historical climatological context\./g, "Xác định giai đoạn lập kế hoạch thuận lợi hơn hoặc cần thận trọng hơn từ bối cảnh khí hậu lịch sử."],
  [/Candidate direct UAV links, facility points, district outline, and GADM ADM3 commune boundaries\. Road ETAs are modeled, but route polylines are not available in the loaded data\./g, "Liên kết UAV trực tiếp ứng viên, điểm cơ sở y tế, ranh giới huyện và ranh giới xã GADM ADM3. ETA đường bộ là mô hình hóa; dữ liệu hiện có không có đường tuyến chi tiết."],
  [/Road ([\d.,]+) min to UAV ([\d.,]+) min/g, "Đường bộ $1 phút; UAV $2 phút"],
  [/([\d.,]+) min saved/g, "tiết kiệm $1 phút"],
  [/([\d.,]+)% reduction in modeled travel time/g, "giảm $1% thời gian di chuyển mô hình hóa"],
  [/([A-Za-zÀ-ỹ0-9]+) adds (.+); baseline corridor priority remains unchanged\. Seasonal readiness is a climatological planning overlay, not a recalculation of baseline corridor priority\./g, "$1 có $2; ưu tiên tuyến cơ sở không đổi. Mức sẵn sàng theo mùa là lớp bối cảnh khí hậu, không phải tính lại ưu tiên cơ sở."],
  [/baseline corridor priority remains unchanged\. Seasonal readiness is a climatological planning overlay, not a recalculation of baseline corridor priority\./g, "ưu tiên tuyến cơ sở không đổi. Mức sẵn sàng theo mùa là lớp bối cảnh khí hậu, không phải tính lại ưu tiên cơ sở."],
  [/Preliminary screening only\. Requires operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures\./g, "Chỉ là sàng lọc sơ bộ. Cần xác minh vận hành, thời tiết hiện tại, vùng trời, tình trạng UAV và quy trình hàng không áp dụng."],
  [/Prototype decision support only\. Final field operation requires operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures\./g, "Chỉ hỗ trợ quyết định ở mức nguyên mẫu. Vận hành thực địa cần xác minh vận hành, thời tiết hiện tại, vùng trời, tình trạng UAV và quy trình hàng không áp dụng."],
  [/Evidence-based screening, not operational authorization\./g, "Sàng lọc dựa trên bằng chứng, không phải phê duyệt vận hành."],
  [/Preliminary screening from modeled logistics metrics and climatological context\./g, "Sàng lọc sơ bộ từ chỉ số logistics mô hình hóa và bối cảnh khí hậu."],
  [/kg, recorded for planning context; not used in the current performance model/g, "kg, ghi nhận cho bối cảnh lập kế hoạch; chưa dùng trong mô hình hiệu năng hiện tại"],
  [/Access gap plus population component/g, "Khoảng trống tiếp cận và thành phần dân số"],
  [/Time saved, percentage saved, and detour ratio/g, "Thời gian tiết kiệm, tỷ lệ tiết kiệm và mức vòng đường"],
  [/Corridor terrain feasibility from corrected slope and a 500 m aerial-corridor buffer/g, "Khả thi địa hình tuyến từ độ dốc đã hiệu chỉnh và vùng đệm tuyến bay 500 m"],
  [/Distance, terrain, and climatological risk context/g, "Khoảng cách, địa hình và rủi ro khí hậu"],
  [/Baseline weighted score/g, "Điểm trọng số cơ sở"],
  [/Robust Top-3/g, "Top 3 ổn định"],
  [/Composite screening score combining healthcare need, UAV benefit, flight feasibility, and operational risk under the displayed decision scenario\. Weights are embedded in the supplied scenario score fields\./g, "Điểm sàng lọc tổng hợp từ nhu cầu y tế, lợi ích UAV, khả năng thực hiện chuyến bay và rủi ro vận hành theo kịch bản đang hiển thị. Trọng số nằm trong các trường điểm kịch bản đã cung cấp."],
  [/Road distance is modeled from available network analysis, but no route polyline is available\./g, "Quãng đường bộ được mô hình hóa từ phân tích mạng lưới; chưa có đường tuyến chi tiết."],
  [/Candidate aerial distance applies the project aerial route factor\./g, "Khoảng cách đường không áp dụng hệ số tuyến bay của dự án."],
  [/Modeled road travel time from project routing assumptions\./g, "Thời gian đường bộ mô hình hóa theo giả định định tuyến của dự án."],
  [/Modeled UAV mission time using the project base cruise speed and fixed mission time\./g, "Thời gian nhiệm vụ UAV mô hình hóa theo tốc độ bay hành trình cơ sở và thời gian cố định của dự án."],
  [/Road distance relative to direct path/g, "Quãng đường bộ so với tuyến trực tiếp"],
  [/Modeled direct UAV path/g, "Tuyến UAV trực tiếp mô hình hóa"],
  [/modeled reduction/g, "giảm theo mô hình"],
  [/Prioritization balances healthcare need, UAV benefit, flight feasibility, and operational risk using the project methodology\./g, "Xếp hạng ưu tiên cân bằng nhu cầu y tế, lợi ích UAV, khả năng thực hiện chuyến bay và rủi ro vận hành theo phương pháp dự án."],
  [/Rank #(\d+)/g, "Hạng #$1"],
  [/Recommendation class/g, "Nhóm khuyến nghị"],
  [/Healthcare need/g, "Nhu cầu y tế"],
  [/Flight feasibility/g, "Khả năng thực hiện chuyến bay"],
  [/Priority score/g, "Điểm ưu tiên"],
  [/Destination/g, "Điểm đến"],
  [/Origin/g, "Điểm xuất phát"],
  [/Payload/g, "Tải trọng"],
  [/Planning month/g, "Tháng lập kế hoạch"],
  [/Context/g, "Bối cảnh"],
  [/Weather risk/g, "Rủi ro thời tiết"],
  [/Priority impact/g, "Tác động đến ưu tiên"],
  [/No baseline score change/g, "Không đổi điểm cơ sở"],
  [/This review packages the existing screening evidence for human assessment\. It is not operational authorization\./g, "Bản rà soát này tổng hợp bằng chứng sàng lọc hiện có để con người đánh giá. Đây không phải phê duyệt vận hành."],
  [/corridors remain Top-3/g, "tuyến giữ Top 3"],
  [/Top-3 in 4\/4 scenarios/g, "Top 3 trong 4/4 kịch bản"],
  [/across all four scenarios/g, "trên cả bốn kịch bản"],
  [/screened origin-destination links/g, "liên kết xuất phát-đích đã sàng lọc"],
  [/baseline classification/g, "phân loại cơ sở"],
  [/modeled estimate/g, "ước tính mô hình hóa"],
  [/up (\d+)/g, "tăng $1"],
  [/down (\d+)/g, "giảm $1"],
  [/Best planning context: ([^·]+) · Higher seasonal caution: (.+)/g, "Bối cảnh thuận lợi nhất: $1 · Cần thận trọng cao: $2"],
  [/Best planning context:/g, "Bối cảnh thuận lợi nhất:"],
  [/Higher seasonal caution:/g, "Cần thận trọng cao:"],
  [/Seasonal readiness supplements corridor prioritization; it does not change the baseline priority score or determine flight safety\./g, "Mức sẵn sàng theo mùa bổ sung cho xếp hạng tuyến; không đổi điểm ưu tiên cơ sở và không xác định an toàn bay."],
  [/Lowest relative monthly weather-risk group in the loaded climatology\./g, "Nhóm rủi ro thời tiết tháng thấp nhất trong dữ liệu khí hậu đã tải."],
  [/is the wettest month in the source data; wetter-season months increase planning friction\./g, "là tháng mưa nhiều nhất trong dữ liệu nguồn; các tháng mùa mưa làm tăng cản trở lập kế hoạch."],
  [/remains rank #(\d+); seasonal readiness is an overlay, not a recalculation\./g, "giữ hạng #$1; mức sẵn sàng theo mùa là lớp bối cảnh, không phải tính lại."],
  [/remains Hạng #(\d+); seasonal readiness is an overlay, not a recalculation\./g, "giữ hạng #$1; mức sẵn sàng theo mùa là lớp bối cảnh, không phải tính lại."],
  [/remains rank #(\d+);/g, "giữ hạng #$1;"],
  [/seasonal readiness is an overlay, not a recalculation\./g, "mức sẵn sàng theo mùa là lớp bối cảnh, không phải tính lại."],
  [/Month categories use the loaded monthly weather-risk score as a relative annual planning context: the lowest-risk group is labeled lower friction, the highest-risk group is labeled higher seasonal caution, and the remaining months are moderate\. These labels do not alter the corridor priority score or determine flight safety\./g, "Nhóm tháng dùng điểm rủi ro thời tiết tháng làm bối cảnh tương đối trong năm: nhóm thấp nhất là ít cản trở, nhóm cao nhất là cần thận trọng hơn, các tháng còn lại ở mức trung bình. Các nhãn này không đổi điểm ưu tiên tuyến và không xác định an toàn bay."],
  [/Rainfall is the dominant source of additional seasonal caution this month; current-weather verification remains required before any field operation\./g, "Mưa là nguồn thận trọng theo mùa chính trong tháng này; vẫn cần xác minh thời tiết hiện tại trước mọi vận hành thực địa."],
  [/Wind is elevated relative to the annual climatology, adding planning friction without determining operational flight safety\./g, "Gió cao hơn tương đối so với khí hậu năm, làm tăng cản trở lập kế hoạch nhưng không xác định an toàn bay."],
  [/This month sits in the relatively lower-friction part of the loaded climatology, with lower weather-risk context than wetter months\./g, "Tháng này nằm trong giai đoạn ít cản trở hơn của dữ liệu khí hậu đã tải, với bối cảnh rủi ro thời tiết thấp hơn các tháng mưa."],
  [/This month is a moderate planning period in the loaded climatology; use it as context alongside corridor need, benefit, feasibility, and current conditions\./g, "Tháng này là giai đoạn lập kế hoạch trung bình trong dữ liệu khí hậu đã tải; dùng cùng nhu cầu tuyến, lợi ích, khả thi và điều kiện hiện tại."],
  [/additional weather review recommended/g, "khuyến nghị rà soát thời tiết bổ sung"],
  [/relatively lower seasonal friction/g, "cản trở theo mùa tương đối thấp"],
  [/moderate seasonal planning context/g, "bối cảnh lập kế hoạch theo mùa trung bình"],
  [/wettest month/g, "tháng mưa nhiều nhất"],
  [/highest annual wind/g, "gió cao nhất trong năm"],
  [/Historical monthly mean/g, "Trung bình tháng lịch sử"],
  [/Relative planning context score/g, "Điểm bối cảnh lập kế hoạch tương đối"],
  [/annual trend/g, "xu hướng năm"],
  [/CSV exports from /g, "Các CSV xuất từ "],
  [/corridor priority, scenario sensitivity, monthly weather, health facilities, commune master, access-gap ranking, and UAV assumptions/g, "ưu tiên tuyến, độ nhạy kịch bản, thời tiết tháng, cơ sở y tế, danh mục xã, xếp hạng khoảng trống tiếp cận và giả định UAV"],
  [/Boundary GeoJSON comes from/g, "GeoJSON ranh giới lấy từ"],
  [/Road distance\/time, candidate aerial distance, UAV mission time, minutes saved, percent saved, feasibility, risk, and priority scores are project model outputs\./g, "Quãng đường/thời gian đường bộ, khoảng cách đường không ứng viên, thời gian nhiệm vụ UAV, phút tiết kiệm, phần trăm tiết kiệm, khả thi, rủi ro và điểm ưu tiên là đầu ra mô hình dự án."],
  [/Healthcare need, UAV benefit, corridor terrain feasibility, flight feasibility, operational risk, baseline priority, classification, scenario ranks, and robustness are read from the terrain-v2 ranked corridor file\. Weather remains district-level climatology\. UI terms such as Very high, High, Moderate, Limited, and Low are transparent score-band labels for normalized 0-1 values; they do not change the underlying scores\./g, "Nhu cầu y tế, lợi ích UAV, khả thi địa hình tuyến, khả năng thực hiện chuyến bay, rủi ro vận hành, ưu tiên cơ sở, phân loại, hạng kịch bản và độ ổn định được đọc từ tệp tuyến terrain-v2 đã xếp hạng. Thời tiết vẫn là khí hậu học cấp huyện. Các nhãn giao diện là dải điểm minh bạch cho giá trị chuẩn hóa 0-1; không làm đổi điểm gốc."],
  [/The UAV screen uses the loaded assumption record:/g, "Màn hình UAV dùng bản ghi giả định đã tải:"],
  [/base speed/g, "tốc độ cơ sở"],
  [/aerial route factor/g, "hệ số tuyến bay"],
  [/fixed mission time/g, "thời gian nhiệm vụ cố định"],
  [/reference one-way radius/g, "bán kính một chiều tham chiếu"],
  [/No actual origin-to-destination road-route polylines were found; maps show direct candidate UAV links and numeric road-network estimates only\. Weather is monthly climatological\/historical planning context, not real-time aviation weather\. Seasonal readiness is an additional planning overlay based on the loaded monthly weather-risk score; it does not authorize or prohibit UAV operations and does not alter baseline corridor priority unless the underlying methodology explicitly combines them\. Feasibility is preliminary and rankings depend on project methodology\./g, "Không tìm thấy đường tuyến bộ thực tế từ điểm xuất phát đến đích; bản đồ chỉ hiển thị liên kết UAV trực tiếp ứng viên và ước tính số từ mạng lưới đường. Thời tiết là bối cảnh lập kế hoạch khí hậu/lịch sử theo tháng, không phải thời tiết hàng không thời gian thực. Mức sẵn sàng theo mùa là lớp bối cảnh bổ sung dựa trên điểm rủi ro thời tiết tháng; không cho phép hay cấm vận hành UAV và không đổi ưu tiên tuyến cơ sở trừ khi phương pháp gốc kết hợp rõ ràng. Khả thi là sơ bộ và xếp hạng phụ thuộc phương pháp dự án."],
  [/is baseline rank #(\d+), classified/g, "có hạng cơ sở #$1, phân loại"],
  [/with ([\d.,]+) min road time, ([\d.,]+) min UAV time, ([\d.,]+) min saved, and Top-3 in/g, "với thời gian đường bộ $1 phút, thời gian UAV $2 phút, tiết kiệm $3 phút và Top 3 trong"],
  [/scenarios/g, "kịch bản"],
  [/Reference ranking from the baseline corridor priority score\./g, "Xếp hạng tham chiếu từ điểm ưu tiên tuyến cơ sở."],
  [/Baseline is the comparison point for movement across the decision objectives\./g, "Cơ sở là mốc so sánh dịch chuyển giữa các mục tiêu quyết định."],
  [/starts as rank #(\d+); scenario views compare each corridor against this reference\./g, "bắt đầu ở hạng #$1; các chế độ kịch bản so sánh từng tuyến với mốc này."],
  [/Scenario ranking with greater emphasis on healthcare-access need in the supplied sensitivity scores\./g, "Xếp hạng kịch bản nhấn mạnh hơn nhu cầu tiếp cận y tế trong điểm độ nhạy đã cung cấp."],
  [/Scenario ranking with greater emphasis on modeled UAV\/logistics benefit in the supplied sensitivity scores\./g, "Xếp hạng kịch bản nhấn mạnh hơn lợi ích UAV/logistics mô hình hóa trong điểm độ nhạy đã cung cấp."],
  [/Scenario ranking with greater emphasis on flight feasibility and operational-risk considerations in the supplied sensitivity scores\./g, "Xếp hạng kịch bản nhấn mạnh hơn khả năng thực hiện chuyến bay và rủi ro vận hành trong điểm độ nhạy đã cung cấp."],
  [/No corridor changes rank relative to Baseline\./g, "Không tuyến nào đổi hạng so với Cơ sở."],
  [/moves #(\d+) to #(\d+) \(([+-]?\d+) positions\)\./g, "dịch chuyển từ #$1 lên #$2 ($3 bậc)."],
  [/remain Top-3 across all four scenarios\./g, "giữ Top 3 trên cả bốn kịch bản."],
  [/No corridor remains Top-3 across every tested scenario\./g, "Không tuyến nào giữ Top 3 trong mọi kịch bản đã kiểm tra."],
  [/holds rank #(\d+) across all scenarios, indicating a stable modeled priority under the tested objectives\./g, "giữ hạng #$1 trong mọi kịch bản, cho thấy ưu tiên mô hình hóa ổn định theo các mục tiêu đã kiểm tra."],
  [/moves only one rank across scenarios, indicating relatively stable priority under the tested objectives\./g, "chỉ dịch chuyển một hạng giữa các kịch bản, cho thấy ưu tiên tương đối ổn định."],
  [/ranges from #(\d+) under (.+) to #(\d+) under (.+), indicating sensitivity to policy weighting\./g, "dao động từ #$1 theo $2 đến #$3 theo $4, cho thấy nhạy với trọng số chính sách."],
  [/combines (.+) healthcare need, (.+) modeled UAV benefit, and (.+) flight feasibility\./g, "kết hợp nhu cầu y tế $1, lợi ích UAV mô hình hóa $2 và khả năng thực hiện chuyến bay $3."],
  [/is held for later review because modeled need and benefit do not outweigh screening concerns\./g, "được tạm hoãn rà soát vì nhu cầu và lợi ích mô hình hóa chưa vượt các quan ngại sàng lọc."],
  [/shows (.+) healthcare need and (.+) UAV benefit, with (.+) flight feasibility and (.+) operational risk\./g, "có nhu cầu y tế $1 và lợi ích UAV $2, với khả năng thực hiện chuyến bay $3 và rủi ro vận hành $4."],
  [/modeled UAV benefit and (.+) flight feasibility support the #(\d+) baseline priority, while operational risk remains (.+)\./g, "lợi ích UAV mô hình hóa và khả năng thực hiện chuyến bay $1 hỗ trợ ưu tiên cơ sở #$2, trong khi rủi ro vận hành ở mức $3."],
  [/healthcare need and (.+) UAV benefit produce a lower baseline priority, so this corridor remains held for further evidence\./g, "nhu cầu y tế và lợi ích UAV $1 tạo ưu tiên cơ sở thấp hơn, nên tuyến này cần thêm bằng chứng."],
  [/healthcare need and (.+) UAV benefit indicate planning potential, but (.+) flight feasibility and (.+) operational risk keep the baseline status conditional\./g, "nhu cầu y tế và lợi ích UAV $1 cho thấy tiềm năng lập kế hoạch, nhưng khả năng thực hiện chuyến bay $2 và rủi ro vận hành $3 khiến trạng thái cơ sở có điều kiện."]
];

function translateText(text, lang) {
  if (lang !== "vi") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (viExact[trimmed]) return text.replace(trimmed, viExact[trimmed]);
  let translated = text;
  viReplacements.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });
  Object.entries({
    "Mission Control": "Trung tâm Điều phối",
    "Corridor Explorer": "Phân tích Tuyến",
    "Prioritization": "Xếp hạng Ưu tiên",
    "Mission Planner": "Lập kế hoạch Nhiệm vụ",
    "Scenario Lab": "Phân tích Kịch bản",
    "Seasonal Readiness": "Mức độ Sẵn sàng theo Mùa",
    "Pilot Candidate": "Ứng viên Thí điểm",
    "PILOT CANDIDATE": "ỨNG VIÊN THÍ ĐIỂM",
    "Conditional Pilot": "Thí điểm Có điều kiện",
    "CONDITIONAL PILOT": "THÍ ĐIỂM CÓ ĐIỀU KIỆN",
    "Phase 2": "Giai đoạn 2",
    "PHASE 2": "GIAI ĐOẠN 2",
    "Hold": "Tạm hoãn",
    "HOLD": "TẠM HOÃN",
    "Lower caution": "Mức thận trọng thấp",
    "Moderate caution": "Mức thận trọng trung bình",
    "Higher caution": "Mức thận trọng cao",
    "Baseline": "Cơ sở",
    "Equity First": "Ưu tiên Công bằng",
    "Efficiency First": "Ưu tiên Hiệu quả",
    "Safety First": "Ưu tiên An toàn",
    "Jan": "Th1",
    "Feb": "Th2",
    "Mar": "Th3",
    "Apr": "Th4",
    "May": "Th5",
    "Jun": "Th6",
    "Jul": "Th7",
    "Aug": "Th8",
    "Sep": "Th9",
    "Oct": "Th10",
    "Nov": "Th11",
    "Dec": "Th12"
  }).forEach(([source, target]) => {
    translated = translated.replaceAll(source, target);
  });
  return translated;
}

const translatedNodes = new WeakMap();
const translatedAttributes = new WeakMap();
function applyLanguage(root, lang) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      return !parent || parent.closest("[data-native-language]") || ["SCRIPT","STYLE","CODE"].includes(parent.tagName) || !node.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const old = translatedNodes.get(node);
    const original = old && node.nodeValue === old.translated ? old.original : node.nodeValue;
    const translated = lang === "vi" ? translateText(original, lang) : original;
    node.nodeValue = translated;
    translatedNodes.set(node, {original, translated});
  }
  root.querySelectorAll("[aria-label], [placeholder], [title]").forEach(node => {
    if (node.closest("[data-native-language]")) return;
    const records = translatedAttributes.get(node) || {};
    for (const attr of ["aria-label","placeholder","title"]) {
      const current = node.getAttribute(attr);
      if (!current) continue;
      const old = records[attr];
      const original = old && current === old.translated ? old.original : current;
      const translated = lang === "vi" ? translateText(original, lang) : original;
      node.setAttribute(attr, translated);
      records[attr] = {original, translated};
    }
    translatedAttributes.set(node, records);
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, coerce(values[index] ?? "")]))
  );
}

function parseHealthCsv(text) {
  const rows = parseCsv(text);
  if ("facility_id" in rows[0]) return rows;
  const raw = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      raw.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  const headers = raw[1].map((value, index) => {
    if (index === 10) return "lat";
    if (index === 11) return "lon";
    return value || `drop_${index}`;
  });
  return raw.slice(2).map((values) => {
    const item = Object.fromEntries(headers.map((header, index) => [header, coerce(values[index] ?? "")]));
    return {
      commune: item.commune_old,
      address: item.address,
      coordinate_source: item.coordinate_source,
      coordinate_status: item.coordinate_status,
      facility_id: item.facility_id,
      facility_name: item.facility_name,
      facility_type: item.facility_type,
      notes: item.notes,
      verification_status: item.verification_status,
      lat: item.lat,
      lon: item.lon
    };
  });
}

function coerce(value) {
  const trimmed = String(value).trim();
  if (trimmed === "" || trimmed === "(No Value)") return "";
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(trimmed)) return asNumber;
  if (trimmed === "True") return true;
  if (trimmed === "False") return false;
  return trimmed;
}

function fmt(value, digits = 1, suffix = "") {
  if (value === undefined || value === null || value === "") return "n/a";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function pct(value) {
  if (value > 1) return fmt(value, 1, "%");
  return fmt(value * 100, 1, "%");
}

function scoreState(value, risk = false) {
  if (typeof value !== "number") return { label: String(value || "n/a"), tone: "neutral" };
  if (risk) {
    if (value >= 0.6) return { label: "Moderate / elevated", tone: "amber" };
    if (value >= 0.4) return { label: "Moderate", tone: "amber" };
    if (value >= 0.2) return { label: "Managed", tone: "teal" };
    return { label: "Lower", tone: "teal" };
  }
  if (value >= 0.75) return { label: "Very high", tone: "teal" };
  if (value >= 0.6) return { label: "High", tone: "teal" };
  if (value >= 0.4) return { label: "Moderate", tone: "amber" };
  if (value >= 0.2) return { label: "Limited", tone: "blue" };
  return { label: "Low", tone: "rose" };
}

function recommendationText(c) {
  const need = scoreState(c.medical_accessibility_need_score).label.toLowerCase();
  const benefit = scoreState(c.uav_benefit_score).label.toLowerCase();
  const feasibility = scoreState(c.flight_feasibility_score).label.toLowerCase();
  const risk = scoreState(c.operational_risk_score, true).label.toLowerCase();
  if (c.final_classification_baseline === "LAUNCH") {
    return `${c.destination_commune_old} combines ${need} healthcare need, ${benefit} modeled UAV benefit, and ${feasibility} flight feasibility.`;
  }
  if (c.final_classification_baseline === "HOLD") {
    return `${c.destination_commune_old} is held for later review because modeled need and benefit do not outweigh screening concerns.`;
  }
  return `${c.destination_commune_old} shows ${need} healthcare need and ${benefit} UAV benefit, with ${feasibility} flight feasibility and ${risk} operational risk.`;
}

function recommendationHeader(c) {
  const headers = {
    LAUNCH: "RECOMMENDED FOR PILOT REVIEW",
    "CONDITIONAL PILOT": "REQUIRES CONDITIONAL PILOT REVIEW",
    "PHASE 2": "DEFER TO PHASE 2",
    HOLD: "NOT CURRENTLY PRIORITIZED"
  };
  return headers[c.final_classification_baseline] || "REQUIRES CONDITIONAL PILOT REVIEW";
}

function ordinal(rank) {
  const mod10 = rank % 10;
  const mod100 = rank % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? "st" : mod10 === 2 && mod100 !== 12 ? "nd" : mod10 === 3 && mod100 !== 13 ? "rd" : "th";
  return `${rank}${suffix}`;
}

function weatherRank(data, month, field, high = true) {
  const sorted = [...data].sort((a, b) => high ? b[field] - a[field] : a[field] - b[field]);
  return sorted.findIndex((item) => item.month === month) + 1;
}

function weatherCategory(item, weather) {
  const ranked = [...weather].sort((a, b) => a.monthly_weather_risk_score - b.monthly_weather_risk_score);
  const index = ranked.findIndex((candidate) => candidate.month === item.month);
  if (index <= 4) return { label: "Lower climatological friction", short: "Lower caution", tone: "teal" };
  if (index >= 8) return { label: "Higher seasonal caution", short: "Higher caution", tone: "amber" };
  return { label: "Moderate seasonal caution", short: "Moderate caution", tone: "blue" };
}

function contiguousWindows(monthNumbers) {
  const set = new Set(monthNumbers);
  const doubled = [...Array(24)].map((_, index) => (index % 12) + 1);
  const windows = [];
  let run = [];
  doubled.forEach((month) => {
    if (set.has(month)) {
      if (!run.includes(month) || run.length < set.size) run.push(month);
    } else if (run.length) {
      windows.push(run);
      run = [];
    }
  });
  if (run.length) windows.push(run);
  return windows.sort((a, b) => b.length - a.length)[0] || [];
}

function windowLabel(monthNumbers) {
  if (!monthNumbers.length) return "n/a";
  const start = months[monthNumbers[0] - 1].toUpperCase();
  const end = months[monthNumbers[monthNumbers.length - 1] - 1].toUpperCase();
  return monthNumbers.length === 1 ? start : `${start}-${end}`;
}

function seasonalDriver(selected, weather) {
  const precipRank = weatherRank(weather, selected.month, "precipitation_total_mean", true);
  const windRank = weatherRank(weather, selected.month, "mean_wind_speed_mean", true);
  const category = weatherCategory(selected, weather);
  if (category.tone === "amber" && precipRank <= 4) {
    return "Rainfall is the dominant source of additional seasonal caution this month; current-weather verification remains required before any field operation.";
  }
  if (category.tone === "amber" && windRank <= 4) {
    return "Wind is elevated relative to the annual climatology, adding planning friction without determining operational flight safety.";
  }
  if (category.tone === "teal") {
    return "This month sits in the relatively lower-friction part of the loaded climatology, with lower weather-risk context than wetter months.";
  }
  return "This month is a moderate planning period in the loaded climatology; use it as context alongside corridor need, benefit, feasibility, and current conditions.";
}

function seasonalOverlayText(corridor, monthItem, weather) {
  const category = weatherCategory(monthItem, weather);
  if (category.tone === "amber") return `${displayClass(corridor.final_classification_baseline)} - additional weather review recommended`;
  if (category.tone === "teal") return `${displayClass(corridor.final_classification_baseline)} - relatively lower seasonal friction`;
  return `${displayClass(corridor.final_classification_baseline)} - moderate seasonal planning context`;
}

function whyRecommendation(c) {
  const need = scoreState(c.medical_accessibility_need_score).label.toLowerCase();
  const benefit = scoreState(c.uav_benefit_score).label.toLowerCase();
  const feasibility = scoreState(c.flight_feasibility_score).label.toLowerCase();
  const risk = scoreState(c.operational_risk_score, true).label.toLowerCase();
  if (c.final_classification_baseline === "LAUNCH") {
    return `${benefit} modeled UAV benefit and ${feasibility} flight feasibility support the #${c.rank_baseline} baseline priority, while operational risk remains ${risk}.`;
  }
  if (c.final_classification_baseline === "HOLD") {
    return `${need} healthcare need and ${benefit} UAV benefit produce a lower baseline priority, so this corridor remains held for further evidence.`;
  }
  return `${need} healthcare need and ${benefit} UAV benefit indicate planning potential, but ${feasibility} flight feasibility and ${risk} operational risk keep the baseline status conditional.`;
}

function scenarioSensitivityText(c) {
  const entries = Object.entries(scenarioFields).map(([name, field]) => [name, c[field]]);
  const best = entries.reduce((a, b) => (b[1] < a[1] ? b : a), entries[0]);
  const worst = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]);
  const spread = worst[1] - best[1];
  if (spread === 0) return `${c.destination_commune_old} holds rank #${c.rank_baseline} across all scenarios, indicating a stable modeled priority under the tested objectives.`;
  if (spread <= 1) return `${c.destination_commune_old} moves only one rank across scenarios, indicating relatively stable priority under the tested objectives.`;
  return `${c.destination_commune_old} ranges from #${best[1]} under ${best[0]} to #${worst[1]} under ${worst[0]}, indicating sensitivity to policy weighting.`;
}

function scenarioWhatChanged(scenario, corridors) {
  if (scenario === "Baseline") {
    return {
      emphasis: "Reference ranking from the baseline corridor priority score.",
      mover: "Baseline is the comparison point for movement across the decision objectives.",
      stability: `${corridors[0].destination_commune_old} starts as rank #${corridors[0].rank_baseline}; scenario views compare each corridor against this reference.`
    };
  }
  const field = scenarioFields[scenario];
  const deltas = corridors.map((c) => ({ c, delta: c.rank_baseline - c[field] })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const largest = deltas[0];
  const topStable = corridors
    .filter((c) => Math.max(c.rank_baseline, c.rank_equity_first, c.rank_efficiency_first, c.rank_safety_first) <= 3)
    .map((c) => c.destination_commune_old);
  const emphasis = {
    "Equity First": "Scenario ranking with greater emphasis on healthcare-access need in the supplied sensitivity scores.",
    "Efficiency First": "Scenario ranking with greater emphasis on modeled UAV/logistics benefit in the supplied sensitivity scores.",
    "Safety First": "Scenario ranking with greater emphasis on flight feasibility and operational-risk considerations in the supplied sensitivity scores."
  }[scenario];
  return {
    emphasis,
    mover: largest.delta === 0
      ? "No corridor changes rank relative to Baseline."
      : `${largest.c.destination_commune_old} moves #${largest.c.rank_baseline} to #${largest.c[field]} (${largest.delta > 0 ? "+" : ""}${largest.delta} positions).`,
    stability: topStable.length ? `${topStable.join(", ")} remain Top-3 across all four scenarios.` : "No corridor remains Top-3 across every tested scenario."
  };
}

function clsClass(value) {
  return String(value).toLowerCase().replaceAll(" ", "-");
}

function displayClass(value) {
  return value === "LAUNCH" ? "PILOT CANDIDATE" : value;
}

function useSkybridgeData() {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [corridorsText, scenariosText, weatherText, healthText, communesText, accessText, uavText, boundary, communeBoundaries] =
        await Promise.all([
          fetch(DATA.corridors).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.scenarios).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.weather).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.health).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.communes).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.access).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.uav).then((res) => { if (!res.ok) throw new Error("Dataset unavailable: " + res.url + " (" + res.status + ")"); return res.text(); }),
          fetch(DATA.boundary).then((res) => { if (!res.ok) throw new Error("Geography unavailable: " + res.url + " (" + res.status + ")"); return res.json(); }),
          fetch(DATA.communeBoundaries).then((res) => { if (!res.ok) throw new Error("Geography unavailable: " + res.url + " (" + res.status + ")"); return res.json(); })
        ]);
      if (cancelled) return;
      const scenarios = parseCsv(scenariosText);
      const health = parseHealthCsv(healthText);
      const scenarioById = new Map(scenarios.map((item) => [item.corridor_id, item]));
      const facilityById = new Map(health.map((item) => [item.facility_id, item]));
      const corridors = parseCsv(corridorsText)
        .map((item) => {
          const scenario = scenarioById.get(item.corridor_id) || {};
          const origin = facilityById.get(item.origin_id) || {};
          const destination = facilityById.get(item.destination_id) || {};
          return {
            ...scenario,
            ...item,
            scenario: { ...scenario, ...item },
            origin_lat: origin.lat,
            origin_lon: origin.lon,
            destination_lat: destination.lat,
            destination_lon: destination.lon
          };
        })
        .sort((a, b) => a.rank_baseline - b.rank_baseline);
      setState({
        status: "ready",
        corridors,
        scenarios,
        weather: parseCsv(weatherText),
        health,
        communes: parseCsv(communesText),
        access: parseCsv(accessText),
        uav: parseCsv(uavText)[0],
        boundary,
        communeBoundaries
      });
    }
    load().catch((error) => {
      if (!cancelled) setState({ status: "error", error });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function App() {
  const data = useSkybridgeData();
  const shellRef = useRef(null);
  const [screen, setScreen] = useState("decision"); const [missionDraft, setMissionDraft] = useState(null);
  const [selectedId, setSelectedId] = useState("HF001_HF004");
  const [planningMonth, setPlanningMonth] = useState(7);
  const [notesOpen, setNotesOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || "en");

  useLayoutEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    applyLanguage(shellRef.current, lang);
  }, [lang, data.status, screen, selectedId, planningMonth, notesOpen]);

  if (data.status === "loading") return <div className="loader">Loading verified SkyBridge data...</div>;
  if (data.status === "error") return <div className="loader error">Could not load data: {String(data.error)}</div>;

  const selected = data.corridors.find((item) => item.corridor_id === selectedId) || data.corridors[0];
  const [pageTitle, pageSubtitle] = pageMeta[screen];
  const Screen = {
    decision: MissionWorkspace,
    intelligence: CorridorIntelligence,
    scenario: ScenarioStudio,
    evidence: EvidenceMethodology
  }[screen];

  return (
    <div className="app-shell" ref={shellRef} lang={lang}>
      <aside className="side-nav">
        <div className="brand">
          <div className="brand-mark">SB</div>
          <div>
            <strong>SKYBRIDGE</strong>
            <span>Medical UAV Decision Intelligence</span>
          </div>
        </div>
        <nav>
          {navItems.map(([id, number, label, Icon]) => (
            <button key={id} className={screen === id ? "active" : ""} onClick={() => setScreen(id)}>
              <span>{number}</span>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-disclaimer">Research planning prototype<br/>Not flight authorization</div>
      </aside>
      <main className="workspace">
        <header className="top-bar">
          <div>
            <span className="page-kicker">Mường Ảng, Điện Biên</span>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <div className="header-actions">
            {contextScreens.has(screen) && (
              <div className="selected-context">
                <span>Selected corridor</span>
                <strong>{selected.destination_commune_old} · Rank #{selected.rank_baseline} · {displayClass(selected.final_classification_baseline)}</strong>
              </div>
            )}
            <div className="language-toggle" aria-label="Language">
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
              <span>|</span>
              <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")} aria-pressed={lang === "vi"}>VI</button>
            </div>
            <div className="status-badge"><Activity size={15} /> Planning Prototype</div>
          </div>
        </header>
        <Screen lang={lang} draft={missionDraft} setDraft={setMissionDraft} data={data} selected={selected} setSelectedId={setSelectedId} setScreen={setScreen} planningMonth={planningMonth} setPlanningMonth={setPlanningMonth} />
      </main>
      {notesOpen && <MethodologyDrawer lang={lang} data={data} onClose={() => setNotesOpen(false)} />}
    </div>
  );
}

function MissionControl({ data, selected, setSelectedId, setScreen }) {
  const kpis = [
    ["Candidate Corridors", data.corridors.length, "screened origin-destination links"],
    ["Pilot Candidates", data.corridors.filter((c) => c.final_classification_baseline === "LAUNCH").length, "baseline classification"],
    ["Robust Top-3", data.corridors.filter((c) => c.top3_scenario_count === 4).length, "across all four scenarios"],
    ["Maximum Minutes Saved", fmt(Math.max(...data.corridors.map((c) => c.time_saved_base_min)), 1), "minutes", "modeled estimate"]
  ];
  return (
    <section className="screen mission-grid">
      <div className="kpi-strip">
        {kpis.map(([label, value, unit, note]) => <Kpi key={label} label={label} value={value} unit={unit} note={note} />)}
      </div>
      <div className="map-panel">
        <OperationalMap data={data} selected={selected} setSelectedId={setSelectedId} />
      </div>
      <DecisionPanel selected={selected} setScreen={setScreen} />
    </section>
  );
}

function OperationalMap({ data, selected, setSelectedId }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([21.52, 103.22], 11);
    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
  }, []);
  useEffect(() => {
    if (!mapRef.current) return;
    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(mapRef.current);
    layerRef.current = group;
    const boundary = L.polygon(boundaryRings(data.boundary), {
      color: "#506f82",
      weight: 2.8,
      fillColor: "#edf3f6",
      fillOpacity: 0.9
    }).addTo(group);
    if (data.communeBoundaries?.features?.length) {
      L.geoJSON(data.communeBoundaries, {
        style: {
          color: "#2d5f78",
          weight: 1.05,
          opacity: 0.5,
          fillOpacity: 0,
          dashArray: "2 4",
          lineCap: "round",
          lineJoin: "round"
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindTooltip(
            `<strong>${props.name || props.name_gadm || "Commune boundary"}</strong><br/>${props.admin_type || "Administrative area"} boundary<br/>${props.boundary_source || "GADM ADM3"}`,
            { className: "commune-boundary-tooltip" }
          );
        }
      }).addTo(group);
    }
    data.corridors.forEach((corridor) => {
      const color = classificationColors[corridor.final_classification_baseline] || "#577";
      const isSelected = corridor.corridor_id === selected.corridor_id;
      const route = [[corridor.origin_lat, corridor.origin_lon], [corridor.destination_lat, corridor.destination_lon]];
      if (isSelected) {
        L.polyline(route, { color: "#ffffff", weight: 6, opacity: 0.78 }).addTo(group);
      }
      L.polyline(
        route,
        { color: isSelected ? "#00A89D" : color, weight: isSelected ? 3.5 : 1.5, opacity: isSelected ? 0.98 : 0.5, dashArray: isSelected ? "" : "4 8" }
      )
        .on("click", () => setSelectedId(corridor.corridor_id))
        .on("mouseover", (event) => event.target.setStyle({ weight: 4, opacity: 0.95 }))
        .on("mouseout", (event) => event.target.setStyle({ weight: isSelected ? 3.5 : 1.5, opacity: isSelected ? 0.98 : 0.5 }))
        .bindTooltip(`${corridor.destination_commune_old}<br/>${displayClass(corridor.final_classification_baseline)}<br/>Road ${fmt(corridor.road_time_base_min)} min to UAV ${fmt(corridor.uav_mission_time_base_min)} min<br/>${fmt(corridor.time_saved_base_min)} min saved`)
        .addTo(group);
      const marker = L.circleMarker([corridor.destination_lat, corridor.destination_lon], {
        radius: isSelected ? 10 : 6,
        color: "#ffffff",
        weight: isSelected ? 4 : 2,
        fillColor: color,
        fillOpacity: 0.95
      })
        .on("click", () => setSelectedId(corridor.corridor_id))
        .on("mouseover", (event) => event.target.setStyle({ radius: isSelected ? 10 : 8, fillOpacity: 1 }))
        .on("mouseout", (event) => event.target.setStyle({ radius: isSelected ? 10 : 6, fillOpacity: 0.95 }))
        .bindTooltip(`${corridor.destination_name}<br/>Rank #${corridor.rank_baseline} | ${fmt(corridor.time_saved_base_min)} min saved`)
        .addTo(group);
      marker.bringToFront();
      if (isSelected) {
        L.circleMarker([corridor.destination_lat, corridor.destination_lon], {
          radius: 17,
          color: "#00A89D",
          weight: 2,
          fillColor: "#00A89D",
          fillOpacity: 0.12
        }).addTo(group);
        const midLat = (corridor.origin_lat + corridor.destination_lat) / 2;
        const midLon = (corridor.origin_lon + corridor.destination_lon) / 2;
        const angle = Math.atan2(corridor.destination_lat - corridor.origin_lat, corridor.destination_lon - corridor.origin_lon) * 180 / Math.PI;
        L.marker([midLat, midLon], {
          interactive: false,
          icon: L.divIcon({
            className: "map-direction-cue",
            html: `<span style="transform: rotate(${angle}deg)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })
        }).addTo(group);
        L.marker([corridor.destination_lat, corridor.destination_lon], {
          interactive: false,
          icon: L.divIcon({
            className: "map-point-label destination-label",
            html: `<strong>${corridor.destination_commune_old}</strong><span>${displayClass(corridor.final_classification_baseline)}</span>`,
            iconSize: [170, 42],
            iconAnchor: [-16, 20]
          })
        }).addTo(group);
      }
    });
    const origin = data.corridors[0];
    L.circleMarker([origin.origin_lat, origin.origin_lon], {
      radius: 10,
      color: "#05233a",
      weight: 3,
      fillColor: "#08263A",
      fillOpacity: 1
    }).bindTooltip(origin.origin_name).addTo(group);
    L.marker([origin.origin_lat, origin.origin_lon], {
      interactive: false,
      icon: L.divIcon({
        className: "map-point-label origin-label",
        html: "<strong>Mường Ảng Health Center</strong><span>UAV origin</span>",
        iconSize: [184, 42],
        iconAnchor: [198, 20]
      })
    }).addTo(group);
    mapRef.current.fitBounds(boundary.getBounds().pad(0.08));
  }, [data, selected, setSelectedId]);
  return (
    <div className="map-wrap">
      <div ref={containerRef} className="leaflet-map" />
      <div className="map-caption">
        <Layers size={15} /> Candidate direct UAV links, facility points, district outline, and GADM ADM3 commune boundaries. Road ETAs are modeled, but route polylines are not available in the loaded data.
      </div>
      <Legend />
    </div>
  );
}

function boundaryRings(boundary) {
  const geometry = boundary?.features?.[0]?.geometry;
  if (!geometry) return [];
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  return polygons[0][0].map(([lon, lat]) => [lat, lon]);
}

function DecisionPanel({ selected, setScreen }) {
  const reduction = pct(selected.time_saved_base_pct);
  return (
    <aside className="decision-panel">
      <div className="recommendation">
        <span>{recommendationHeader(selected)}</span>
        <Badge className={selected.final_classification_baseline}>{displayClass(selected.final_classification_baseline)}</Badge>
        <h2>{selected.destination_commune_old}</h2>
        <p>{recommendationText(selected)}</p>
      </div>
      <div className="save-panel">
        <span>Save up to</span>
        <strong>{fmt(selected.time_saved_base_min, 1)}<small>min</small></strong>
        <p>Road {fmt(selected.road_time_base_min)} min to UAV {fmt(selected.uav_mission_time_base_min)} min</p>
        <p>{reduction} reduction in modeled travel time</p>
      </div>
      <ScoreGrid selected={selected} />
      <div className="why-recommendation">
        <h3>Why this recommendation?</h3>
        <p>{whyRecommendation(selected)}</p>
      </div>
      <button className="context-action" onClick={() => setScreen("intelligence")}>Explore corridor</button>
      <div className="evidence-note">
        <ShieldAlert size={17} />
        Preliminary screening only. Requires operator verification, current weather, airspace clearance, aircraft status, and applicable aviation procedures.
      </div>
    </aside>
  );
}

function CorridorIntelligence(props) {
  const [view, setView] = useState("explore");
  const [compareIds, setCompareIds] = useState(() => [props.selected.corridor_id]);
  const toggleCompare = (id) => setCompareIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : ids.length < 3 ? [...ids, id] : ids);
  const compared = props.data.corridors.filter((c) => compareIds.includes(c.corridor_id));
  const highestRanked = [...compared].sort((a,b) => a.rank_baseline-b.rank_baseline)[0];
  const highestNeed = [...compared].sort((a,b) => b.medical_accessibility_need_score-a.medical_accessibility_need_score)[0];
  return <section className="intelligence-page">
    <div className="subnav" role="tablist">
      <button className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}>Corridor detail</button>
      <button className={view === "prioritize" ? "active" : ""} onClick={() => setView("prioritize")}>Priority matrix & ranking</button>
      <button className={view === "compare" ? "active" : ""} onClick={() => setView("compare")}>Compare ({compareIds.length}/3)</button>
    </div>
    {view === "explore" && <CorridorExplorer {...props} compareIds={compareIds} toggleCompare={toggleCompare} />}
    {view === "prioritize" && <Prioritization {...props} />}
    {view === "compare" && <div className="comparison-workspace">
      <div className="comparison-picker">{props.data.corridors.map((c) => <label key={c.corridor_id}><input type="checkbox" checked={compareIds.includes(c.corridor_id)} onChange={() => toggleCompare(c.corridor_id)} disabled={!compareIds.includes(c.corridor_id) && compareIds.length >= 3}/><span>#{c.rank_baseline} {c.destination_commune_old}</span></label>)}</div>
      <div className="comparison-analysis">{compared.length > 0 && <><div className="comparison-cards">{compared.map((c) => <article key={c.corridor_id} className="compare-card"><span>Rank #{c.rank_baseline}</span><h3>{c.destination_commune_old}</h3><Badge className={c.final_classification_baseline}>{displayClass(c.final_classification_baseline)}</Badge><div className="compact-score-list">{[["Healthcare need",c.medical_accessibility_need_score,false],["UAV benefit",c.uav_benefit_score,false],["Flight feasibility",c.flight_feasibility_score,false],["Operational risk",c.operational_risk_score,true],["Overall priority",c.priority_score_baseline,false]].map(([label,value,risk]) => <div key={label}><span>{label}{risk&&<small>higher = more risk</small>}</span><strong>{fmt(value,3)}</strong><i className={risk?"risk":""} style={{width:`${value*100}%`}}/></div>)}</div><div className="compare-time"><span>{fmt(c.road_time_base_min,1)} min road</span><ArrowRight size={14}/><strong>{fmt(c.uav_mission_time_base_min,1)} min UAV</strong></div><button className="context-action inline" onClick={() => { props.setSelectedId(c.corridor_id); props.setDraft(null); props.setScreen("decision"); }}>Evaluate this Mission</button></article>)}</div><div className="comparison-insight"><strong>Comparative insight</strong><p>{highestRanked.corridor_id === highestNeed.corridor_id ? `${highestRanked.destination_commune_old} is both the highest-ranked and highest-need corridor in this comparison.` : `${highestNeed.destination_commune_old} has the highest healthcare-need score (${fmt(highestNeed.medical_accessibility_need_score,3)}), while ${highestRanked.destination_commune_old} has the best overall rank (#${highestRanked.rank_baseline}).`} Overall priority also reflects the exported UAV-benefit, feasibility, and operational-risk evidence; the available files do not support attributing the rank gap to one factor alone.</p></div></>}</div>
    </div>}
  </section>;
}

function CorridorExplorer({ data, selected, setSelectedId, setScreen, setDraft, compareIds = [], toggleCompare }) {
  const [query, setQuery] = useState("");
  const filtered = data.corridors.filter((c) => c.destination_commune_old.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="screen explorer-grid">
      <aside className="selector-panel">
        <div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search corridor" /></div>
        <div className="corridor-list">
          {filtered.map((corridor) => (
            <button key={corridor.corridor_id} className={corridor.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(corridor.corridor_id)}>
              <span>#{corridor.rank_baseline} {corridor.destination_commune_old}</span>
              <small>{fmt(corridor.time_saved_base_min)} min saved</small>
            </button>
          ))}
        </div>
      </aside>
      <main className="analysis-area">
        <div className="corridor-hero">
          <SectionTitle eyebrow={`Rank #${selected.rank_baseline} / ${displayClass(selected.final_classification_baseline)}`} title={selected.destination_name} />
          <p>{recommendationText(selected)}</p>
        </div>
        <RoadAirGraphic selected={selected} />
        <SectionTitle eyebrow="Why air changes the access picture" title="Modeled road detour versus direct UAV path" compact />
        <div className="air-picture">
          <InsightCard label="Road detour" value={`${fmt(selected.detour_ratio, 2)}x`} note="Road distance relative to direct path" />
          <ArrowRight size={18} />
          <InsightCard label="Straight-line geographic distance" value={`${fmt(selected.straight_distance_km, 1)} km`} note="Geodesic distance between facility coordinates" />
          <ArrowRight size={18} />
          <InsightCard label="Time benefit" value={`${fmt(selected.time_saved_base_min, 1)} min`} note={`${pct(selected.time_saved_base_pct)} modeled reduction`} />
        </div>
        <ScoreGrid selected={selected} expanded />
        {toggleCompare && <button className="secondary-action" onClick={() => toggleCompare(selected.corridor_id)}>{compareIds.includes(selected.corridor_id) ? "Remove from comparison" : "Add to comparison"}</button>}
        <button className="context-action inline" onClick={() => { setDraft(null); setScreen("decision"); }}>Evaluate this Mission</button>
      </main>
    </section>
  );
}

function RoadAirGraphic({ selected }) {
  const baseline = corridorBaselineMetrics(selected);
  const maxDistance = Math.max(baseline.roadNetworkDistanceKm, baseline.modeledFlightDistanceKm, baseline.straightLineDistanceKm, 1);
  const maxTime = Math.max(baseline.roadTimeMinutes, baseline.uavTimeMinutes, 1);
  const rows = [
    ["Road-network distance", baseline.roadNetworkDistanceKm, "km", "Precomputed distance from the project road-network model; no route polyline is available.", maxDistance, "road"],
    ["Straight-line geographic distance", baseline.straightLineDistanceKm, "km", "Geodesic distance between the origin and destination coordinates.", maxDistance, "air"],
    ["Modeled flight distance", baseline.modeledFlightDistanceKm, "km", `Straight-line distance multiplied by the ${fmt(baseline.detourFactor,2)} flight detour factor.`, maxDistance, "air"],
    ["Modeled road time", baseline.roadTimeMinutes, "min", "Precomputed travel time from project road-network assumptions.", maxTime, "road"],
    ["Modeled UAV mission time", baseline.uavTimeMinutes, "min", "Modeled flight distance at baseline speed plus fixed handling time.", maxTime, "air"]
  ];
  return (
    <div className="bar-card">
      {rows.map(([label, value, unit, tip, max, mode]) => (
        <div className="bar-row" key={label}>
          <div className="bar-label">{label}<Tooltip text={tip} /></div>
          <div className={`bar-track ${mode}`}><span style={{ width: `${Math.max(8, (value / max) * 100)}%` }} /></div>
          <strong>{fmt(value, 1, ` ${unit}`)}</strong>
        </div>
      ))}
    </div>
  );
}

function Prioritization({ data, selected, setSelectedId, setScreen }) {
  const [matrixLabelId, setMatrixLabelId] = useState(null);
  const selectFromPriority = (id) => {
    setSelectedId(id);
    setMatrixLabelId(id);
  };
  return (
    <section className="screen priority-grid">
      <main className="analysis-area">
        <SectionTitle eyebrow="Decision intelligence" title="Need x Flight Feasibility" />
        <Matrix data={data} selected={selected} setSelectedId={selectFromPriority} labelId={matrixLabelId} clearLabel={() => setMatrixLabelId(null)} />
        <div className="insight-callout">
          <strong>HIGHEST NEED != HIGHEST DEPLOYMENT PRIORITY</strong>
          <span>Prioritization balances healthcare need, UAV benefit, flight feasibility, and operational risk using the project methodology.</span>
        </div>
        <button className="context-action inline" onClick={() => setScreen("decision")}>Evaluate selected corridor</button>
      </main>
      <RankTable data={data} selected={selected} setSelectedId={selectFromPriority} />
    </section>
  );
}

function rectsOverlap(a, b, padding = 6) {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

function labelRect(label, x, y, anchor) {
  const width = Math.max(260, label.length * 7.8 + 16);
  const height = 38;
  const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
  return { x: left, y: y - height + 6, width, height };
}

function buildMatrixAnnotations(points, selectedId, bounds) {
  const important = points
    .filter((point) => point.c.corridor_id === selectedId)
    .sort((a, b) => a.c.rank_baseline - b.c.rank_baseline);
  const placed = [];
  const usedAnchors = new Set();
  const anchors = [
    { key: "ne", dx: 18, dy: -18, anchor: "start" },
    { key: "se", dx: 18, dy: 28, anchor: "start" },
    { key: "nw", dx: -18, dy: -18, anchor: "end" },
    { key: "sw", dx: -18, dy: 28, anchor: "end" },
    { key: "n", dx: 0, dy: -30, anchor: "middle" },
    { key: "e", dx: 30, dy: 4, anchor: "start" },
    { key: "w", dx: -30, dy: 4, anchor: "end" },
    { key: "s", dx: 0, dy: 34, anchor: "middle" }
  ];

  important.forEach((point) => {
    const extremelyClose = placed.some((label) => Math.hypot(label.point.x - point.x, label.point.y - point.y) < 24);
    if (extremelyClose && point.c.corridor_id !== selectedId) return;

    let best = null;
    for (const option of anchors) {
      const labelX = Math.min(Math.max(point.x + option.dx, bounds.left + 12), bounds.right - 12);
      const labelY = Math.min(Math.max(point.y + option.dy, bounds.top + 20), bounds.bottom - 8);
      const rect = labelRect(point.c.destination_commune_old, labelX, labelY, option.anchor);
      const inBounds = rect.x >= bounds.left && rect.x + rect.width <= bounds.right && rect.y >= bounds.top && rect.y + rect.height <= bounds.bottom;
      const collides = placed.some((label) => rectsOverlap(rect, label.rect));
      const reused = usedAnchors.has(`${Math.round(point.x / 70)}:${Math.round(point.y / 70)}:${option.key}`);
      if (!best || (Number(collides) + Number(!inBounds) + Number(reused)) < best.penalty) {
        best = { point, ...option, labelX, labelY, rect, penalty: Number(collides) + Number(!inBounds) + Number(reused) };
      }
      if (!collides && inBounds && !reused) break;
    }
    if (best) {
      placed.push(best);
      usedAnchors.add(`${Math.round(point.x / 70)}:${Math.round(point.y / 70)}:${best.key}`);
    }
  });

  return placed;
}

function Matrix({ data, selected, setSelectedId, labelId, clearLabel }) {
  const [hoverId, setHoverId] = useState(null);
  const pad = 44;
  const w = 650;
  const h = 430;
  const xMid = pad + 0.6 * (w - pad * 2);
  const yMid = h - pad - 0.6 * (h - pad * 2);
  const jitter = [[0, 0], [9, -7], [-9, 7], [9, 7], [-9, -7], [0, -11], [0, 11], [12, 0], [-12, 0]];
  const rawPoints = data.corridors.map((c) => ({
    c,
    trueX: pad + c.medical_accessibility_need_score * (w - pad * 2),
    trueY: h - pad - c.flight_feasibility_score * (h - pad * 2),
    active: c.corridor_id === selected.corridor_id
  }));
  const points = rawPoints.map((point, index) => {
    const clusterIndex = rawPoints.slice(0, index).filter((other) => Math.hypot(other.trueX - point.trueX, other.trueY - point.trueY) < 18).length;
    const [dx, dy] = jitter[clusterIndex % jitter.length];
    return {
      ...point,
      x: Math.min(Math.max(point.trueX + dx, pad + 8), w - pad - 8),
      y: Math.min(Math.max(point.trueY + dy, pad + 8), h - pad - 8)
    };
  });
  const annotations = labelId ? buildMatrixAnnotations(points, labelId, { left: pad, right: w - pad, top: pad, bottom: h - pad }) : [];
  const drawPoints = [...points].sort((a, b) => {
    const aSelected = a.c.corridor_id === selected.corridor_id;
    const bSelected = b.c.corridor_id === selected.corridor_id;
    const aHovered = a.c.corridor_id === hoverId;
    const bHovered = b.c.corridor_id === hoverId;
    return Number(aSelected) - Number(bSelected) || Number(aHovered) - Number(bHovered);
  });
  return (
    <div className="matrix-card">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Need by feasibility matrix" onClick={clearLabel}>
        <rect x={pad} y={pad} width={xMid - pad} height={yMid - pad} className="zone secondary" />
        <rect x={xMid} y={pad} width={w - pad - xMid} height={yMid - pad} className="zone priority" />
        <rect x={pad} y={yMid} width={xMid - pad} height={h - pad - yMid} className="zone lower" />
        <rect x={xMid} y={yMid} width={w - pad - xMid} height={h - pad - yMid} className="zone work" />
        {[0, .25, .5, .75, 1].map((tick) => {
          const x = pad + tick * (w - pad * 2);
          const y = h - pad - tick * (h - pad * 2);
          return <g key={tick}><line className="grid" x1={x} x2={x} y1={pad} y2={h - pad} /><line className="grid" x1={pad} x2={w - pad} y1={y} y2={y} /><text x={x} y={h - 24} textAnchor="middle">{tick.toFixed(2)}</text><text x={22} y={y + 4} textAnchor="middle">{tick.toFixed(2)}</text></g>;
        })}
        <line className="ref" x1={xMid} x2={xMid} y1={pad} y2={h - pad} />
        <line className="ref" x1={pad} x2={w - pad} y1={yMid} y2={yMid} />
        <text className="zone-label" x={w - pad - 12} y={pad + 20} textAnchor="end">PILOT PRIORITY</text>
        <text className="zone-label" x={w - pad - 12} y={h - pad - 14} textAnchor="end">HIGH NEED / REQUIRES FEASIBILITY REVIEW</text>
        <text className="zone-label" x={pad + 10} y={pad + 20}>PHASE 2 OPPORTUNITY</text>
        <text className="zone-label" x={pad + 10} y={h - pad - 14}>LOWER IMMEDIATE PRIORITY</text>
        <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} />
        <line x1={pad} x2={pad} y1={pad} y2={h - pad} />
        <text x={w / 2} y={h - 8} textAnchor="middle">Healthcare Accessibility Need</text>
        <text x={15} y={h / 2} transform={`rotate(-90 15 ${h / 2})`} textAnchor="middle">Flight Feasibility</text>
        {drawPoints.map(({ c, x, y, active }) => {
          return (
            <g key={c.corridor_id} onMouseEnter={() => setHoverId(c.corridor_id)} onMouseLeave={() => setHoverId(null)} onClick={(event) => { event.stopPropagation(); setSelectedId(c.corridor_id); }} className={`${active ? "matrix-point selected" : "matrix-point"} ${c.rank_baseline <= 3 ? "top-ranked" : ""}`}>
              {active && <circle className="point-halo" cx={x} cy={y} r="15" />}
              <circle cx={x} cy={y} r={active ? 13 : c.rank_baseline <= 3 ? 11 : 9} fill={classificationColors[c.final_classification_baseline]} stroke={active ? "#08263A" : c.rank_baseline <= 3 ? "#08263A" : "#fff"} strokeWidth={active ? "4" : c.rank_baseline <= 3 ? "2.5" : "3"} />
              <text className="rank-marker" x={x} y={y + 4} textAnchor="middle">#{c.rank_baseline}</text>
              <title>{`${c.destination_commune_old}
Rank #${c.rank_baseline}
Healthcare need: ${fmt(c.medical_accessibility_need_score, 3)}
Flight feasibility: ${fmt(c.flight_feasibility_score, 3)}
Priority score: ${fmt(c.priority_score_baseline, 3)}
Recommendation class: ${displayClass(c.final_classification_baseline)}`}</title>
            </g>
          );
        })}
        {annotations.map((label) => {
          const moved = Math.hypot(label.labelX - label.point.x, label.labelY - label.point.y) > 26;
          return (
            <g key={`label-${label.point.c.corridor_id}`} className={label.point.active ? "matrix-label selected" : "matrix-label"}>
              {moved && <line className="leader-line" x1={label.point.x} y1={label.point.y} x2={label.labelX - (label.anchor === "start" ? 7 : label.anchor === "end" ? -7 : 0)} y2={label.labelY - 6} />}
              <text x={label.labelX} y={label.labelY} textAnchor={label.anchor}>
                <tspan>{label.point.c.destination_commune_old}</tspan>
                <tspan x={label.labelX} dy="14" className="label-detail">#{label.point.c.rank_baseline} · {displayClass(label.point.c.final_classification_baseline)} · Need {fmt(label.point.c.medical_accessibility_need_score, 3)} · Feas. {fmt(label.point.c.flight_feasibility_score, 3)} · Priority {fmt(label.point.c.priority_score_baseline, 3)}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <Legend />
    </div>
  );
}

function MissionPlanner({ data, selected, setSelectedId, setScreen, planningMonth, setPlanningMonth }) {
  const [missionType, setMissionType] = useState("Essential Medicine");
  const [payload, setPayload] = useState("1.5");
  const [urgency, setUrgency] = useState("Urgent");
  const [evaluated, setEvaluated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const selectedMonth = data.weather.find((item) => item.month === planningMonth) || data.weather[0];
  const monthCategory = weatherCategory(selectedMonth, data.weather);
  const label = selected.final_classification_baseline === "LAUNCH" ? "LAUNCH CANDIDATE" : selected.final_classification_baseline;
  function evaluate(event) {
    event.preventDefault();
    if (!Number.isFinite(Number(payload)) || Number(payload) <= 0) return;
    setEvaluated(true);
  }
  return (
    <>
      <section className="screen planner-grid mission-request">
        <form className="workflow-panel" onSubmit={evaluate} onChange={() => { setEvaluated(false); setReviewOpen(false); }}>
          <SectionTitle eyebrow="Define mission" title="Mission request" compact />
          <label className="mission-field">Origin
            <input value="Mường Ảng District Health Center" readOnly />
          </label>
          <label className="mission-field">Destination
            <select value={selected.corridor_id} onChange={(e) => setSelectedId(e.target.value)}>
              {data.corridors.map((c) => <option key={c.corridor_id} value={c.corridor_id}>{c.destination_commune_old}</option>)}
            </select>
          </label>
          <label className="mission-field">Cargo Type
            <select value={missionType} onChange={(e) => setMissionType(e.target.value)}>
              <option>Essential Medicine</option><option>Emergency Consumables</option><option>Diagnostic Kit</option><option>Medical Supplies</option>
            </select>
          </label>
          <label className="mission-field">Payload (kg)
            <input type="number" min="0.01" step="any" required value={payload} onChange={(e) => setPayload(e.target.value)} aria-describedby="mission-context-note" />
          </label>
          <label className="mission-field">Urgency
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option>Routine</option><option>High</option><option>Urgent</option>
            </select>
          </label>
          <p className="mission-note" id="mission-context-note">Cargo, payload, and urgency are planning context only. They do not change the existing baseline scores or modeled times; payload compatibility requires review.</p>
          <button className="context-action mission-evaluate" type="submit">Evaluate Mission <ArrowRight size={18} /></button>
          <details className="mission-seasonal-input">
            <summary>Seasonal planning context</summary>
            <label className="mission-field">Planning month
              <select value={planningMonth} onChange={(e) => setPlanningMonth(Number(e.target.value))}>
                {data.weather.map((item) => <option key={item.month} value={item.month}>{months[item.month - 1]}</option>)}
              </select>
            </label>
          </details>
        </form>
        <div className="screening-panel">
          {!evaluated ? <div className="mission-empty" role="status">
            <Plane size={36} />
            <h2>Evaluate a medical supply request</h2>
            <p>Confirm the mission inputs, then select Evaluate Mission to see the existing baseline recommendation and Road vs UAV comparison.</p>
          </div> : <>
            <div role="status" aria-live="polite">
              <SectionTitle eyebrow="MISSION RECOMMENDATION" title={selected.destination_commune_old} />
              <div className={`screening-label ${clsClass(selected.final_classification_baseline)}`}>{label}</div>
              <p className="mission-note">{missionType} · {payload} kg · {urgency}</p>
            </div>
            <div className="mission-kpis">
              <Kpi label="Healthcare Need" value={fmt(selected.medical_accessibility_need_score, 2)} note="Existing need score / 1" />
              <Kpi label="Road Time" value={fmt(selected.road_time_base_min)} unit="min" />
              <Kpi label="UAV Time" value={fmt(selected.uav_mission_time_base_min)} unit="min" />
              <Kpi label="Time Saved" value={fmt(selected.time_saved_base_min)} unit="min" />
              <Kpi label="Flight Feasibility" value={fmt(selected.flight_feasibility_score, 2)} note="Preliminary score / 1" />
              <Kpi label="Priority Rank" value={`#${selected.rank_baseline}`} note="Baseline scenario" />
            </div>
            <p className="decision-copy">{selected.corridor_id === "HF001_HF004"
              ? `${selected.destination_commune_old} is recommended because it combines meaningful healthcare-access disadvantage, high modeled time savings, and strong preliminary flight feasibility.`
              : recommendationText(selected)}</p>
            <p className="mission-note mission-safety">SkyBridge provides preliminary mission prioritization. Final operation requires current weather, airspace, aircraft-status, and operator verification.</p>
            <RoadUavMap data={data} selected={selected} />
            <div className="planner-actions">
              <button className="review-button" onClick={() => setReviewOpen(true)}>Review corridor details</button>
              <button className="context-action secondary" onClick={() => setScreen("seasonal")}>Review seasonal context</button>
            </div>
          </>}
        </div>
      </section>
      {evaluated && reviewOpen && <MissionReviewPanel selected={selected} origin={selected.origin_name} missionType={missionType} payload={payload} selectedMonth={selectedMonth} monthCategory={monthCategory} onClose={() => setReviewOpen(false)} />}
    </>
  );
}

function RoadUavMap({ data, selected }) {
  const containerRef = useRef(null);
  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, attributionControl: false, zoomAnimation: false }).setView([selected.origin_lat, selected.origin_lon], 11);
    L.geoJSON(data.boundary, { style: { color: "#506f82", weight: 2, fillColor: "#edf3f6", fillOpacity: 0.7 } }).addTo(map);
    L.geoJSON(data.communeBoundaries, { style: { color: "#506f82", weight: 1, dashArray: "3 5", fillOpacity: 0 } }).addTo(map);
    const origin = [selected.origin_lat, selected.origin_lon];
    const destination = [selected.destination_lat, selected.destination_lon];
    L.polyline([origin, destination], { color: "#ffffff", weight: 8 }).addTo(map);
    L.polyline([origin, destination], { color: "#00A89D", weight: 4, dashArray: "8 6" })
      .bindTooltip("Direct UAV corridor · schematic aerial link").addTo(map);
    const markerLabel = (title, subtitle) => {
      const label = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = title;
      label.append(name, document.createElement("br"), document.createTextNode(subtitle));
      return label;
    };
    L.circleMarker(origin, { radius: 8, color: "#fff", weight: 3, fillColor: "#08263A", fillOpacity: 1 })
      .bindTooltip(markerLabel("District Health Center", selected.origin_name), { permanent: true, direction: "bottom", offset: [0, 10] }).addTo(map);
    L.circleMarker(destination, { radius: 8, color: "#fff", weight: 3, fillColor: "#00A89D", fillOpacity: 1 })
      .bindTooltip(markerLabel(selected.destination_commune_old, selected.destination_name), { permanent: true, direction: "top", offset: [0, -10] }).addTo(map);
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(L.latLngBounds([origin, destination]), { padding: [90, 75], maxZoom: 13, animate: false });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(containerRef.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [data, selected]);
  return (
    <section className="mission-comparison" aria-label="Road vs UAV comparison">
      <SectionTitle eyebrow="Selected corridor" title="Road vs UAV" compact />
      <div className="mission-route-metrics">
        <div className="mission-road"><span>ROAD</span><strong>{fmt(selected.road_time_base_min)} <small>min</small></strong><p>{fmt(selected.road_distance_km, 2)} km modeled network distance</p></div>
        <div className="mission-air"><span>UAV</span><strong>{fmt(selected.uav_mission_time_base_min)} <small>min</small></strong><p>{fmt(selected.candidate_aerial_distance_km, 2)} km modeled aerial distance</p></div>
        <div className="mission-saving"><span>TIME SAVED</span><strong>{fmt(selected.time_saved_base_min)} <small>min saved</small></strong><p>{fmt(selected.detour_ratio, 2)}× road / straight-line distance</p></div>
      </div>
      <div ref={containerRef} className="mission-route-map" role="region" aria-label={`District Health Center to ${selected.destination_commune_old}: direct UAV corridor map`} />
      <p className="mission-map-note"><span className="mission-air-key" /> Teal dashed line: direct UAV corridor approximation. The modeled aerial distance includes the existing route factor; the line is not a surveyed flight path.</p>
      <p className="mission-map-note mission-road-note">ROAD: modeled travel time and distance only. No road-route or network geometry is stored in this project, so no road path is drawn. Map context uses the existing district and commune boundaries.</p>
    </section>
  );
}
function MissionReviewPanel({ selected, origin, missionType, payload, selectedMonth, monthCategory, onClose }) {
  const required = [
    "Operator verification",
    "Current weather verification",
    "Airspace / applicable authorization review",
    "Aircraft and payload compatibility",
    "Applicable aviation procedures"
  ];
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="mission-review-panel" onClick={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>Close</button>
        <span className="eyebrow">PLANNING ASSESSMENT ONLY</span>
        <h2>Detailed Review: {selected.destination_commune_old}</h2>
        <p className="review-intro">This review packages the existing screening evidence for human assessment. It is not operational authorization.</p>
        <div className="review-groups">
          <EvidenceGroup title="Mission" items={[["Origin", origin], ["Destination", selected.destination_name], ["Mission type", missionType], ["Payload", `${payload || "n/a"} kg`]]} />
          <EvidenceGroup title="Modeled performance" items={[["Road ETA", fmt(selected.road_time_base_min, 1, " min")], ["UAV ETA", fmt(selected.uav_mission_time_base_min, 1, " min")], ["Time saved", fmt(selected.time_saved_base_min, 1, " min")], ["Aerial distance", fmt(selected.candidate_aerial_distance_km, 1, " km")]]} />
          <EvidenceGroup title="Seasonal overlay" items={[["Planning month", months[selectedMonth.month - 1]], ["Context", monthCategory.short], ["Weather risk", fmt(selectedMonth.monthly_weather_risk_score, 3)], ["Priority impact", "No baseline score change"]]} />
        </div>
        <ScoreGrid selected={selected} expanded />
        <div className="required-review">
          <h3>Required before field operation</h3>
          {required.map((item) => <p key={item}><CheckCircle2 size={15} /> {item}</p>)}
        </div>
      </aside>
    </div>
  );
}

function ScenarioLab({ data, selected, setSelectedId, setScreen }) {
  const [scenario, setScenario] = useState("Baseline");
  const field = scenarioFields[scenario];
  const ranked = [...data.corridors].sort((a, b) => a[field] - b[field]);
  const robust = data.corridors.filter((c) => c.top3_scenario_count === 4);
  const changed = scenarioWhatChanged(scenario, data.corridors);
  return (
    <section className="screen scenario-grid">
      <main className="analysis-area">
        <div className="scenario-hero">
          <span>{robust.length} corridors remain Top-3</span>
          <strong>ACROSS ALL FOUR SCENARIOS</strong>
          <p>{robust.map((c) => c.destination_commune_old).join(" · ")}</p>
        </div>
        <div className="segmented">
          {Object.keys(scenarioFields).map((name) => <button key={name} className={scenario === name ? "active" : ""} onClick={() => setScenario(name)}>{name}</button>)}
        </div>
        <SectionTitle eyebrow="Decision robustness" title={`${scenario} ranking`} />
        <div className="what-changed-card">
          <span>What changed?</span>
          <p>{changed.emphasis}</p>
          <strong>{changed.mover}</strong>
          <em>{changed.stability}</em>
        </div>
        <div className="scenario-list">
          {ranked.map((c) => {
            const movement = c.rank_baseline - c[field];
            return (
              <button key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
                <span>#{c[field]}</span><strong>{c.destination_commune_old}</strong><Badge className={c.final_classification_baseline}>{displayClass(c.final_classification_baseline)}</Badge><em>{movement === 0 ? "no move" : movement > 0 ? `up ${movement}` : `down ${Math.abs(movement)}`}</em>
              </button>
            );
          })}
        </div>
        <div className="scenario-sensitivity-card">
          <span>Scenario sensitivity</span>
          <p>{scenarioSensitivityText(selected)}</p>
        </div>
      </main>
      <aside className="robust-panel">
        <h3>ROBUST TOP-3</h3>
        {data.corridors.filter((c) => c.top3_scenario_count === 4).map((c) => (
          <button key={c.corridor_id} onClick={() => setSelectedId(c.corridor_id)} className={c.corridor_id === selected.corridor_id ? "selected robust-card" : "robust-card"}>
            <CheckCircle2 size={18} /><strong>{c.destination_commune_old}</strong><span>Top-3 in 4/4 scenarios</span>
          </button>
        ))}
        <RankStability data={data} selected={selected} setSelectedId={setSelectedId} />
        <button className="context-action inline" onClick={() => setScreen("decision")}>Evaluate selected corridor</button>
      </aside>
    </section>
  );
}

function SeasonalOperations({ data, selected, setSelectedId, setScreen, planningMonth, setPlanningMonth }) {
  const month = planningMonth;
  const selectedMonth = data.weather.find((item) => item.month === month) || data.weather[0];
  const wettest = [...data.weather].sort((a, b) => b.precipitation_total_mean - a.precipitation_total_mean)[0];
  const lowerMonths = data.weather
    .map((item) => ({ ...item, category: weatherCategory(item, data.weather) }))
    .filter((item) => item.category.tone === "teal")
    .map((item) => item.month);
  const higherMonths = data.weather
    .map((item) => ({ ...item, category: weatherCategory(item, data.weather) }))
    .filter((item) => item.category.tone === "amber")
    .map((item) => item.month);
  const lowerWindow = contiguousWindows(lowerMonths);
  const higherWindow = contiguousWindows(higherMonths);
  const category = weatherCategory(selectedMonth, data.weather);
  const precipRank = weatherRank(data.weather, selectedMonth.month, "precipitation_total_mean", true);
  const windRank = weatherRank(data.weather, selectedMonth.month, "mean_wind_speed_mean", true);
  return (
    <section className="screen seasonal-readiness">
      <div className="seasonal-toolbar">
        <label>
          <span>Corridor</span>
          <select value={selected.corridor_id} onChange={(event) => setSelectedId(event.target.value)}>
            {data.corridors.map((corridor) => <option key={corridor.corridor_id} value={corridor.corridor_id}>{corridor.destination_commune_old}</option>)}
          </select>
        </label>
        <div>
          <strong>Best planning context: {windowLabel(lowerWindow)} · Higher seasonal caution: {windowLabel(higherWindow)}</strong>
          <p>Seasonal readiness supplements corridor prioritization; it does not change the baseline priority score or determine flight safety.</p>
        </div>
      </div>
      <div className="corridor-context-strip">
        <ScorePill label="Healthcare Need" value={fmt(selected.medical_accessibility_need_score, 3)} state={scoreState(selected.medical_accessibility_need_score).label} />
        <ScorePill label="UAV Benefit" value={fmt(selected.uav_benefit_score, 3)} state={scoreState(selected.uav_benefit_score).label} />
        <ScorePill label="Flight Feasibility" value={fmt(selected.flight_feasibility_score, 3)} state={scoreState(selected.flight_feasibility_score).label} />
        <ScorePill label="Baseline Operational Risk" value={fmt(selected.operational_risk_score, 3)} state={scoreState(selected.operational_risk_score, true).label} />
        <ScorePill label="Baseline Recommendation" value={displayClass(selected.final_classification_baseline)} state={`Rank #${selected.rank_baseline}`} />
      </div>
      <div className="readiness-insights">
        <InsightCard label="Lower-friction planning window" value={windowLabel(lowerWindow)} note="Lowest relative monthly weather-risk group in the loaded climatology." />
        <InsightCard label="Highest seasonal caution" value={windowLabel(higherWindow)} note={`${months[wettest.month - 1]} is the wettest month in the source data; wetter-season months increase planning friction.`} />
        <div className="baseline-status-card">
          <span>Selected corridor baseline status</span>
          <strong>{displayClass(selected.final_classification_baseline)}</strong>
          <p>{selected.destination_commune_old} remains rank #{selected.rank_baseline}; seasonal readiness is an overlay, not a recalculation.</p>
        </div>
      </div>
      <section className="seasonal-strip-card">
        <SectionTitle eyebrow="Seasonal planning context" title="12-month readiness overlay" compact />
        <div className="seasonal-month-strip">
          {data.weather.map((item) => {
            const itemCategory = weatherCategory(item, data.weather);
            return (
              <button key={item.month} className={`${item.month === month ? "active" : ""} ${itemCategory.tone}`} onClick={() => setPlanningMonth(item.month)}>
                <strong>{months[item.month - 1]}</strong>
                <span>{itemCategory.short}</span>
                <small>{fmt(item.monthly_weather_risk_score, 3)}</small>
              </button>
            );
          })}
        </div>
      </section>
      <div className="seasonal-main-grid">
        <main className="trend-panel">
          <SeasonalTrend title="Precipitation" field="precipitation_total_mean" unit="mm" data={data.weather} month={month} type="bar" />
          <SeasonalTrend title="Wind" field="mean_wind_speed_mean" unit="m/s" data={data.weather} month={month} />
          <SeasonalTrend title="Temperature" field="mean_temperature_mean" unit="C" data={data.weather} month={month} />
          <div className="seasonal-method-note">
            <h3>How to read this overlay</h3>
            <p>Month categories use the loaded monthly weather-risk score as a relative annual planning context: the lowest-risk group is labeled lower friction, the highest-risk group is labeled higher seasonal caution, and the remaining months are moderate. These labels do not alter the corridor priority score or determine flight safety.</p>
            <p><strong>Why this month?</strong> {seasonalDriver(selectedMonth, data.weather)}</p>
          </div>
        </main>
        <aside className="month-decision-card">
          <span className="eyebrow">Selected month decision context</span>
          <h2>{months[selectedMonth.month - 1]} Planning Context</h2>
          <div className={`seasonal-category ${category.tone}`}>{category.label}</div>
          <div className="month-metric-list">
            <p><span>Mean monthly precipitation</span><strong>{fmt(selectedMonth.precipitation_total_mean, 1, " mm")}</strong><em>{ordinal(precipRank)} wettest month</em></p>
            <p><span>Mean wind speed</span><strong>{fmt(selectedMonth.mean_wind_speed_mean, 2, " m/s")}</strong><em>{ordinal(windRank)} highest annual wind</em></p>
            <p><span>Mean temperature</span><strong>{fmt(selectedMonth.mean_temperature_mean, 1, " C")}</strong><em>Historical monthly mean</em></p>
            <p><span>Monthly weather risk</span><strong>{fmt(selectedMonth.monthly_weather_risk_score, 3)}</strong><em>Relative planning context score</em></p>
          </div>
          <div className="why-month">
            <h3>Why this matters</h3>
            <p>{seasonalDriver(selectedMonth, data.weather)}</p>
          </div>
        </aside>
      </div>
      <section className="seasonal-overlay">
        <div>
          <span>Baseline corridor status</span>
          <strong>{displayClass(selected.final_classification_baseline)}</strong>
        </div>
        <ArrowRight size={19} />
        <div>
          <span>Selected month planning overlay</span>
          <strong>{category.label}</strong>
        </div>
        <ArrowRight size={19} />
        <div className="overlay-result">
          <span>Planning interpretation</span>
          <strong>{seasonalOverlayText(selected, selectedMonth, data.weather)}</strong>
        </div>
        <button onClick={() => setScreen("decision")}>Open in Decision Workspace</button>
      </section>
    </section>
  );
}

function SeasonalTrend({ title, field, unit, data, month, type = "line" }) {
  const values = data.map((item) => item[field]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = data.map((item, index) => {
    const x = 28 + index * 45;
    const y = 130 - ((item[field] - min) / range) * 92;
    return { item, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  return (
    <div className="trend-card">
      <div>
        <span>{title}</span>
        <strong>{fmt(data.find((item) => item.month === month)?.[field], title === "Wind" ? 2 : 1, ` ${unit}`)}</strong>
      </div>
      <svg viewBox="0 0 540 165" role="img" aria-label={`${title} annual trend`}>
        {[40, 85, 130].map((y) => <line key={y} x1="24" x2="524" y1={y} y2={y} className="trend-grid" />)}
        {type === "bar"
          ? points.map((point) => <rect key={point.item.month} x={point.x - 11} y={point.y} width="22" height={130 - point.y} rx="4" className={point.item.month === month ? "active-bar" : ""} />)
          : <path d={path} className="trend-line" />}
        {points.map((point) => (
          <g key={point.item.month}>
            {type !== "bar" && <circle cx={point.x} cy={point.y} r={point.item.month === month ? 6 : 4} className={point.item.month === month ? "active-dot" : ""} />}
            <text x={point.x} y="153" textAnchor="middle">{months[point.item.month - 1]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RankTable({ data, selected, setSelectedId }) {
  return (
    <aside className="rank-table">
      <h3>Ranked Corridors</h3>
      <table>
        <thead><tr><th>Rank</th><th>Destination</th><th>Need</th><th>Feas.</th><th>Priority <Tooltip text={priorityScoreTooltip} /></th></tr></thead>
        <tbody>
          {data.corridors.map((c) => (
            <tr key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
              <td>#{c.rank_baseline}</td><td>{c.destination_commune_old}</td><td>{fmt(c.medical_accessibility_need_score, 3)}</td><td>{fmt(c.flight_feasibility_score, 3)}</td><td>{fmt(c.priority_score_baseline, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

function RankStability({ data, selected, setSelectedId }) {
  const cols = Object.entries(scenarioFields);
  return (
    <div className="rank-movement">
      <h4>Rank movement</h4>
      <table>
        <thead><tr><th>Corridor</th>{cols.map(([name]) => <th key={name}>{name.replace(" First", "")}</th>)}</tr></thead>
        <tbody>
          {data.corridors.map((c) => (
            <tr key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}>
              <td>{c.destination_commune_old}</td>{cols.map(([name, field], index) => <td key={name} style={{ opacity: 1 - (c[field] - 1) * 0.07 }}><span>{index > 0 && <i>→</i>}#{c[field]}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreGrid({ selected, expanded = false }) {
  const scores = [
    ["Healthcare need", selected.medical_accessibility_need_score, "Access gap plus population component", false],
    ["UAV benefit", selected.uav_benefit_score, "Time saved, percentage saved, and detour ratio", false],
    ["Flight feasibility", selected.flight_feasibility_score, "Combined score using distance, payload, corridor terrain, and district-level weather", false],
    ["Corridor Terrain Feasibility", selected.terrain_feasibility_score_corridor, "Corridor terrain feasibility from corrected slope and a 500 m aerial-corridor buffer", false],
    ["Operational risk", selected.operational_risk_score, "Distance, terrain, and district-level climatological risk context", true],
    ["Priority score", selected.priority_score_baseline, "Baseline weighted score", false],
    ["Scenario robustness", `${selected.top3_scenario_count}/4`, selected.robustness_label === "ROBUST_TOP3" ? "Robust Top-3" : selected.robustness_label, false]
  ];
  return (
    <div className={expanded ? "score-grid expanded" : "score-grid"}>
      {scores.map(([label, value, note, risk]) => <ScoreBar key={label} label={label} value={value} note={note} risk={risk} />)}
    </div>
  );
}

function MethodologyDrawer({ data, onClose, lang }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>Close</button>
        <h2>Methodology / Data Notes</h2><MissionMethodology lang={lang}/>
        <h3>Data lineage</h3>
        <div className="lineage-flow">
          <span>Source data</span><i>↓</i><span>Modeled metrics</span><i>↓</i><span>Derived scores</span><i>↓</i><span>Decision screening</span>
        </div>
        <div className="provenance-grid">
          <Provenance label="Road network" type="MODELED FROM OSM" />
          <Provenance label="Population" type="SOURCE DATA" />
          <Provenance label="Weather" type="HISTORICAL CLIMATOLOGY" />
          <Provenance label="UAV ETA" type="MODELED" />
          <Provenance label="Flight feasibility" type="DERIVED" />
          <Provenance label="Priority score" type="DERIVED / SCENARIO-WEIGHTED" />
        </div>
        <h3>1. Source data</h3>
        <p>Corridor priority is loaded from the terrain-v2 ranked export, with supporting monthly weather, health facilities, commune master, access-gap ranking, and UAV assumptions. Boundary GeoJSON comes from <code>data/processed/boundaries</code>.</p>
        <h3>2. Modeled metrics</h3>
        <p>Road distance/time, candidate aerial distance, UAV mission time, minutes saved, percent saved, flight feasibility, risk, and priority scores are project model outputs.</p>
        <h3>3. Derived scores</h3>
        <p>Healthcare need, UAV benefit, corridor terrain feasibility, flight feasibility, operational risk, baseline priority, classification, scenario ranks, and robustness are read from the terrain-v2 ranked corridor file. Weather remains district-level climatology. UI terms such as Very high, High, Moderate, Limited, and Low are transparent score-band labels for normalized 0-1 values; they do not change the underlying scores.</p>
        <h3>4. Operational assumptions</h3>
        <p>The UAV screen uses the loaded assumption record: {fmt(data.uav.cruise_speed_base_kmh, 0, " km/h")} base speed, {fmt(data.uav.aerial_route_factor, 1)} aerial route factor, {fmt(data.uav.fixed_mission_time_min, 0, " min")} fixed mission time, and {fmt(data.uav.reference_effective_one_way_radius_km, 0, " km")} reference one-way radius.</p>
        <h3>5. Limitations</h3>
        <p>No actual origin-to-destination road-route polylines were found; maps show direct candidate UAV links and numeric road-network estimates only. Weather is monthly climatological/historical planning context, not real-time aviation weather or corridor-specific weather. Seasonal readiness is an additional planning overlay based on the loaded monthly weather-risk score; it does not authorize or prohibit UAV operations and does not alter UAV mission time. Feasibility is preliminary and rankings depend on project methodology.</p>
        <h3>Verified key finding</h3>
        <p>{data.corridors[0].destination_commune_old} is baseline rank #{data.corridors[0].rank_baseline}, classified {displayClass(data.corridors[0].final_classification_baseline)}, with {fmt(data.corridors[0].road_time_base_min)} min road time, {fmt(data.corridors[0].uav_mission_time_base_min)} min UAV time, {fmt(data.corridors[0].time_saved_base_min)} min saved, and Top-3 in {data.corridors[0].top3_scenario_count}/4 scenarios.</p>
      </aside>
    </div>
  );
}

function Kpi({ label, value, unit, note }) {
  return <div className="kpi"><span>{label}</span><strong>{value}{unit && <em>{unit}</em>}</strong><small>{note}</small></div>;
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric"><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>;
}

function Badge({ className, children }) {
  return <span className={`badge ${clsClass(className)}`}>{children}</span>;
}

function Legend() {
  return <div className="legend">{Object.entries(classificationColors).map(([label, color]) => <span key={label}><i style={{ background: color }} />{displayClass(label)}</span>)}</div>;
}

function Tooltip({ text }) {
  return <span className="tooltip"><HelpCircle size={14} /><em>{text}</em></span>;
}

function ScoreBar({ label, value, note, risk }) {
  const numeric = typeof value === "number";
  const state = numeric ? scoreState(value, risk) : { label: note, tone: value === "4/4" ? "teal" : "blue" };
  const isPriority = label === "Priority score";
  return (
    <div className={`score-card ${state.tone}`}>
      <span>{label}{isPriority && <Tooltip text={priorityScoreTooltip} />}</span>
      <strong>{numeric ? fmt(value, 3) : value}<small>{state.label}</small></strong>
      {numeric && <div className="score-track"><i style={{ width: `${Math.max(5, Math.min(100, value * 100))}%` }} /></div>}
      <p>{note}</p>
    </div>
  );
}

function InsightCard({ label, value, note }) {
  return <div className="insight-card"><span>{label}</span><strong>{value}</strong><p>{note}</p></div>;
}

function ScorePill({ label, value, state }) {
  return <div className="score-pill"><span>{label}</span><strong>{value}</strong><em>{state}</em></div>;
}

function EvidenceGroup({ title, items }) {
  return (
    <div className="evidence-group">
      <h3>{title}</h3>
      {items.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
    </div>
  );
}

function Provenance({ label, type }) {
  return <div className="provenance"><strong>{label}</strong><span>{type}</span></div>;
}

function FlowItem({ title, value }) {
  return <div><strong>{title}</strong><span>{value}</span></div>;
}

function Step({ number, title, children }) {
  return <div className="step"><b>{number}</b><div><h3>{title}</h3>{children}</div></div>;
}

function SectionTitle({ eyebrow, title, compact = false }) {
  return <div className={compact ? "section-title compact" : "section-title"}><span>{eyebrow}</span><h2>{title}</h2></div>;
}

function ScenarioStudio({ data, selected, setSelectedId, setScreen, draft, setDraft, lang }) {
  const [mode, setMode] = useState("operational");
  const draftMatchesSelection = draft && draft.originId === selected.origin_id && draft.destinationId === selected.destination_id;
  const baselineForm = useMemo(() => ({...defaults, ...(draftMatchesSelection ? draft : {}), originId:selected.origin_id, destinationId:selected.destination_id}), [selected.corridor_id, draft, draftMatchesSelection]);
  const [params, setParams] = useState(() => ({...defaults}));
  useEffect(() => setParams({...defaults, ...Object.fromEntries(Object.keys(defaults).filter((k) => baselineForm[k] !== undefined).map((k) => [k, baselineForm[k]]))}), [selected.corridor_id]);
  const origin = data.health.find((f) => f.facility_id === baselineForm.originId) || data.health.find((f) => f.facility_id === selected.origin_id);
  const destination = data.health.find((f) => f.facility_id === baselineForm.destinationId) || data.health.find((f) => f.facility_id === selected.destination_id);
  const base = calculateMission({...defaults, origin, destination}, data.corridors);
  const modified = calculateMission({...params, origin, destination}, data.corridors);
  const recommendationChanged = base.recommendation !== modified.recommendation;
  const constraintsChanged = base.violations.join(",") !== modified.violations.join(",");
  const scenarioOptions = Object.entries(scenarioFields);
  const [strategic, setStrategic] = useState("Baseline");
  const rankField = scenarioFields[strategic];
  const ranked = [...data.corridors].sort((a,b) => a[rankField] - b[rankField]);
  const movers = ranked.map((c) => ({...c, movement:c.rank_baseline-c[rankField]}));
  const risers = movers.filter((c) => c.movement>0).sort((a,b) => b.movement-a.movement);
  const fallers = movers.filter((c) => c.movement<0).sort((a,b) => a.movement-b.movement);
  const selectedMovement = selected.rank_baseline-selected[rankField];
  const meta = scenarioMetadata[strategic];
  const selectScenarioCorridor = (id) => {
    const corridor = data.corridors.find((c) => c.corridor_id === id);
    if (!corridor) return;
    setSelectedId(id);
    setDraft((current) => ({...defaults,...(current||{}),originId:corridor.origin_id,destinationId:corridor.destination_id,templateId:id}));
  };
  const t = (en,vi) => lang === "vi" ? vi : en;
  return <section className="scenario-studio" data-native-language="true">
    <div className="subnav" role="tablist"><button className={mode === "operational" ? "active" : ""} onClick={() => setMode("operational")}>{t("Operational what-if","Giả định vận hành")}</button><button className={mode === "strategic" ? "active" : ""} onClick={() => setMode("strategic")}>{t("Strategic prioritization","Ưu tiên chiến lược")}</button></div>
    {mode === "operational" ? <div className="whatif-grid">
      <aside className="whatif-controls"><h2>{t("Operational assumptions","Giả định vận hành")}</h2><label>{t("Corridor","Tuyến")}<select value={selected.corridor_id} onChange={(e) => selectScenarioCorridor(e.target.value)}>{data.corridors.map((c) => <option key={c.corridor_id} value={c.corridor_id}>#{c.rank_baseline} {c.destination_commune_old}</option>)}</select></label>{[
        ["uavSpeedKmh","Cruise speed (km/h)",20,100,1],["detourFactor","Flight detour factor",1,2,.01],["handlingMinutes","Handling time (min)",0,60,1],["maxRangeKm","One-way range (km)",1,50,.5],["capacityKg","Payload capacity (kg)",.5,10,.1],["payloadKg","Payload weight (kg)",.1,10,.1]
      ].map(([key,label,min,max,step]) => <label key={key}>{label}<div className="range-control"><input type="range" min={min} max={max} step={step} value={params[key]} onChange={(e) => setParams((p) => ({...p,[key]:Number(e.target.value)}))}/><input aria-label={label} type="number" min={min} max={max} step={step} value={params[key]} onChange={(e) => setParams((p) => ({...p,[key]:Number(e.target.value)}))}/></div></label>)}<button onClick={() => setParams({...defaults})}><RotateCcw size={15}/> {t("Reset to Baseline","Đặt lại cơ sở")}</button></aside>
      <main className="whatif-results"><span className="eyebrow">{t("Baseline vs modified","Cơ sở và điều chỉnh")}</span><h2>{selected.destination_commune_old}</h2><div className="scenario-comparison-table"><div className="scenario-comparison-head"><span>{t("Metric","Chỉ số")}</span><strong>{t("Baseline","Cơ sở")}</strong><strong>{t("Modified","Điều chỉnh")}</strong><em>{t("Change","Thay đổi")}</em></div>{[["Modeled flight distance",base.flightDistanceKm,modified.flightDistanceKm," km"],["UAV mission time",base.uavTimeMinutes,modified.uavTimeMinutes," min"],["Potential time saved",base.minutesSaved,modified.minutesSaved," min"],["Time reduction",base.percentageSaved,modified.percentageSaved,"%"]].map(([label,a,b,unit]) => {const delta=a==null||b==null?null:b-a;return <div key={label} className={delta!==null&&Math.abs(delta)>.05?"changed":""}><span>{label}</span><strong>{a==null?"—":fmt(a,1,unit)}</strong><strong>{b==null?"—":fmt(b,1,unit)}</strong><em>{delta===null?"—":Math.abs(delta)<=.05?t("No change","Không đổi"):`${delta>0?"+":""}${fmt(delta,1,unit)}`}</em></div>})}</div><div className="constraint-compare"><div><span>{t("Baseline constraints","Giới hạn cơ sở")}</span><strong className={base.violations.length?"fail":"pass"}>{base.violations.length?`Fail: ${base.violations.join(", ")}`:"Pass"}</strong></div><ArrowRight size={17}/><div><span>{t("Modified constraints","Giới hạn điều chỉnh")}</span><strong className={modified.violations.length?"fail":"pass"}>{modified.violations.length?`Fail: ${modified.violations.join(", ")}`:"Pass"}</strong></div></div><div className={`recommendation-banner ${modified.recommendation}`}><span>{recommendationChanged?t("Recommendation changed","Khuyến nghị đã thay đổi"):t("Recommendation unchanged","Khuyến nghị không đổi")}</span><strong>{modified.recommendation === "high" ? "UAV Candidate — High Potential" : modified.recommendation === "conditional" ? "UAV Candidate — Conditional Pilot" : modified.recommendation === "infeasible" ? "Not Feasible Under Selected Constraints" : modified.recommendation === "road" ? "Road Preferred" : "Insufficient Data"}</strong><p>{recommendationChanged ? (modified.violations.length ? `The modified ${modified.violations.join(" and ")} constraint now fails.` : "The modeled travel-time relationship crossed a recommendation threshold.") : constraintsChanged ? "Constraint status changed, but the recommendation category did not." : "The recommendation and constraint status are stable under these assumptions."}</p></div><p className="evidence-note">Weather, terrain, healthcare need, and corridor scores are not recalculated because the supplied model defines no causal relationship from these controls.</p></main>
    </div> : <div className="strategic-mode"><div className="scenario-explainer"><h2>{t("Validated decision scenarios","Các kịch bản quyết định đã xác thực")}</h2><p>{t("The repository does not include the executable weighting pipeline. To avoid inventing weights, this studio uses the four source-backed score and rank scenarios exactly as exported.","Kho mã không có quy trình trọng số có thể chạy. Để không tạo trọng số giả, studio sử dụng đúng bốn kịch bản điểm và hạng trong dữ liệu xuất.")}</p><div className="scenario-buttons">{scenarioOptions.map(([name]) => <button className={strategic === name ? "active" : ""} key={name} onClick={() => setStrategic(name)}>{name}</button>)}</div><div className="scenario-objective"><span>Research objective</span><strong>{meta.objective}</strong><small>Source: {meta.source}</small></div></div><div className="strategic-table"><table><thead><tr><th>Scenario rank</th><th>Corridor</th><th>Baseline</th><th>Movement</th><th>Scenario score</th><th>Need</th><th>Benefit</th><th>Feasibility</th><th>Risk ↑</th></tr></thead><tbody>{ranked.map((c) => {const scoreField = rankField.replace("rank_","priority_score_"); const move = c.rank_baseline-c[rankField]; return <tr key={c.corridor_id} className={c.corridor_id === selected.corridor_id ? "selected" : ""} onClick={() => setSelectedId(c.corridor_id)}><td>#{c[rankField]}</td><td>{c.destination_commune_old}</td><td>#{c.rank_baseline}</td><td className={move > 0 ? "rise" : move < 0 ? "fall" : ""}>{move > 0 ? `↑ ${move}` : move < 0 ? `↓ ${Math.abs(move)}` : "—"}</td><td>{fmt(c[scoreField],4)}</td><td>{fmt(c.medical_accessibility_need_score,3)}</td><td>{fmt(c.uav_benefit_score,3)}</td><td>{fmt(c.flight_feasibility_score,3)}</td><td>{fmt(c.operational_risk_score,3)}</td></tr>})}</tbody></table></div><div className="ranking-explanation"><h3>Why did rankings change?</h3><div><p><strong>Largest risers:</strong> {risers.length?risers.slice(0,3).map((c)=>`${c.destination_commune_old} (+${c.movement})`).join(", "):"No corridors rise in this scenario."}</p><p><strong>Largest fallers:</strong> {fallers.length?fallers.slice(0,3).map((c)=>`${c.destination_commune_old} (${c.movement})`).join(", "):"No corridors fall in this scenario."}</p></div><p>{meta.cue}</p><p><strong>{selected.destination_commune_old}:</strong> {selectedMovement>0?`rises ${selectedMovement} place${selectedMovement===1?"":"s"}`:selectedMovement<0?`falls ${Math.abs(selectedMovement)} place${selectedMovement===-1?"":"s"}`:"does not move"}. Its available components are need {fmt(selected.medical_accessibility_need_score,3)}, benefit {fmt(selected.uav_benefit_score,3)}, feasibility {fmt(selected.flight_feasibility_score,3)}, and risk {fmt(selected.operational_risk_score,3)}. These are context for interpretation, not proof of the unpublished scenario formula.</p></div><RankStability data={data} selected={selected} setSelectedId={setSelectedId}/><button onClick={() => setStrategic("Baseline")}><RotateCcw size={15}/> Reset to Baseline</button><p className="mission-note">This is a sensitivity experiment, not an objectively optimal policy. Scenario scores and ranks are loaded from the research export; the browser does not recompute weights.</p></div>}
  </section>;
}

function EvidenceMethodology(props) {
  const [section, setSection] = useState("method");
  return <section className="evidence-page">
    <div className="subnav"><button className={section === "method" ? "active" : ""} onClick={() => setSection("method")}>Methods & sources</button><button className={section === "seasonal" ? "active" : ""} onClick={() => setSection("seasonal")}>Seasonal readiness</button><button className={section === "limits" ? "active" : ""} onClick={() => setSection("limits")}>Policy & limitations</button></div>
    {section === "method" && <div className="method-page"><div className="workflow-diagram">{["Geographic data","Accessibility analysis","UAV modeling","Feasibility & risk","Multi-criteria priority","Recommendation"].map((item,i) => <React.Fragment key={item}><span>{item}</span>{i<5&&<ArrowRight size={17}/>}</React.Fragment>)}</div><div className="method-grid"><article><h2>How SkyBridge works</h2><MissionMethodology lang={props.lang}/></article><article><h2>Data source roles</h2><EvidenceGroup title="Externally sourced / input evidence" items={[["OpenStreetMap network","Preprocessed road metrics"],["WorldPop 2023","Proportional population estimate"],["Facility coordinates","Source provenance unverified"],["Monthly climate observations","Historical planning context"]]}/><EvidenceGroup title="Research outputs and assumptions" items={[["terrain-v2 corridor export","Precomputed scores and ranks"],["UAV speed / range / payload","Scenario assumptions"],["Mission recommendation","Deterministic V3 policy"]]}/></article></div></div>}
    {section === "seasonal" && <SeasonalOperations {...props}/>} 
    {section === "limits" && <div className="limits-grid"><article><h2>Policy context</h2><p>Điện Biên’s low-altitude sandbox context is evidence of a controlled policy opportunity. It is not authorization for a particular route, aircraft, operator, cargo, or flight.</p><p>Every candidate requires applicable airspace review, operator approval, current weather verification, aircraft and payload compatibility, and site validation.</p></article><article><h2>Material limitations</h2><ul><li>Facility coordinates have unverified source provenance; Ẳng Nưa uses a commune-centroid fallback.</li><li>No road-route geometry is supplied. Numerical road estimates are precomputed OSM-network model outputs.</li><li>UAV times are modeled estimates, not telemetry.</li><li>No live weather, aircraft telemetry, permit validation, or terrain-clearance routing is connected.</li><li>Weather evidence is district-level climatology, not route-specific aviation weather.</li><li>The full executable composite-weight pipeline is absent; source scores and scenario ranks are preserved rather than reverse-engineered.</li></ul></article></div>}
  </section>;
}
createRoot(document.getElementById("root")).render(<App />);
