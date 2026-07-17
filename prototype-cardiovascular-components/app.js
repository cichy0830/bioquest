const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-u18-u20-assets-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_cardiovascular_components_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "cardiovascular_components",
  unit_title: "人體心血管系統的組成",
  mission_title: "心血管零件辨識任務",
  mission_area: "心血管調度中心"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "assets/owl-cardiovascular-components-prep-report.webp",
  owlReport: "assets/owl-cardiovascular-components-prep-report.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  // Visual team handoff names stay documented below; only set real WebP paths after approval.
  briefingSceneHook: "assets/cardiovascular-components-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: "assets/cardiovascular-components-entry-wide.webp",
  questionHeartMap: "cardiovascular-components-heart-map",
  questionVesselCompare: "cardiovascular-components-vessel-compare",
  questionBloodComponents: "cardiovascular-components-blood-components",
  questionPulsePressure: "cardiovascular-components-pulse-pressure"
};

const badgeAsset = (id) => `../shared-assets/badges/cardiovascular_components/badge-cardiovascular_components-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["心血管", "心臟", "心房", "心室", "瓣膜", "血管", "動脈", "靜脈", "微血管", "血液", "血漿", "紅血球", "白血球", "血小板", "脈搏", "血壓", "幫浦", "單向", "防禦", "止血", "氧氣", "物質交換"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["心臟", "心房與心室", "瓣膜", "動脈靜脈微血管", "血液成分", "脈搏", "血壓"]
};

const badges = [
  ["cardiovascular_components_entry", "心血管調度入門徽章", "完成心血管零件辨識任務。"],
  ["cardiovascular_overview_mapper", "心血管組成總覽徽章", "能判斷心臟、血管與血液共同組成系統。"],
  ["heart_pump_identifier", "心臟幫浦辨識徽章", "能連結心臟收縮舒張與推動血液。"],
  ["atria_ventricles_valves_mapper", "心房心室瓣膜分工徽章", "能分辨心房接收、心室推出與瓣膜單向功能。"],
  ["vessel_type_classifier", "血管類型分類徽章", "能用離心、回心與交換判斷血管。"],
  ["vessel_structure_function_judge", "血管構造功能徽章", "能連結管壁、彈性、管徑與功能。"],
  ["blood_component_function_matcher", "血液成分功能徽章", "能配對血漿、白血球、血小板與功能。"],
  ["red_blood_cell_oxygen_carrier", "紅血球運氧徽章", "能連結紅血球與氧氣運送。"],
  ["pulse_pressure_interpreter", "脈搏血壓判讀徽章", "能判斷脈搏與心跳、血壓與血管壁壓力。"],
  ["cardiovascular_flow_sequencer", "心血管合作流程徽章", "能排序心臟、血管、微血管交換與血液成分合作流程。"],
  ["cardiovascular_misconception_reviser", "心血管迷思修正徽章", "提示後修正本單元心血管迷思。"],
  ["cardiovascular_components_flawless", "心血管零提示全對徽章", "全部答對且全程未使用提示。"],
  ["cardiovascular_components_reflection_reporter", "高品質心血管回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_cardiovascular_components", "再探心血管調度進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => {
  const readyIds = new Set(["cardiovascular_components_entry", "cardiovascular_components_flawless"]);
  return { id, name, condition, badge_image_path: badgeAsset(id), image_status: readyIds.has(id) ? "ready" : "pending" };
});

const sequenceSteps = [
  { id: "heart_contracts", label: "心臟收縮提供推動力量" },
  { id: "blood_enters_vessels", label: "血液在血管中流動" },
  { id: "blood_components_carry", label: "血液成分在流動中攜帶氧氣、養分、廢物等物質" },
  { id: "capillary_exchange", label: "微血管附近有利血液和組織進行物質交換" }
];
const correctSequence = sequenceSteps.map((step) => step.id);

const questions = [
  {id:"cardiovascular_components_q01",section:"checkpoint1",concept:"cardiovascular_overview",type:"choice",answer:"heart_vessels_blood",prompt:"人體需要把氧氣、養分和廢物運送到不同位置。下列哪一組最能代表心血管系統的主要組成？",hint:"想想需要有推動來源、運輸通道和實際攜帶物質的液體。",misconception:"heart_only_system",options:[{id:"heart_vessels_blood",text:"心臟、血管、血液"},{id:"bones_muscles_skin",text:"骨骼、肌肉、皮膚"},{id:"alveoli_trachea_nose",text:"肺泡、氣管、鼻腔"},{id:"stomach_intestines",text:"胃、小腸、大腸"}]},
  {id:"cardiovascular_components_q02",section:"checkpoint1",concept:"heart_pump",type:"choice",answer:"push_blood_flow",prompt:"若把心臟想成身體裡的幫浦，最主要是在強調心臟哪一項功能？",hint:"注意「幫浦」的線索，想想它和液體移動有什麼關係。",misconception:"heart_storage_only",options:[{id:"push_blood_flow",text:"推動血液流動"},{id:"make_oxygen",text:"製造氧氣"},{id:"digest_food",text:"分解食物"},{id:"filter_urine",text:"過濾尿液"}]},
  {id:"cardiovascular_components_q03",section:"checkpoint1",concept:"atria_ventricles",type:"mapping",prompt:"請將心臟構造與較主要的功能配對。",hint:"先從「接收、推出、避免逆流」三個功能線索判斷。",misconception:"atria_ventricles_confusion",items:[{id:"atria",label:"心房"},{id:"ventricles",label:"心室"},{id:"valves",label:"瓣膜"}],choices:[{id:"receive_blood",text:"主要接收血液"},{id:"push_blood_out",text:"主要把血液推出心臟"},{id:"one_way_flow",text:"協助血液單向流動"}],answer:{atria:"receive_blood",ventricles:"push_blood_out",valves:"one_way_flow"}},
  {id:"cardiovascular_components_q04",section:"checkpoint1",concept:"atria_ventricles",type:"choice",answer:"atria_receive_ventricles_push",prompt:"心臟示意圖中，上方腔室與下方腔室功能不同。下列哪個說法較合理？",hint:"看位置線索時，也要連到血液進入與推出的功能差異。",misconception:"atria_ventricles_confusion",options:[{id:"atria_receive_ventricles_push",text:"心房多和接收血液有關，心室多和推出血液有關"},{id:"atria_grind_food",text:"心房負責磨碎食物"},{id:"ventricles_make_blood_cells",text:"心室只負責製造血球"},{id:"same_function",text:"心房和心室功能完全相同"}]},
  {id:"cardiovascular_components_q05",section:"checkpoint1",concept:"valves_direction",type:"choice",answer:"valves_reduce_backflow",prompt:"有同學說：「心臟裡的血液可以任意往前或往後流。」哪個修正較合理？",hint:"想像瓣膜像單向門，重點是方向控制。",misconception:"valves_unimportant",options:[{id:"valves_reduce_backflow",text:"瓣膜可幫助血液朝固定方向流動，減少逆流"},{id:"valves_make_red_cells",text:"瓣膜負責製造紅血球"},{id:"blood_never_moves",text:"血液在心臟內完全不流動"},{id:"valves_color_heart",text:"瓣膜只負責讓心臟變紅"}]},
  {id:"cardiovascular_components_q06",section:"checkpoint2",concept:"vessel_types",type:"mapping",prompt:"請將血管類型與主要方向或功能配對。",hint:"先不要用紅藍顏色判斷，改用血液相對於心臟的流動方向與交換功能。",misconception:"artery_vein_oxygen_rule",items:[{id:"artery",label:"動脈"},{id:"vein",label:"靜脈"},{id:"capillary",label:"微血管"}],choices:[{id:"away_from_heart",text:"通常把血液帶離心臟"},{id:"back_to_heart",text:"通常把血液帶回心臟"},{id:"exchange_near_tissue",text:"利於血液和組織進行物質交換"}],answer:{artery:"away_from_heart",vein:"back_to_heart",capillary:"exchange_near_tissue"}},
  {id:"cardiovascular_components_q07",section:"checkpoint2",concept:"vessel_types",type:"choice",answer:"direction_not_oxygen_only",prompt:"有同學說：「動脈一定流含氧血，靜脈一定流缺氧血。」哪個修正較合理？",hint:"回想血管命名先看相對於心臟的方向，不是只看顏色或氧氣多寡。",misconception:"artery_vein_oxygen_rule",options:[{id:"direction_not_oxygen_only",text:"動脈和靜脈主要依血液離開或回到心臟來區分，不能只用含氧量判斷"},{id:"artery_no_pressure",text:"動脈一定沒有血壓"},{id:"vein_no_blood",text:"靜脈一定不流血"},{id:"capillary_heart_only",text:"微血管只存在心臟裡"}]},
  {id:"cardiovascular_components_q08",section:"checkpoint2",concept:"vessel_structure_function",type:"choice",answer:"artery",prompt:"某種血管管壁較厚、彈性較明顯，較能承受心臟推出血液時的壓力。這比較像哪一類血管的特徵？",hint:"想想哪類血管最常接收心臟剛推出的血液。",misconception:"same_vessel_structure",options:[{id:"artery",text:"動脈"},{id:"capillary",text:"微血管"},{id:"lymph_vessel",text:"淋巴管"},{id:"bile_duct",text:"膽管"}]},
  {id:"cardiovascular_components_q09",section:"checkpoint2",concept:"vessel_structure_function",type:"choice",answer:"capillary",prompt:"哪一種血管很細、分布廣，較適合讓血液和組織細胞附近進行物質交換？",hint:"注意「很細、分布廣、靠近組織」這些線索。",misconception:"same_vessel_structure",options:[{id:"capillary",text:"微血管"},{id:"large_artery",text:"動脈主幹"},{id:"large_vein",text:"大靜脈"},{id:"trachea",text:"氣管"}]},
  {id:"cardiovascular_components_q10",section:"checkpoint3",concept:"blood_components",type:"mapping",prompt:"請將血液成分與主要功能配對。",hint:"先把「液體部分、氧氣運送、防禦、止血」四個功能分開看。",misconception:"blood_only_red_cells",items:[{id:"plasma",label:"血漿"},{id:"red_blood_cell",label:"紅血球"},{id:"white_blood_cell",label:"白血球"},{id:"platelet",label:"血小板"}],choices:[{id:"liquid_transport",text:"液體部分，可運送多種物質"},{id:"oxygen_transport",text:"主要和氧氣運送有關"},{id:"defense",text:"和身體防禦有關"},{id:"clotting",text:"和止血有關"}],answer:{plasma:"liquid_transport",red_blood_cell:"oxygen_transport",white_blood_cell:"defense",platelet:"clotting"}},
  {id:"cardiovascular_components_q11",section:"checkpoint3",concept:"red_blood_cells",type:"choice",answer:"red_blood_cell",prompt:"血液中哪一種成分最常被連到氧氣運送？",hint:"想想哪一種血液成分數量多，且和血液呈紅色及氧氣運送常被連在一起。",misconception:"blood_cell_function_confusion",options:[{id:"red_blood_cell",text:"紅血球"},{id:"platelet",text:"血小板"},{id:"gastric_juice",text:"胃液"},{id:"bile",text:"膽汁"}]},
  {id:"cardiovascular_components_q12",section:"checkpoint3",concept:"white_platelets_plasma",type:"mapping",prompt:"請將下列情境與較相關的血液成分配對。",hint:"先看題目中的功能詞：防禦、止血、液體運輸。",misconception:"blood_cell_function_confusion",items:[{id:"defense_case",label:"身體防禦"},{id:"wound_clotting",label:"傷口止血"},{id:"liquid_environment",label:"運送養分和廢物的液體環境"}],choices:[{id:"white_blood_cell",text:"白血球"},{id:"platelet",text:"血小板"},{id:"plasma",text:"血漿"}],answer:{defense_case:"white_blood_cell",wound_clotting:"platelet",liquid_environment:"plasma"}},
  {id:"cardiovascular_components_q13",section:"checkpoint3",concept:"pulse_blood_pressure",type:"choice",answer:"heartbeat_vessel_pulse",prompt:"手腕摸到的脈搏，最直接和下列哪一項活動有關？",hint:"想想脈搏是一下一下的搏動感，和哪個器官規律收縮最相關。",misconception:"pulse_pressure_confusion",options:[{id:"heartbeat_vessel_pulse",text:"心臟跳動造成血管搏動"},{id:"stomach_digestion",text:"胃消化食物"},{id:"bone_growth",text:"骨骼長高"},{id:"alveoli_make_rbc",text:"肺泡製造紅血球"}]},
  {id:"cardiovascular_components_q14",section:"checkpoint3",concept:"pulse_blood_pressure",type:"choice",answer:"pressure_on_vessel_wall",prompt:"血壓的基礎意義較接近下列哪一項？",hint:"注意「壓」這個字，想想血液在血管中流動時會對血管壁造成什麼。",misconception:"pulse_pressure_confusion",options:[{id:"pressure_on_vessel_wall",text:"血液對血管壁的壓力"},{id:"blood_sugar_taste",text:"血液中糖分的味道"},{id:"rbc_color_depth",text:"紅血球的顏色深淺"},{id:"wbc_fixed_count",text:"白血球的數量一定值"}]},
  {id:"cardiovascular_components_q15",section:"checkpoint3",concept:"cardiovascular_overview",type:"sequence",prompt:"請拖曳排序卡，依「推動 → 流動與攜帶 → 交換」的基礎關係整理心血管系統如何合作。這不是體循環或肺循環的路徑題。",hint:"先找推動來源，再想血液在流動時會做什麼，最後找最利於交換的位置。",misconception:"heart_only_system",steps:sequenceSteps,answer:correctSequence}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["cardiovascular_components_q01", "cardiovascular_components_q02", "cardiovascular_components_q03", "cardiovascular_components_q04", "cardiovascular_components_q05"],
  checkpoint2: ["cardiovascular_components_q06", "cardiovascular_components_q07", "cardiovascular_components_q08", "cardiovascular_components_q09"],
  checkpoint3: ["cardiovascular_components_q10", "cardiovascular_components_q11", "cardiovascular_components_q12", "cardiovascular_components_q13", "cardiovascular_components_q14", "cardiovascular_components_q15"]
};
const requiredQuestionIds = questions.map((question) => question.id);

const titleLevels = [
  { id: "trainee_investigator", need: 0, title: "見習調查員" },
  { id: "life_observer", need: 500, title: "生命觀察員" },
  { id: "ecology_recorder", need: 1500, title: "生態記錄員" },
  { id: "concept_solver", need: 3000, title: "概念解謎者" },
  { id: "micro_explorer", need: 5200, title: "微觀探索者" },
  { id: "systems_investigator", need: 8000, title: "系統調查員" },
  { id: "life_researcher", need: 11800, title: "生命研究員" },
  { id: "bioquest_expert", need: 16700, title: "BioQuest 專家" },
  { id: "bioquest_guardian", need: 23400, title: "生命祕境守護者" }
];

function createEmptyState() {
  return {
    screen: "login",
    student: null,
    attempt_id: "",
    attempt_session_token: "",
    attempt_session_id: "",
    previous_attempt_id: "",
    question_version: VERSION,
    verification_mode: "local_guest",
    optionOrders: {},
    answers: {},
    hints: {},
    hintEventStatus: {},
    submitted: false,
    submitLockedAt: "",
    completedScreens: ["login"],
    reflection: { confident: "", question: "", confidence: "3" },
    result: null,
    notice: ""
  };
}

let state = loadState();

function loadState() {
  if (typeof localStorage === "undefined") return createEmptyState();
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    return parsed && parsed.question_version ? { ...createEmptyState(), ...parsed } : createEmptyState();
  } catch (error) {
    return createEmptyState();
  }
}

function saveState() {
  if (typeof localStorage !== "undefined") localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadAttempts() {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(attemptsKey) || "[]");
  } catch (error) {
    return [];
  }
}

function saveAttemptRecord(attempt) {
  if (typeof localStorage === "undefined") return;
  const attempts = loadAttempts().filter((item) => item.attempt_id !== attempt.attempt_id);
  attempts.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sameSet(a, b) {
  const aa = [...(a || [])].sort();
  const bb = [...(b || [])].sort();
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

function sameMapping(value, answer) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(answer).every((key) => value[key] === answer[key]));
}

function questionAnswered(question) {
  const value = answerValue(question.id);
  if (question.type === "choice") return typeof value === "string" && value.length > 0;
  if (question.type === "mapping") return Boolean(value && Object.keys(question.answer).every((key) => value[key]));
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length;
  if (question.type === "set") return Array.isArray(value) && value.length > 0;
  return false;
}

function answerValue(qid) {
  const question = questionMap[qid];
  if (question.type === "sequence") return state.answers[`${qid}_sequence`] || [];
  return state.answers[qid];
}

function isCorrect(qid) {
  const question = questionMap[qid];
  const value = answerValue(qid);
  if (question.type === "choice") return value === question.answer;
  if (question.type === "mapping") return sameMapping(value, question.answer);
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length && value.every((id, index) => id === question.answer[index]);
  if (question.type === "set") return sameSet(value, question.answer);
  return false;
}

function stableShuffle(items, seed) {
  const copy = [...items];
  let value = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) || 37;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const swap = value % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function orderedOptions(question) {
  if (!state.optionOrders[question.id]) {
    const ids = (question.type === "sequence" ? question.steps : question.options || []).map((item) => item.id);
    state.optionOrders[question.id] = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`);
  }
  const source = Object.fromEntries((question.type === "sequence" ? question.steps : question.options || []).map((item) => [item.id, item]));
  return state.optionOrders[question.id].map((id) => source[id]).filter(Boolean);
}

function formatSelected(question) {
  const value = answerValue(question.id);
  if (question.type === "choice") return question.options.find((option) => option.id === value)?.text || "尚未選擇";
  if (question.type === "mapping") {
    const choices = Object.fromEntries(question.choices.map((item) => [item.id, item.text]));
    return question.items.map((item) => `${item.label}：${choices[value?.[item.id]] || "尚未選擇"}`).join("；");
  }
  if (question.type === "sequence") {
    const labels = Object.fromEntries(question.steps.map((item) => [item.id, item.label]));
    return (value || []).map((id) => labels[id]).join(" → ") || "尚未排序";
  }
  if (question.type === "set") {
    return (value || []).map((id) => question.options.find((option) => option.id === id)?.text).filter(Boolean).join("、") || "尚未選擇";
  }
  return "尚未選擇";
}

function titleAvatarPath(student = state.student) {
  const gender = student?.profile_gender === "female" ? "female" : "male";
  const fallback = `../shared-assets/title-avatars/title-01-trainee_investigator-${gender}.webp`;
  const rawPath = student?.title_avatar_path || student?.progress?.title_avatar_path || fallback;
  if (rawPath.startsWith("../") || rawPath.startsWith("http")) return rawPath;
  if (rawPath.startsWith("shared-assets/")) return `../${rawPath}`;
  return fallback;
}

function titleAndProgress(student = state.student, localGain = 0) {
  const remoteTotal = Number(student?.progress?.total_exp ?? student?.total_exp);
  const localTotal = loadAttempts()
    .filter((attempt) => attempt.student_id === student?.student_id && attempt.unit_id !== mission.unit_id)
    .reduce((sum, attempt) => sum + Number(attempt.unit_credited_exp || 0), 0) + Number(localGain || 0);
  const explicitLevel = titleLevels.find((level) => level.id === (student?.current_title_id || student?.progress?.current_title_id));
  const totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, localTotal, explicitLevel?.need || 0);
  const current = titleLevels.filter((level) => totalExp >= level.need).at(-1) || titleLevels[0];
  const next = titleLevels.find((level) => level.need > totalExp) || null;
  return {
    totalExp,
    current,
    next,
    remaining: next ? Math.max(0, next.need - totalExp) : 0,
    progressPercent: Math.min(100, Math.round((totalExp / 23400) * 100))
  };
}

async function requestBackend(params) {
  const queryParams = params.action === "getStudentAndAttemptStatus"
    ? { ...params, _: String(Date.now()) }
    : { action: params.action, _: String(Date.now()) };
  const query = `?${new URLSearchParams(queryParams).toString()}`;
  const response = await fetch(`${BACKEND_URL}${query}`, {
    method: params.action === "getStudentAndAttemptStatus" ? "GET" : "POST",
    cache: "no-store",
    headers: params.action === "getStudentAndAttemptStatus" ? undefined : { "Content-Type": "text/plain;charset=utf-8" },
    body: params.action === "getStudentAndAttemptStatus" ? undefined : JSON.stringify(params)
  });
  if (!response.ok) throw new Error(`backend_http_${response.status}`);
  const data = await response.json();
  if (!data || data.ok === false) throw new Error(data?.error || "backend_error");
  return data;
}

function normalizeBackendStudent(data, inputId) {
  const student = data.student || data;
  if (!student || !student.student_id) throw new Error("student_not_found");
  return {
    student_id: String(student.student_id || inputId),
    class_name: String(student.class_name || student.class || ""),
    seat_no: String(student.seat_no || student.seat || ""),
    student_name: String(student.student_name || student.name || ""),
    profile_gender: student.profile_gender || student.gender || "male",
    total_exp: Number(student.total_exp || data.progress?.total_exp || 0),
    current_title_id: student.current_title_id || data.progress?.current_title_id || "",
    current_title: student.current_title || data.progress?.current_title || "",
    title_avatar_path: student.title_avatar_path || data.progress?.title_avatar_path || "",
    completed_attempts: Number(student.completed_attempts || data.completed_attempts || 0),
    progress: data.student_progress || data.progress || student.progress || {}
  };
}

function beginLocalAttempt(student) {
  const attemptId = uid("cardiovascular_components_guest_attempt");
  state = {
    ...createEmptyState(),
    student,
    attempt_id: attemptId,
    attempt_session_token: `guest_${attemptId}`,
    attempt_session_id: `guest_session_${attemptId}`,
    question_version: VERSION,
    verification_mode: "local_guest",
    screen: "brief",
    completedScreens: ["login", "brief"]
  };
  saveState();
}

async function handleLogin(useGuest) {
  const message = document.querySelector("#loginMessage");
  const input = document.querySelector("#studentId");
  const studentId = useGuest ? "guest" : String(input?.value || "").trim();
  if (!studentId) {
    if (message) message.textContent = "請輸入學號，或使用 guest 測試。";
    return;
  }
  window.BioQuestLoginUX?.begin({ guest: useGuest || studentId === "guest" });
  await window.BioQuestLoginUX?.paint();
  if (useGuest || studentId === "guest") {
    beginLocalAttempt(roster.guest);
    renderApp();
    return;
  }
  try {
    if (message) message.textContent = "正在連接 BioQuest 學習後台，請稍候……";
    const loginData = await requestBackend({ action: "getStudentAndAttemptStatus", student_id: studentId, unit_id: mission.unit_id });
    const student = normalizeBackendStudent(loginData, studentId);
    const startData = await requestBackend({
      action: "startAttempt",
      student_id: student.student_id,
      unit_id: mission.unit_id,
      question_version: VERSION
    });
    if (startData.verification_mode !== "server_verified" || !startData.attempt_session_token || startData.question_version !== VERSION) {
      throw new Error("backend_registry_not_ready");
    }
    state = {
      ...createEmptyState(),
      student,
      attempt_id: startData.attempt_id,
      attempt_session_token: startData.attempt_session_token,
      attempt_session_id: startData.attempt_session_id,
      previous_attempt_id: startData.previous_attempt_id || "",
      question_version: startData.question_version,
      verification_mode: startData.verification_mode,
      screen: "brief",
      completedScreens: ["login", "brief"]
    };
    saveState();
    renderApp();
  } catch (error) {
    state = createEmptyState();
    saveState();
    if (message) {
      message.textContent = error.message === "backend_registry_not_ready"
        ? "後台版本尚未更新，請通知老師。"
        : "無法連線或讀取 Google Sheet 學生資料，請稍後重試或通知老師。";
    }
  }
}

function setScreen(nextScreen) {
  if (state.submitted && LOCKED_SCREENS_AFTER_SUBMIT.has(nextScreen)) {
    state.notice = LOCK_MESSAGE;
    state.screen = "result";
  } else {
    state.screen = nextScreen;
    state.notice = "";
    if (!state.completedScreens.includes(nextScreen)) state.completedScreens.push(nextScreen);
  }
  saveState();
  renderApp();
}

function canUseNav(target) {
  if (target === "rules") return true;
  if (!state.student) return target === "login";
  if (state.submitted) return ["result", "achievements", "rules"].includes(target);
  return state.completedScreens.includes(target);
}

async function markHint(questionId) {
  if (state.hints[questionId]) return;
  state.hints[questionId] = true;
  state.hintEventStatus[questionId] = state.student?.is_guest ? "sent" : "pending";
  saveState();
  if (!state.student?.is_guest) await flushHintEvents([questionId]).catch(() => {});
}

async function flushHintEvents(ids = Object.keys(state.hintEventStatus)) {
  if (state.student?.is_guest) return true;
  const pending = ids.filter((id) => state.hintEventStatus[id] !== "sent");
  for (const questionId of pending) {
    try {
      await requestBackend({
        action: "hintEvent",
        student_id: state.student.student_id,
        unit_id: mission.unit_id,
        attempt_id: state.attempt_id,
        attempt_session_token: state.attempt_session_token,
        question_id: questionId,
        question_version: state.question_version
      });
      state.hintEventStatus[questionId] = "sent";
    } catch (error) {
      state.hintEventStatus[questionId] = "failed";
    }
  }
  saveState();
  return Object.values(state.hintEventStatus).every((status) => status === "sent");
}

function setAnswer(questionId, value) {
  const question = questionMap[questionId];
  if (state.submitted) return;
  state.answers[question.type === "sequence" ? `${questionId}_sequence` : questionId] = value;
  if (question.type === "choice" && value && value !== question.answer) markHint(questionId).then(renderApp);
  if (question.type === "mapping" && value && Object.entries(value).some(([key, selected]) => selected && selected !== question.answer[key])) markHint(questionId).then(renderApp);
  saveState();
  renderApp();
}

function toggleSetAnswer(questionId, optionId) {
  if (state.submitted) return;
  const current = new Set(state.answers[questionId] || []);
  if (current.has(optionId)) current.delete(optionId);
  else current.add(optionId);
  state.answers[questionId] = [...current];
  saveState();
  renderApp();
}

async function confirmSetAnswer(questionId) {
  if (!isCorrect(questionId)) await markHint(questionId);
  renderApp();
}

function moveSequence(questionId, itemId, direction) {
  if (state.submitted) return;
  const current = [...(state.answers[`${questionId}_sequence`] || orderedOptions(questionMap[questionId]).map((item) => item.id))];
  const index = current.indexOf(itemId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
  [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
  state.answers[`${questionId}_sequence`] = current;
  saveState();
  renderApp();
}

function initSequence(questionId) {
  if (!state.answers[`${questionId}_sequence`]) {
    state.answers[`${questionId}_sequence`] = orderedOptions(questionMap[questionId]).map((item) => item.id);
  }
}

function checkSection(section) {
  const ids = sections[section];
  return ids.every((id) => questionAnswered(questionMap[id]));
}

function nextAfterSection(section) {
  const next = { checkpoint1: "checkpoint2", checkpoint2: "checkpoint3", checkpoint3: "review" }[section];
  if (!checkSection(section)) {
    state.notice = "請先完成本區所有必答題；可以保留不確定，任務後會整理概念回饋。";
    saveState();
    renderApp();
    return;
  }
  const firstWrong = sections[section].filter((id) => !isCorrect(id) && !state.hints[id]);
  if (firstWrong.length) {
    Promise.all(firstWrong.map((id) => markHint(id))).then(() => {
      state.notice = "已為需要調整的題目開啟概念提示；閱讀後可以繼續下一段，不需要本次全部改到正確。";
      saveState();
      renderApp();
    });
    return;
  }
  setScreen(next);
}

function scoreAttempt() {
  const logs = requiredQuestionIds.map((id) => {
    const correct = isCorrect(id);
    return {
      question_id: id,
      answer: answerValue(id),
      is_correct: correct,
      hint_used: Boolean(state.hints[id]),
      skill_tag: questionMap[id].concept,
      misconception_tag: correct ? "" : questionMap[id].misconception
    };
  });
  const correctCount = logs.filter((log) => log.is_correct).length;
  const directCorrect = logs.filter((log) => log.is_correct && !log.hint_used).length;
  const revisedCorrect = logs.filter((log) => log.is_correct && log.hint_used).length;
  const hintUsed = logs.filter((log) => log.hint_used).length;
  const accuracy = correctCount / logs.length;
  const reflection = evaluateReflection();
  const completionExp = 100;
  const directExp = Math.round(DIRECT_EXP_POOL * (directCorrect / logs.length));
  const revisionExp = Math.round(REVISION_EXP_POOL * (revisedCorrect / logs.length));
  const masteryExp = correctCount === logs.length ? (hintUsed === 0 ? 140 : 80) : (accuracy >= 0.9 ? 50 : 0);
  const retryExp = 0;
  const rawExp = completionExp + directExp + revisionExp + reflection.question_exp + masteryExp + retryExp;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflection.question_exp)));
  const totalExp = Math.min(reflectionLedgerCap, rawExp);
  const earnedBadges = badgeIdsForScore(logs, reflection, retryExp, correctCount === logs.length && hintUsed === 0);
  return {
    unit_id: mission.unit_id,
    attempt_id: state.attempt_id,
    completion_status: "complete",
    verification_status: state.student?.is_guest ? "local_guest" : "pending_backend",
    total_questions: logs.length,
    correct_count: correctCount,
    accuracy,
    hint_used_count: hintUsed,
    direct_correct_count: directCorrect,
    revised_correct_count: revisedCorrect,
    completion_exp: completionExp,
    direct_exp: directExp,
    revision_exp: revisionExp,
    reflection_exp: reflection.question_exp,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_exp: totalExp,
    unit_credited_exp: totalExp,
    exp_delta: totalExp,
    logs,
    reflection,
    earned_badges: earnedBadges
  };
}

function badgeIdsForScore(logs, reflection, retryExp, flawless) {
  const byId = Object.fromEntries(logs.map((log) => [log.question_id, log]));
  const passed = (ids) => ids.every((id) => byId[id]?.is_correct);
  const correctedCore = logs.some((log) => log.is_correct && log.hint_used);
  const earned = [];
  earned.push("cardiovascular_components_entry");
  if (passed(["cardiovascular_components_q01", "cardiovascular_components_q15"])) earned.push("cardiovascular_overview_mapper");
  if (passed(["cardiovascular_components_q02"])) earned.push("heart_pump_identifier");
  if (passed(["cardiovascular_components_q03", "cardiovascular_components_q04", "cardiovascular_components_q05"])) earned.push("atria_ventricles_valves_mapper");
  if (passed(["cardiovascular_components_q06", "cardiovascular_components_q07"])) earned.push("vessel_type_classifier");
  if (passed(["cardiovascular_components_q08", "cardiovascular_components_q09"])) earned.push("vessel_structure_function_judge");
  if (passed(["cardiovascular_components_q10", "cardiovascular_components_q12"])) earned.push("blood_component_function_matcher");
  if (passed(["cardiovascular_components_q11"])) earned.push("red_blood_cell_oxygen_carrier");
  if (passed(["cardiovascular_components_q13", "cardiovascular_components_q14"])) earned.push("pulse_pressure_interpreter");
  if (passed(["cardiovascular_components_q15"])) earned.push("cardiovascular_flow_sequencer");
  if (correctedCore) earned.push("cardiovascular_misconception_reviser");
  if (flawless) earned.push("cardiovascular_components_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("cardiovascular_components_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_cardiovascular_components");
  return [...new Set(earned)];
}

function evaluateReflection() {
  const original = state.reflection.question || "";
  if (typeof window !== "undefined" && typeof window.evaluateReflectionQuality === "function") {
    return window.evaluateReflectionQuality(original, reflectionRules);
  }
  const normalized = normalizeText(original);
  if (!normalized) return reflectionResult("blank", 0, "空白可提交，但不給回報 EXP。", "auto", normalized, original);
  const irrelevant = reflectionRules.irrelevantTerms.some((term) => normalized.includes(normalizeText(term)));
  const lowEffort = reflectionRules.lowEffortTerms.some((term) => normalized === normalizeText(term) || normalized.includes(normalizeText(term)));
  const copied = reflectionRules.copiedDirections.some((term) => normalized === normalizeText(term));
  const matched = reflectionRules.conceptTerms.filter((term) => normalized.includes(normalizeText(term)));
  if (irrelevant || lowEffort || copied) return reflectionResult("invalid", 0, "回報目前較像玩笑、敷衍或複製方向，保留給老師複核但不給 EXP。", "auto", normalized, original, { irrelevant, lowEffort, copied });
  if (matched.length === 0) return reflectionResult("needs_review", 0, "尚未看出和本單元概念的明確關聯，交由老師複核。", "needs_review", normalized, original);
  if (normalized.length >= 24 && /為什麼|如何|怎麼|差異|關係|證據|判斷|影響|確認/.test(original)) return reflectionResult("discussion_question", 40, "能連結本單元概念並提出可討論的疑問。", "auto", normalized, original);
  if (normalized.length >= 12) return reflectionResult("specific_uncertainty", 30, "有連結本單元概念，但還可以再說明想確認的地方。", "auto", normalized, original);
  return reflectionResult("minimal_concept", 10, "有提到本單元概念，但內容仍偏簡短。", "auto", normalized, original);
}

function reflectionResult(quality, questionExp, reason, reviewStatus, normalized, original, flags = {}) {
  return {
    reflection_quality: quality,
    question_exp: questionExp,
    reflection_exp_reason: reason,
    reflection_review_status: reviewStatus,
    reflection_similarity_score: flags.copied ? 1 : 0,
    reflection_similarity_source: flags.copied ? "copied_direction" : "",
    reflection_copied_direction_flag: Boolean(flags.copied),
    reflection_irrelevant_flag: Boolean(flags.irrelevant),
    reflection_low_effort_flag: Boolean(flags.lowEffort),
    reflection_original_text: original,
    reflection_normalized_text: normalized
  };
}

function buildBackendPayload(result = scoreAttempt()) {
  const rawAnswers = {};
  result.logs.forEach((log) => { rawAnswers[log.question_id] = log.answer; });
  return {
    action: "submitAttempt",
    unit_id: mission.unit_id,
    unit_title: mission.unit_title,
    student_id: state.student.student_id,
    class_name: state.student.class_name,
    seat_no: state.student.seat_no,
    student_name: state.student.student_name,
    attempt_id: state.attempt_id,
    attempt_session_token: state.attempt_session_token,
    previous_attempt_id: state.previous_attempt_id,
    question_version: state.question_version,
    raw_answers: rawAnswers,
    raw_answers_json: JSON.stringify(rawAnswers),
    question_logs: result.logs.map((log) => ({
      question_id: log.question_id,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: questionMap[log.question_id]?.type || "",
      attempt_answer: log.answer,
      answer_json: JSON.stringify(log.answer),
      used_hint: log.hint_used,
      analysis_group: analysisGroupForQuestion(log.question_id),
      skill_tag: log.skill_tag,
      misconception_tag: log.misconception_tag
    })),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
}

function analysisGroupForQuestion(questionId) {
  if (sections.checkpoint1.includes(questionId)) return "heart_component_map";
  if (sections.checkpoint2.includes(questionId)) return "vessel_compare_lab";
  if (["cardiovascular_components_q10", "cardiovascular_components_q11", "cardiovascular_components_q12"].includes(questionId)) return "blood_component_cards";
  return "pulse_pressure_integration";
}

async function submitAttemptToBackend(payload) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  return requestBackend(payload);
}

function applyBackendSubmitResponse(response, localResult) {
  if (!response || response.ok === false) return localResult;
  const verified = response.verified_attempt || response.attempt || null;
  const progress = response.student_progress || response.progress || null;
  if (progress) {
    state.student.progress = progress;
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id;
    state.student.current_title = progress.current_title || state.student.current_title;
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path;
  }
  if (!verified) return { ...localResult, backend_response: response };
  return {
    ...localResult,
    verification_status: verified.verification_status || response.verification_status || "server_verified",
    correct_count: Number(verified.correct_count ?? localResult.correct_count),
    total_questions: Number(verified.total_questions ?? localResult.total_questions),
    accuracy: Number(verified.accuracy ?? localResult.accuracy),
    hint_used_count: Number(verified.hint_used_count ?? localResult.hint_used_count),
    completion_exp: Number(verified.completion_exp ?? localResult.completion_exp),
    direct_exp: Number(verified.direct_exp ?? localResult.direct_exp),
    revision_exp: Number(verified.revision_exp ?? localResult.revision_exp),
    reflection_exp: Number(verified.reflection_exp ?? localResult.reflection_exp),
    mastery_exp: Number(verified.mastery_exp ?? localResult.mastery_exp),
    retry_exp: Number(verified.retry_exp ?? localResult.retry_exp),
    attempt_exp: Number(verified.attempt_exp ?? localResult.attempt_exp),
    unit_credited_exp: Number(verified.unit_credited_exp ?? localResult.unit_credited_exp),
    exp_delta: Number(verified.credited_delta ?? verified.exp_delta ?? localResult.exp_delta),
    earned_badges: Array.isArray(verified.earned_badges) ? verified.earned_badges : localResult.earned_badges,
    backend_response: response
  };
}

async function submitMission() {
  if (!requiredQuestionIds.every((id) => questionAnswered(questionMap[id]))) {
    state.notice = "請先完成所有必答題，再提交任務。";
    saveState();
    renderApp();
    return;
  }
  if (typeof window !== "undefined" && !window.confirm("提交後會進入任務結算，本次作答不能再修改；若要再挑戰，需重新登入並從頭完成。確定提交嗎？")) return;
  const hintSynced = await flushHintEvents();
  if (!hintSynced && !state.student?.is_guest) {
    state.notice = "提示紀錄尚未同步成功，請稍後重試再提交，避免後台誤判零提示。";
    saveState();
    renderApp();
    return;
  }
  const localResult = scoreAttempt();
  let finalResult = localResult;
  try {
    finalResult = applyBackendSubmitResponse(await submitAttemptToBackend(buildBackendPayload(localResult)), localResult);
  } catch (error) {
    if (!state.student?.is_guest) {
      state.notice = "提交到後台時發生問題，本次正式認列尚未完成。請檢查網路後重試。";
      saveState();
      renderApp();
      return;
    }
  }
  state.result = finalResult;
  state.submitted = true;
  state.submitLockedAt = new Date().toISOString();
  state.screen = "result";
  for (const item of ["result", "achievements", "rules"]) {
    if (!state.completedScreens.includes(item)) state.completedScreens.push(item);
  }
  saveAttemptRecord({
    attempt_id: state.attempt_id,
    student_id: state.student.student_id,
    unit_id: mission.unit_id,
    unit_credited_exp: finalResult.unit_credited_exp,
    earned_badges: finalResult.earned_badges,
    submitted_at: state.submitLockedAt
  });
  saveState();
  renderApp();
}

function renderLogin() {
  return `
    <div class="wide-layout login-layout">
      <section class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">歡迎進入生命祕境</h2>
        <p class="lead">請先確認身份。登入後會開啟本次任務簡報。</p>
        <div class="login-card">
          <label for="studentId">學生學號</label>
          <input id="studentId" type="text" autocomplete="username" placeholder="例如 S70101">
          <div class="button-row">
            <button class="primary" id="loginBtn">登入任務</button>
            <button class="secondary" id="guestBtn">guest 測試</button>
          </div>
          <p class="muted" id="loginMessage">正式學生資料一律以 Google Sheet 後台為準；guest 僅供老師測試。</p>
        </div>
      </section>
    </div>
  `;
}

function renderBrief() {
  const titleInfo = titleAndProgress();
  const sceneAttrs = `${assets.briefingSceneHook ? ` data-asset-hook="${assets.briefingSceneHook}"` : ""}${assets.briefingSceneMobileHook ? ` data-mobile-hook="${assets.briefingSceneMobileHook}"` : ""}`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <div class="brief-scene cardiovascular-components-brief-scene"${sceneAttrs}>
          <div class="scene-copy">
            <p class="eyebrow">${mission.mission_area}</p>
            <h2>${mission.mission_title}</h2>
            <p>心血管調度中心收到一批人體運輸零件圖：心臟剖面、血管比較卡、血液成分卡與脈搏血壓紀錄。請用組成、功能、方向與資料線索協助判讀。</p>
          </div>
          <div class="title-avatar-brief">
            <img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.src='${assets.titleAvatarFallback}'">
            <div>
              <span>目前稱號</span>
              <strong>${escapeHtml(titleInfo.current.title)}</strong>
              <p>${titleInfo.totalExp} EXP</p>
            </div>
          </div>
        </div>
        <div class="button-row">
          <button class="primary" data-next="scan">查看進關卡提醒</button>
          <button class="secondary" data-next="rules">先看規則</button>
        </div>
      </section>
    </div>
  `;
}

function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入心血管調度中心前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚系統組成、心臟幫浦、血管方向與血液成分。</h3><p>心臟推動血液流動；血管包含動脈、靜脈、微血管；血液含血漿與血球等成分；脈搏與血壓是可觀察的基礎線索。</p></div></div><div class="concept-grid"><article><strong>組成</strong><p>心血管系統由心臟、血管與血液共同完成物質運送。</p></article><article><strong>心臟</strong><p>心房多接收血液，心室多推出血液，瓣膜協助單向流動。</p></article><article><strong>血管</strong><p>動脈通常離心，靜脈通常回心，微血管適合物質交換。</p></article><article><strong>血液</strong><p>血漿、紅血球、白血球與血小板各有不同功能。</p></article></div><button class="primary" data-next="checkpoint1">開始心血管零件判讀</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["心臟與系統總覽","用心臟、心房心室與瓣膜線索，整理心血管系統的基本組成。"], checkpoint2:["血管種類與功能比較","比較動脈、靜脈、微血管的方向、構造與物質交換功能。"], checkpoint3:["血液成分、脈搏血壓與合作流程","用配對、情境判斷與拖曳排序整理血液成分和整體合作流程。"] }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會給概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint3" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
}

function renderQuestion(question) {
  const evidence = renderQuestionEvidence(question.id);
  const hint = state.hints[question.id] ? `<div class="hint-box"><strong>提示</strong><p>${escapeHtml(question.hint)}</p></div>` : "";
  return `
    <article class="panel question-card" data-question-id="${question.id}">
      <p class="eyebrow">${question.id.toUpperCase()}｜${conceptLabel(question.concept)}</p>
      <h3>${escapeHtml(question.prompt)}</h3>
      ${evidence}
      ${renderQuestionControl(question)}
      <p class="selected-answer">已選：${escapeHtml(formatSelected(question))}</p>
      ${hint}
    </article>
  `;
}

function conceptLabel(concept) { return {cardiovascular_overview:"心血管組成總覽",heart_pump:"心臟幫浦",atria_ventricles:"心房心室瓣膜",valves_direction:"瓣膜與單向流動",vessel_types:"血管類型",vessel_structure_function:"血管構造功能",blood_components:"血液成分",red_blood_cells:"紅血球運氧",white_platelets_plasma:"白血球血小板血漿",pulse_blood_pressure:"脈搏與血壓"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (qid === "cardiovascular_components_q01") return `<div class="evidence-card"><strong>系統零件卡</strong><p>一套運輸系統需要推動來源、通道，以及實際攜帶物質的液體。</p></div>`;
  if (qid === "cardiovascular_components_q03" || qid === "cardiovascular_components_q04" || qid === "cardiovascular_components_q05") return `<div class="evidence-card"><strong>心臟構造卡</strong><p>心房、心室與瓣膜的判斷重點是接收、推出與單向流動。</p></div>`;
  if (qid === "cardiovascular_components_q06" || qid === "cardiovascular_components_q07") return `<div class="evidence-card"><strong>血管方向卡</strong><p>先用血液相對於心臟的方向與交換功能判斷，不只看顏色或含氧量。</p></div>`;
  if (qid === "cardiovascular_components_q08" || qid === "cardiovascular_components_q09") return `<div class="evidence-card evidence-table"><strong>血管比較資料</strong><table><thead><tr><th>線索</th><th>可判斷方向</th></tr></thead><tbody><tr><td>管壁較厚、彈性明顯</td><td>常承受心臟推出血液的壓力</td></tr><tr><td>很細、分布廣、靠近組織</td><td>利於物質交換</td></tr></tbody></table></div>`;
  if (qid === "cardiovascular_components_q10" || qid === "cardiovascular_components_q12") return `<div class="evidence-card"><strong>血液成分卡</strong><p>血液不只紅血球，還包含血漿、白血球與血小板等不同成分。</p></div>`;
  if (qid === "cardiovascular_components_q13" || qid === "cardiovascular_components_q14") return `<div class="evidence-card"><strong>觀察紀錄卡</strong><p>脈搏是一下一下的血管搏動感；血壓要看血液對血管壁的壓力。</p></div>`;
  if (qid === "cardiovascular_components_q15") return `<div class="evidence-card"><strong>合作流程排序卡</strong><p>排序題只整理心臟、血管、微血管交換與血液成分的基礎合作，不要求背完整體循環或肺循環路徑。</p></div>`;
  return "";
}

function renderQuestionControl(question) {
  if (question.type === "choice") return renderChoiceQuestion(question);
  if (question.type === "mapping") return renderMappingQuestion(question);
  if (question.type === "sequence") return renderSequenceQuestion(question);
  if (question.type === "set") return renderSetQuestion(question);
  return "";
}

function renderChoiceQuestion(question) {
  const selected = state.answers[question.id];
  return `<div class="option-grid">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected === option.id ? "selected" : ""}" data-answer="${question.id}" data-value="${option.id}">
      ${escapeHtml(option.text)}
    </button>
  `).join("")}</div>`;
}

function renderMappingQuestion(question) {
  const current = state.answers[question.id] || {};
  return `<div class="mapping-list">${question.items.map((item) => `
    <label class="mapping-row">
      <span>${escapeHtml(item.label)}</span>
      <select data-map-question="${question.id}" data-map-item="${item.id}">
        <option value="">尚未選擇</option>
        ${question.choices.map((choice) => `<option value="${choice.id}" ${current[item.id] === choice.id ? "selected" : ""}>${escapeHtml(choice.text)}</option>`).join("")}
      </select>
    </label>
  `).join("")}</div>`;
}

function renderSequenceQuestion(question) {
  initSequence(question.id);
  const labels = Object.fromEntries(question.steps.map((step) => [step.id, step.label]));
  return `<div class="sequence-list" data-sequence="${question.id}">
    ${(state.answers[`${question.id}_sequence`] || []).map((id, index) => `
      <article class="sequence-item" draggable="true" data-sequence-item="${id}">
        <span class="sequence-number">${index + 1}</span>
        <strong>${escapeHtml(labels[id])}</strong>
        <div class="sequence-actions">
          <button class="icon-btn" data-move="${question.id}" data-item="${id}" data-dir="-1" aria-label="上移">↑</button>
          <button class="icon-btn" data-move="${question.id}" data-item="${id}" data-dir="1" aria-label="下移">↓</button>
        </div>
      </article>
    `).join("")}
  </div>`;
}

function renderSetQuestion(question) {
  const selected = new Set(state.answers[question.id] || []);
  return `<div class="option-grid multi-grid">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected.has(option.id) ? "selected" : ""}" data-toggle-set="${question.id}" data-value="${option.id}">
      <span class="checkbox-dot">${selected.has(option.id) ? "✓" : ""}</span>${escapeHtml(option.text)}
    </button>
  `).join("")}</div>
  <div class="multi-check-row">
    <button class="secondary" data-confirm-set="${question.id}">確認這組答案</button>
    <span class="muted">未確認的部分選取不會記提示。</span>
  </div>`;
}

function conceptFeedback() {
  const missed = requiredQuestionIds.filter((id) => !isCorrect(id)).map((id) => questionMap[id].misconception);
  const unique = [...new Set(missed)];
  const stable = requiredQuestionIds.filter((id) => isCorrect(id) && !state.hints[id]).map((id) => conceptLabel(questionMap[id].concept));
  return { missed: unique, stable: [...new Set(stable)] };
}

function renderReview() {
  const result = scoreAttempt();
  const feedback = conceptFeedback();
  const stateName = result.accuracy >= 1 && result.hint_used_count === 0 ? "excellent" : result.accuracy >= .86 ? "strong" : result.accuracy >= .64 ? "stable" : result.accuracy >= .4 ? "needs_review" : "retry_ready";
  return `
    <div class="mission-layout review-layout" data-feedback-state="${stateName}">
      <section class="panel">
        <p class="eyebrow">概念回饋</p>
        <h2>先整理你目前的心血管組成線索</h2>
        <p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的方向。</p>
        <div class="feedback-columns">
          <article>
            <h3>目前較穩定</h3>
            <ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
          <article>
            <h3>建議再確認</h3>
            <ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
        </div>
        <button class="primary" data-next="reflection">前往任務回報</button>
      </section>
      <aside class="panel mentor-card" data-feedback-state="${stateName}">
        <img src="../shared-assets/mentor-feedback/mentor-feedback-${stateName}.webp" alt="阿澤老師回饋" onerror="this.src='${assets.mentorFallback}'">
        <h3>${feedbackTitle(stateName)}</h3>
        <p>請把不確定的概念轉成課堂上想確認的方向。</p>
      </aside>
    </div>
  `;
}

function misconceptionText(tag) { return {heart_only_system:"心血管系統不是只有心臟，還包含血管與血液。",heart_storage_only:"心臟像幫浦，收縮舒張可推動血液流動。",atria_ventricles_confusion:"心房主要接收血液，心室主要把血液推出心臟。",valves_unimportant:"瓣膜像單向門，可幫助血液朝固定方向流動。",artery_vein_oxygen_rule:"動脈和靜脈先看血液離開或回到心臟，不只用含氧量判斷。",same_vessel_structure:"動脈、靜脈與微血管的構造不同，功能也不同。",blood_only_red_cells:"血液除了紅血球，也有血漿、白血球與血小板。",blood_cell_function_confusion:"紅血球和氧氣運送有關，白血球和防禦有關，血小板和止血有關。",pulse_pressure_confusion:"脈搏是血管搏動感，血壓是血液對血管壁的壓力。",advanced_medical_overreach:"本單元先抓組成、功能與基礎觀察意義，不做疾病診斷。"}[tag] || tag; }

function feedbackTitle(stateName) {
  return {
    excellent: "概念連線非常穩定",
    strong: "概念掌握良好",
    stable: "可以再補幾個線索",
    needs_review: "適合回到證據慢慢整理",
    retry_ready: "先整理關鍵概念再挑戰"
  }[stateName];
}

function renderReflection() {
  return `
    <div class="stack reflection-layout">
      <section class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把想問老師的地方留下來</h2>
        <p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p>
        <p class="muted">可以從心臟、心房心室、瓣膜、動脈靜脈微血管、血液成分、脈搏或血壓中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：動脈通常把血液帶離心臟">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認為什麼動脈和靜脈要用離開或回到心臟判斷，而不是只看含氧量？">${escapeHtml(state.reflection.question)}</textarea>
        </label>
        <label>信心程度
          <select id="confidenceLevel">
            ${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}
          </select>
        </label>
        <div class="button-row">
          <button class="primary" id="submitMission">提交任務</button>
          <button class="secondary" data-next="review">回到回饋整理</button>
        </div>
      </section>
    </div>
  `;
}

function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>心血管零件辨識任務結算</h2>
        <p class="lock-note">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</p>
        <div class="exp-summary">
          <strong>${result.unit_credited_exp} / ${UNIT_EXP_CAP} EXP</strong>
          <span>${escapeHtml(credit.resultLine)}</span>
        </div>
        <p class="muted">${escapeHtml(credit.note)}</p>
        <div class="ledger-grid">
          ${ledgerRow("完成任務", result.completion_exp)}
          ${ledgerRow("直接答對", result.direct_exp)}
          ${ledgerRow("提示後修正", result.revision_exp)}
          ${ledgerRow("回報 EXP", result.reflection_exp)}
          ${ledgerRow("精熟 EXP", result.mastery_exp)}
          ${ledgerRow("再挑戰補分", result.retry_exp)}
          ${ledgerRow("總計", result.unit_credited_exp)}
        </div>
        <div class="button-row">
          <button class="primary" data-next="achievements">查看成就</button>
          <button class="secondary" data-next="rules">查看規則</button>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function ledgerRow(label, value) {
  return `<article><span>${label}</span><strong>${Number(value || 0)}</strong></article>`;
}

function creditStatusText(result) {
  const status = result?.verification_status || (state.student?.is_guest ? "local_guest" : "pending_backend");
  if (state.student?.is_guest || status === "local_guest") {
    return {
      status: "guest",
      resultLine: `guest 測試：本次預估 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP，不列入正式累積`,
      note: "正式累積、完成單元與全冊徽章需使用學生帳號登入並經後台確認。"
    };
  }
  if (status === "server_verified" || status === "server_verified_credited") {
    return {
      status: "verified",
      resultLine: `本單元後台認列 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP`,
      note: "已依後台回傳資料更新正式累積與稱號。"
    };
  }
  return {
    status: "pending",
    resultLine: `本次預估 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP，待後台確認`,
    note: "本次資料已保留為待確認狀態，完成後台同步後才會更新正式累積。"
  };
}

function renderAchievements() {
  const result = state.result || scoreAttempt();
  const titleInfo = titleAndProgress(state.student, result.unit_credited_exp);
  const credit = creditStatusText(result);
  return `
    <div class="stack achievements-stack">
      <section class="panel title-card">
        <p class="eyebrow">全冊稱號</p>
        <div class="title-card-content">
          <img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.src='${assets.titleAvatarFallback}'">
          <div>
            <h2>${escapeHtml(titleInfo.current.title)}</h2>
            <p>${credit.status === "verified" ? `${titleInfo.totalExp} EXP｜稱號進度 ${titleInfo.progressPercent}%` : credit.resultLine}</p>
            <p>${credit.status === "verified" ? (titleInfo.next ? `距離 ${titleInfo.next.title} 還差 ${titleInfo.remaining} EXP` : "已達最高稱號，後續 EXP 仍會累積。") : credit.note}</p>
          </div>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function renderBadgeWall(earned = []) {
  const earnedSet = new Set(earned);
  return `<section class="panel">
    <p class="eyebrow">徽章收藏牆</p>
    <h2>本單元 14 枚徽章</h2>
    <div class="badge-wall">
      ${badges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual ${badge.image_status === "pending" ? "asset-missing" : ""}" data-badge-image-status="${escapeHtml(badge.image_status || "ready")}">
            ${badge.image_status === "pending" ? "" : `<img src="${badge.badge_image_path}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();">`}
          </div>
          <strong>${escapeHtml(badge.name)}</strong>
          <p>${escapeHtml(badge.condition)}</p>
        </article>
      `).join("")}
    </div>
  </section>`;
}

function renderRules() {
  return `
    <div class="stack">
      <section class="panel">
        <p class="eyebrow">成就規則</p>
        <h2>本單元 EXP 與再挑戰規則</h2>
        <ul class="rule-list">
          <li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li>
          <li>提示後修正仍可取得 EXP，但低於直接答對。</li>
          <li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li>
          <li>回報空白可提交但 0 EXP；具體且與心血管系統組成概念相關的問題才會取得回報 EXP。</li>
          <li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li>
        </ul>
        <button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>
      </section>
    </div>
  `;
}

function renderApp() {
  if (!screen) return;
  const views = {
    login: renderLogin,
    brief: renderBrief,
    scan: renderScan,
    checkpoint1: () => renderCheckpoint("checkpoint1"),
    checkpoint2: () => renderCheckpoint("checkpoint2"),
    checkpoint3: () => renderCheckpoint("checkpoint3"),
    review: renderReview,
    reflection: renderReflection,
    result: renderResult,
    achievements: renderAchievements,
    rules: renderRules
  };
  screen.dataset.bioquestScreen = state.screen;
  screen.innerHTML = `${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}${(views[state.screen] || renderLogin)()}`;
  updateNav();
  bindScreenEvents();
  if (typeof window !== "undefined" && window.BioQuestCharacterLayout?.enhance) window.BioQuestCharacterLayout.enhance({ force: true });
}

function updateNav() {
  navButtons.forEach((button) => {
    const target = button.dataset.nav;
    button.classList.toggle("active", target === state.screen);
    button.disabled = !canUseNav(target);
  });
  if (studentMini) {
    studentMini.innerHTML = state.student
      ? `<p><strong>${escapeHtml(state.student.student_name)}</strong></p><p>${escapeHtml(state.student.class_name)} ${escapeHtml(state.student.seat_no)}｜${escapeHtml(state.student.student_id)}</p>`
      : `<p class="muted">尚未登入</p>`;
  }
}

function bindScreenEvents() {
  screen.querySelector("#loginBtn")?.addEventListener("click", () => handleLogin(false));
  screen.querySelector("#guestBtn")?.addEventListener("click", () => handleLogin(true));
  screen.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.next)));
  screen.querySelectorAll("[data-section-next]").forEach((button) => button.addEventListener("click", () => nextAfterSection(button.dataset.sectionNext)));
  screen.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => setAnswer(button.dataset.answer, button.dataset.value)));
  screen.querySelectorAll("[data-toggle-set]").forEach((button) => button.addEventListener("click", () => toggleSetAnswer(button.dataset.toggleSet, button.dataset.value)));
  screen.querySelectorAll("[data-confirm-set]").forEach((button) => button.addEventListener("click", () => confirmSetAnswer(button.dataset.confirmSet)));
  screen.querySelectorAll("[data-map-question]").forEach((select) => select.addEventListener("change", () => {
    const qid = select.dataset.mapQuestion;
    const current = { ...(state.answers[qid] || {}) };
    current[select.dataset.mapItem] = select.value;
    setAnswer(qid, current);
  }));
  screen.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveSequence(button.dataset.move, button.dataset.item, Number(button.dataset.dir))));
  screen.querySelectorAll("[data-sequence-item]").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", item.dataset.sequenceItem);
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer?.getData("text/plain");
      const targetId = item.dataset.sequenceItem;
      const qid = item.closest("[data-sequence]")?.dataset.sequence;
      if (!qid || !draggedId || draggedId === targetId) return;
      const current = [...(state.answers[`${qid}_sequence`] || orderedOptions(questionMap[qid]).map((step) => step.id))];
      const from = current.indexOf(draggedId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0) return;
      current.splice(from, 1);
      current.splice(to, 0, draggedId);
      state.answers[`${qid}_sequence`] = current;
      saveState();
      renderApp();
    });
  });
  const textarea = screen.querySelector("#studentQuestion");
  const confident = screen.querySelector("#confidentConcept");
  const confidence = screen.querySelector("#confidenceLevel");
  textarea?.addEventListener("input", () => { state.reflection.question = textarea.value; saveState(); });
  confident?.addEventListener("input", () => { state.reflection.confident = confident.value; saveState(); });
  confidence?.addEventListener("change", () => { state.reflection.confidence = confidence.value; saveState(); });
  screen.querySelector("#submitMission")?.addEventListener("click", submitMission);
}

if (typeof document !== "undefined") {
  navButtons.forEach((button) => button.addEventListener("click", () => {
    if (canUseNav(button.dataset.nav)) setScreen(button.dataset.nav);
  }));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderApp);
  else renderApp();
}

if (typeof window !== "undefined") {
  window.__cardiovascular_componentsTest = {
    VERSION,
    mission,
    assets,
    badges,
    questions,
    state: () => state,
    setState: (next) => { state = { ...createEmptyState(), ...next }; },
    createEmptyState,
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    evaluateReflection,
    titleAvatarPath,
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
