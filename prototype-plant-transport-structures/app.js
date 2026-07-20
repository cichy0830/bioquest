const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260720-plant-transport-structures-extension-v2";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_plant_transport_structures_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);
const RESULT_STATUS_COPY = {
  guest: {
    summaryLabel: "guest 測試預估",
    creditLabel: "正式累積狀態",
    creditValue: "不列入正式累積",
    noticeClass: "warn",
    lead: "guest 測試：本次預估 {exp}/500 EXP，不列入正式累積。",
    detail: "這次結果只供老師或學生試看流程，不會寫入 Google Sheet，也不更新正式徽章或稱號進度。"
  },
  pending: {
    summaryLabel: "本次預估",
    creditLabel: "後台確認狀態",
    creditValue: "待後台確認",
    noticeClass: "warn",
    lead: "本次預估 {exp}/500 EXP，待後台確認。",
    detail: "確認完成前，這些數字只代表本次作答預覽；不作為已確認結果或累積進度。"
  },
  verified: {
    summaryLabel: "本次取得",
    creditLabel: "本單元正式認列",
    creditValue: "{credit} EXP",
    noticeClass: "good",
    lead: "後台已回傳正式認列資料。",
    detail: "本次取得是這次挑戰的原始表現；本單元正式認列會保留最高表現並受 500 EXP 上限限制。"
  }
};

const mission = {
  unit_id: "plant_transport_structures",
  unit_title: "植物的運輸構造",
  mission_title: "綠植管線辨識任務",
  mission_area: "綠植運輸管線站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "assets/owl-plant-transport-structures-prep-report.webp",
  owlReport: "assets/owl-plant-transport-structures-prep-report.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/plant-transport-structures-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: "plant-transport-structures-entry-wide",
  evidenceOverview: "assets/plant-transport-structures-evidence-overview.webp",
  questionRootHair: "plant-transport-structures-root-hair",
  questionVascularBundle: "plant-transport-structures-vascular-bundle",
  questionXylemPhloem: "plant-transport-structures-xylem-phloem",
  questionLeafVein: "plant-transport-structures-leaf-vein"
};

const badgeAsset = (id) => `../shared-assets/badges/plant_transport_structures/badge-plant_transport_structures-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["根毛", "維管束", "木質部", "韌皮部", "葉脈", "蒸散作用", "形成層", "水分", "礦物質", "養分", "根", "莖", "葉", "氣孔", "光合作用", "運輸"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["根毛吸收水分與礦物質", "根、莖、葉和維管束的關係", "木質部和韌皮部運輸什麼", "葉脈和運輸的關係", "蒸散作用與水分運輸", "形成層與莖增粗", "根吸收的物質和葉片製造的養分"]
};

const readyBadgeIds = new Set(["plant_transport_structures_entry", "plant_transport_structures_flawless"]);
const badges = [
  ["plant_transport_structures_entry", "綠植管線入門徽章", "完成綠植管線辨識任務。"],
  ["transport_need_mapper", "植物運輸需求徽章", "能判斷植物需要運輸構造。"],
  ["root_hair_absorber", "根毛吸收徽章", "能連結根毛與吸收。"],
  ["vascular_bundle_mapper", "維管束管線徽章", "能判讀維管束。"],
  ["xylem_water_mineral_carrier", "木質部運水徽章", "能判斷木質部運輸內容。"],
  ["phloem_nutrient_carrier", "韌皮部運養分徽章", "能判斷韌皮部運輸內容。"],
  ["leaf_vein_connector", "葉脈運輸徽章", "能判讀葉脈運輸功能。"],
  ["transpiration_basic_linker", "蒸散連結徽章", "能整理水分運輸流程。"],
  ["plant_transport_structure_interpreter", "構造判讀徽章", "能整理植物運輸構造。"],
  ["plant_transport_misconception_reviser", "植物運輸迷思修正徽章", "提示後修正植物運輸概念。"],
  ["plant_transport_structures_flawless", "植物運輸零提示全對徽章", "全部答對且全程未使用提示。"],
  ["plant_transport_reflection_reporter", "高品質植物運輸回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_plant_transport_structures", "再探綠植管線進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "pending" }));

const sequenceSteps = [
  { id: "soil_contact", label: "土壤中的水分與礦物質接觸根毛" }, { id: "root_hair_absorption", label: "根毛吸收水分與礦物質" }, { id: "xylem_upward_transport", label: "木質部把水分與礦物質往莖和葉運送" }, { id: "water_reaches_leaf", label: "水分到達葉片" }, { id: "transpiration_from_stoma", label: "部分水分經氣孔散失形成蒸散作用" }
];
const correctSequence = sequenceSteps.map((step) => step.id);

const questions = [
  {id:"q01",section:"checkpoint1",concept:"transport_need",type:"choice",answer:"transport_structure",prompt:"植物的葉片製造養分，根吸收水分與礦物質。這些物質要到達其他部位，最需要哪一類構造協助？",hint:"想想不同部位交換物質時，需要通過哪類管線。",misconception:"no_transport_needed",options:[{id:"transport_structure",text:"運輸構造"},{id:"petal_color",text:"花瓣顏色"},{id:"seed_coat",text:"種子外殼"},{id:"pollen_shape",text:"花粉形狀"}]},
  {id:"q02",section:"checkpoint1",concept:"root_hair_absorption",type:"choice",answer:"root_hair_absorption",prompt:"根表面有許多細小根毛，較能幫助植物完成哪一件事？",hint:"觀察根毛的位置，再想根和土壤接觸時主要取得什麼。",misconception:"leaf_absorbs_water_mainly",options:[{id:"root_hair_absorption",text:"增加接觸面積，吸收水分與礦物質"},{id:"pollen",text:"製造花粉"},{id:"glucose",text:"直接製造葡萄糖"},{id:"thick_leaf",text:"讓葉片變厚"}]},
  {id:"q03",section:"checkpoint1",concept:"vascular_bundle",type:"mapping",prompt:"請將植物部位和較相關的運輸構造線索配對。",hint:"先看每個部位的位置，再想它和吸收、連接或葉片運輸有什麼關係。",misconception:"transport_only_in_stem",items:[{id:"root",label:"根"},{id:"stem",label:"莖"},{id:"leaf",label:"葉"}],choices:[{id:"root_hair_and_transport",text:"根毛吸收水分與礦物質，內部有運輸構造"},{id:"vascular_bundle_connection",text:"維管束連接根與葉"},{id:"vein_transport",text:"葉脈含維管束，和水分及養分運輸有關"}],answer:{root:"root_hair_and_transport",stem:"vascular_bundle_connection",leaf:"vein_transport"}},
  {id:"q04",section:"checkpoint1",concept:"stem_transport_support",type:"choice",answer:"vascular_bundle",prompt:"若把植物莖想成連接根和葉的通道，莖內哪一類構造最直接和物質運輸有關？",hint:"想想成束排列、像管線一樣連接上下部位的構造。",misconception:"transport_only_in_stem",options:[{id:"vascular_bundle",text:"維管束"},{id:"pollen",text:"花粉"},{id:"pericarp",text:"果皮"},{id:"petal",text:"花瓣"}]},
  {id:"q05",section:"checkpoint2",concept:"xylem_phloem_roles",type:"mapping",prompt:"請將運輸構造與主要運輸內容配對。",hint:"先分辨是根吸收來的物質，還是葉片製造出來的養分。",misconception:"xylem_phloem_confusion",items:[{id:"xylem",label:"木質部"},{id:"phloem",label:"韌皮部"}],choices:[{id:"water_and_minerals",text:"水分與礦物質"},{id:"photosynthetic_nutrients",text:"光合作用製造的養分"}],answer:{xylem:"water_and_minerals",phloem:"photosynthetic_nutrients"}},
  {id:"q06",section:"checkpoint2",concept:"xylem_function",type:"choice",answer:"xylem",prompt:"根吸收的水分和礦物質，主要會經由哪一類構造往莖、葉運送？",hint:"注意題目中的水分和礦物質。",misconception:"xylem_phloem_confusion",options:[{id:"xylem",text:"木質部"},{id:"phloem",text:"韌皮部"},{id:"pollen_tube",text:"花粉管"},{id:"stoma_wall",text:"氣孔外壁"}]},
  {id:"q07",section:"checkpoint2",concept:"phloem_function",type:"choice",answer:"phloem",prompt:"葉片行光合作用製造的養分，要運送到根或其他部位，主要和哪一類構造有關？",hint:"想想葉片製造的養分要離開葉片時會走哪類管線。",misconception:"all_nutrients_from_roots",options:[{id:"phloem",text:"韌皮部"},{id:"xylem",text:"木質部"},{id:"root_hair",text:"根毛表皮"},{id:"petal",text:"花瓣"}]},
  {id:"q08",section:"checkpoint2",concept:"leaf_vein_transport",type:"choice",answer:"veins_contain_vascular_bundle",prompt:"有同學說：「葉脈只是讓葉子看起來有紋路，主要沒有運輸功能。」哪個修正較合理？",hint:"回想葉片上的脈絡會連到莖內的管線。",misconception:"leaf_vein_only_support",options:[{id:"veins_contain_vascular_bundle",text:"葉脈含有維管束，和水分、礦物質與養分運輸有關"},{id:"flower_only",text:"葉脈只負責開花"},{id:"animal_vessel",text:"葉脈是動物血管"},{id:"soil_absorb",text:"葉脈只能吸收土壤水分"}]},
  {id:"q09",section:"checkpoint3",concept:"transpiration_basic",type:"sequence",prompt:"請拖曳排序卡，排出水分從土壤到葉片並與蒸散作用連結的基礎流程。",hint:"先從土壤和根部開始，再看運輸管線，最後連到葉片水分散失。",misconception:"transpiration_only_waste",steps:sequenceSteps,answer:correctSequence},
  {id:"q10",section:"checkpoint3",concept:"transpiration_basic",type:"choice",answer:"transpiration_linked_to_upward_transport",prompt:"植物葉片的部分水分會經氣孔散失。這種蒸散作用和水分運輸的關係，哪個說法較合理？",hint:"注意水分從葉片散失和根部吸水、木質部運水的連續關係。",misconception:"transpiration_only_waste",options:[{id:"transpiration_linked_to_upward_transport",text:"蒸散作用和水分由根往上運輸有關"},{id:"instant_death",text:"蒸散作用只會讓植物立刻死亡"},{id:"make_glucose",text:"蒸散作用只會製造葡萄糖"},{id:"no_stoma",text:"蒸散作用和氣孔無關"}]},
  {id:"q11",section:"checkpoint3",concept:"vascular_bundle",type:"choice",answer:"material_transport",prompt:"某植物莖橫切面中可見成束排列的管線狀構造，這些構造最可能和哪一功能有關？",hint:"從管線狀、成束排列和根葉連接的線索判斷。",misconception:"transport_only_in_stem",options:[{id:"material_transport",text:"物質運輸"},{id:"flower_scent",text:"產生花香"},{id:"genetic_code",text:"儲存遺傳密碼"},{id:"color",text:"決定花瓣顏色"}]},
  {id:"q12",section:"checkpoint3",concept:"cambium_basic",type:"choice",answer:"cambium",prompt:"木本植物的莖逐漸增粗時，哪個構造和這項變化較相關？",hint:"這是莖內一層能持續產生新細胞的構造。",misconception:"bark_wood_bundle_confusion",options:[{id:"cambium",text:"形成層"},{id:"stoma",text:"氣孔"},{id:"root_hair",text:"根毛"},{id:"chloroplast",text:"葉綠體"}]},
  {id:"q13",section:"checkpoint3",concept:"xylem_phloem_roles",type:"choice",answer:"roots_water_minerals_leaves_nutrients_phloem",prompt:"哪個說法最合理地描述根與葉製造或取得的物質如何被運輸？",hint:"比較根吸收的水分、礦物質和葉片製造的養分。",misconception:"all_nutrients_from_roots",options:[{id:"roots_water_minerals_leaves_nutrients_phloem",text:"根吸收水分與礦物質；葉片製造養分，並可經韌皮部運送"},{id:"xylem_leaf_sugar",text:"木質部只把葉片糖分送到根"},{id:"no_nutrient_transport",text:"植物不需要運送養分"},{id:"phloem_only_water",text:"韌皮部只運送水分"}]},
  {id:"q14",section:"checkpoint3",concept:"xylem_phloem_roles",type:"choice",answer:"xylem_water_minerals_phloem_nutrients",prompt:"下列哪一組木質部與韌皮部的說法較合理？",hint:"先比對根吸收的物質與葉片製造的養分。",misconception:"xylem_phloem_confusion",options:[{id:"xylem_water_minerals_phloem_nutrients",text:"木質部主要運水分與礦物質；韌皮部主要運養分"},{id:"xylem_pollen",text:"木質部主要運花粉"},{id:"phloem_leaf_support",text:"韌皮部只支撐葉片"},{id:"same_function",text:"兩者主要功能完全相同"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
  checkpoint3: ["q09", "q10", "q11", "q13", "q14"]
};
const directQuestions = questions.filter((question) => question.id !== "q12");
const requiredQuestionIds = directQuestions.map((question) => question.id);

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
  const attemptId = uid("plant_transport_structures_guest_attempt");
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
  earned.push("plant_transport_structures_entry");
  if (passed(["q01"])) earned.push("transport_need_mapper");
  if (passed(["q02"])) earned.push("root_hair_absorber");
  if (passed(["q03", "q04", "q11"])) earned.push("vascular_bundle_mapper");
  if (passed(["q05", "q06"])) earned.push("xylem_water_mineral_carrier");
  if (passed(["q05", "q07", "q13", "q14"])) earned.push("phloem_nutrient_carrier");
  if (passed(["q03", "q08"])) earned.push("leaf_vein_connector");
  if (passed(["q09", "q10"])) earned.push("transpiration_basic_linker");
  if (passed(["q03", "q05", "q11"])) earned.push("plant_transport_structure_interpreter");
  if (correctedCore) earned.push("plant_transport_misconception_reviser");
  if (flawless) earned.push("plant_transport_structures_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("plant_transport_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_plant_transport_structures");
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
      attempt_answer: log.answer,
      used_hint: log.hint_used
    })),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
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
  const sceneAttrs = `${assets.briefingSceneHook ? ` data-briefing-scene-hook="${assets.briefingSceneHook}"` : ""}${assets.briefingSceneMobileHook ? ` data-mobile-hook="${assets.briefingSceneMobileHook}"` : ""}`;
  const sceneMedia = `<picture class="bq-brief-scene-media">${assets.briefingSceneMobileHook ? `<source media="(max-width: 680px)" srcset="${assets.briefingSceneMobileHook}">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在植物運輸構造任務場景中引導學生"></picture>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene plant-transport-structures-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>綠植運輸管線站收到一份植物由根到葉的運輸紀錄。請協助整理根毛、維管束、木質部、韌皮部、葉脈與蒸散作用的基本關係。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入綠植運輸管線站前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚根吸收、木質部運水與韌皮部運養分。</h3><p>根毛增加接觸面積；維管束連接根、莖與葉；葉脈也包含運輸構造。</p></div></div><figure class="prep-overview-figure"><img src="${assets.evidenceOverview}" alt="植物運輸構造概念總覽圖" onerror="this.closest('.prep-overview-figure').hidden=true"><figcaption>概念總覽圖僅供進入關卡前建立情境；作答仍以題幹與選項為準。</figcaption></figure><div class="concept-grid"><article><strong>根毛</strong><p>協助吸收水分與礦物質。</p></article><article><strong>維管束</strong><p>在根、莖、葉之間形成運輸管線。</p></article><article><strong>木質部與韌皮部</strong><p>分別連結水分礦物質與葉片製造的養分。</p></article><article><strong>蒸散</strong><p>從土壤、根、木質部到葉片的水分路徑。</p></article></div><button class="primary" data-next="checkpoint1">開始綠植管線辨識</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["根、莖、葉與運輸構造","從根毛、維管束到葉脈，整理植物不同部位的運輸線索。"], checkpoint2:["木質部、韌皮部與葉脈","比較根吸收來的物質與葉片製造的養分會走哪類構造。"], checkpoint3:["水分路徑、蒸散與構造判讀","用排序、情境判斷與迷思修正整理植物運輸概念。"] }[section];
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

function conceptLabel(concept) { return {transport_need:"植物運輸需求",root_hair_absorption:"根毛吸收",vascular_bundle:"維管束",stem_transport_support:"莖的運輸構造",xylem_phloem_roles:"木質部與韌皮部",xylem_function:"木質部",phloem_function:"韌皮部",leaf_vein_transport:"葉脈運輸",transpiration_basic:"蒸散與水分路徑",cambium_basic:"形成層"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (qid === "q03") return `<div class="evidence-card"><strong>根、莖、葉線索卡</strong><p>根接觸土壤、莖連接上下部位、葉片有葉脈；請完成每一列配對。</p></div>`;
  if (qid === "q08") return `<div class="evidence-card"><strong>葉脈觀察卡</strong><p>葉脈會連接葉片內外的運輸構造；請判斷它不只是外觀紋路的原因。</p></div>`;
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
        <h2>先整理你目前的植物運輸構造線索</h2>
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
    </div>
  `;
}

function misconceptionText(tag) { return {no_transport_needed:"植物不同部位交換物質時需要運輸構造。",leaf_absorbs_water_mainly:"根毛可增加和土壤接觸的面積，協助吸收水分與礦物質。",transport_only_in_stem:"根、莖、葉都可找到和運輸相關的構造。",xylem_phloem_confusion:"比較根吸收的水分、礦物質和葉片製造的養分。",all_nutrients_from_roots:"葉片可製造養分，並需運送到其他部位。",leaf_vein_only_support:"葉脈含有維管束，和運輸有關。",transpiration_only_waste:"蒸散作用與根吸水、木質部運水的連續關係有關。",bark_wood_bundle_confusion:"形成層和木本植物莖增粗有關。"}[tag] || tag; }

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
    <div class="mission-layout reflection-layout">
      <section class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把想問老師的地方留下來</h2>
        <p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：植物運輸和吸收的差異">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認根毛、木質部、韌皮部和葉脈在植物運輸中各自扮演什麼角色。">${escapeHtml(state.reflection.question)}</textarea>
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
  const statusCopy = resultStatusCopy(result);
  const mode = resultMode(result);
  const estimatedTotal = Number(result.attempt_exp ?? result.unit_credited_exp ?? 0) || 0;
  const officialTotal = mode === "verified" ? Number(result.unit_credited_exp ?? estimatedTotal) || 0 : 0;
  const officialDelta = mode === "verified" ? Number(result.exp_delta ?? result.credited_delta ?? officialTotal) || 0 : 0;
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>綠植管線辨識任務結算</h2>
        <p class="lock-note">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</p>
        <div class="feedback ${statusCopy.noticeClass}">${statusCopy.lead}</div>
        <div class="exp-summary">
          <strong>${statusCopy.summaryValue}</strong>
          <span>${statusCopy.summaryLabel}：${result.attempt_exp}｜${statusCopy.creditLabel}：${statusCopy.creditValue}</span>
        </div>
        <div class="ledger-grid">
          ${ledgerRow("完成任務", result.completion_exp)}
          ${ledgerRow("直接答對", result.direct_exp)}
          ${ledgerRow("提示後修正", result.revision_exp)}
          ${ledgerRow("回報 EXP", result.reflection_exp)}
          ${ledgerRow("精熟 EXP", result.mastery_exp)}
          ${ledgerRow("再挑戰補分", result.retry_exp)}
          ${ledgerRow(mode === "verified" ? "正式認列總計" : "本次預估明細總計", mode === "verified" ? officialTotal : estimatedTotal)}
          ${ledgerRow("正式認列／累積增量", officialDelta)}
        </div>
        <p class="muted">${statusCopy.detail}</p>
        <div class="button-row">
          <button class="primary" data-next="achievements">查看成就</button>
          <button class="secondary" data-next="rules">查看規則</button>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function resultMode(result = state.result || {}) {
  const status = String(result.verification_status || "").toLowerCase();
  if (state.student?.is_guest || status === "local_guest") return "guest";
  if (status.includes("server_verified") || status === "verified") return "verified";
  return "pending";
}

function resultStatusCopy(result = state.result || scoreAttempt()) {
  const mode = resultMode(result);
  const copy = RESULT_STATUS_COPY[mode] || RESULT_STATUS_COPY.pending;
  const attemptExp = Number(result.attempt_exp ?? result.unit_credited_exp ?? 0) || 0;
  const creditExp = Number(result.unit_credited_exp ?? attemptExp) || 0;
  return {
    ...copy,
    summaryValue: mode === "verified" ? `${creditExp} / ${UNIT_EXP_CAP} EXP` : `${attemptExp} / ${UNIT_EXP_CAP} EXP`,
    lead: copy.lead.replace("{exp}", String(attemptExp)).replace("{credit}", String(creditExp)),
    creditValue: copy.creditValue.replace("{exp}", String(attemptExp)).replace("{credit}", String(creditExp))
  };
}

function ledgerRow(label, value) {
  return `<article><span>${label}</span><strong>${Number(value || 0)}</strong></article>`;
}

function renderAchievements() {
  const result = state.result || scoreAttempt();
  return `
    <div class="stack achievements-stack">
      ${renderBadgeWall(result.earned_badges, { unitAchievements: true })}
    </div>
  `;
}

function renderBadgeWall(earned = [], options = {}) {
  const earnedSet = new Set(earned);
  const unitAttributes = options.unitAchievements ? ` data-bq-unit-achievements="${mission.unit_id}"` : "";
  const badgeVisual = (badge) => badge.image_status === "pending"
    ? `<span class="bq-badge-asset-pending" role="img" aria-label="${escapeHtml(badge.name)}素材待接">徽章素材待接</span>`
    : `<img src="${badge.badge_image_path}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();">`;
  return `<section class="panel"${unitAttributes}>
    <p class="eyebrow">${options.unitAchievements ? "本單元成就" : "徽章收藏牆"}</p>
    <h2>本單元 13 枚徽章</h2>
    <div class="badge-wall">
      ${badges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual" data-badge-image-status="${badge.image_status || "ready"}">
            ${badgeVisual(badge)}
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
          <li>回報空白可提交但 0 EXP；具體且與植物的運輸構造概念相關的問題才會取得回報 EXP。</li>
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
  if (typeof window !== "undefined" && window.BioQuestCharacterLayout?.enhance) window.BioQuestCharacterLayout.enhance();
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
  window.__plant_transport_structuresTest = {
    VERSION,
    mission,
    assets,
    badges,
    questions,
    directQuestions,
    requiredQuestionIds,
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
    renderAchievements,
    renderApp
  };
}
