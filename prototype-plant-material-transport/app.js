const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260720-plant-material-transport-canonical-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_plant_material_transport_state_v1";
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
  unit_id: "plant_material_transport",
  unit_title: "植物體內物質的運輸",
  mission_title: "綠植運輸調度任務",
  mission_area: "綠植運輸調度站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "assets/owl-plant-material-transport-prep-report.webp",
  owlReport: "assets/owl-plant-material-transport-prep-report.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/plant-material-transport-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: "assets/plant-material-transport-entry-wide.webp",
  questionOverview: "assets/plant-material-transport-overview-visual.webp",
  questionWaterFlow: "plant-material-transport-root-to-leaf-water-flow",
  questionXylemPhloemRoutes: "plant-material-transport-xylem-phloem-routes",
  questionNutrientFlow: "plant-material-transport-leaf-to-sink-nutrient-flow",
  questionTranspirationStomata: "plant-material-transport-transpiration-stomata",
  questionColoredWaterEvidence: "plant-material-transport-colored-water-evidence",
  questionBagTranspirationData: "plant-material-transport-bag-transpiration-data"
};

const badgeAsset = (id) => `../shared-assets/badges/plant_material_transport/badge-plant_material_transport-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["植物體內運輸", "水分", "礦物質", "根毛", "木質部", "韌皮部", "葉片製造養分", "糖類養分", "光合作用", "蒸散作用", "氣孔", "有色水", "套袋水珠", "控制變因", "運輸方向", "資料判讀", "根", "莖", "葉"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["水分與礦物質", "木質部", "韌皮部", "蒸散作用", "氣孔", "資料判讀", "木質部和水分、礦物質上升運輸", "葉片製造的養分如何送到其他部位"]
};

const badges = [
  ["plant_material_transport_entry", "綠植調度入門徽章", "完成綠植運輸調度任務。"],
  ["transport_overview_mapper", "植物運輸總覽徽章", "能判斷植物不同部位需要物質運輸。"],
  ["water_mineral_absorber", "水分礦物吸收徽章", "能連結根毛與水分、礦物質吸收。"],
  ["xylem_upward_carrier", "木質部上行運輸徽章", "能判斷木質部運送水分與礦物質。"],
  ["phloem_nutrient_dispatcher", "韌皮部養分調度徽章", "能判斷韌皮部運送葉製造養分。"],
  ["nutrient_source_classifier", "物質來源分類徽章", "能區分根吸收與葉片製造的物質來源。"],
  ["transpiration_flow_linker", "蒸散流程連結徽章", "能整理水分由根到葉並和蒸散連結的流程。"],
  ["stomata_balance_judge", "氣孔平衡判斷徽章", "能判斷氣孔與水分散失、氣體交換的關係。"],
  ["transport_evidence_reader", "運輸證據判讀徽章", "能用有色水、套袋水珠或資料比較作有限推論。"],
  ["plant_material_misconception_reviser", "運輸迷思修正徽章", "提示後修正植物體內運輸迷思。"],
  ["plant_material_transport_flawless", "植物體內運輸零提示全對徽章", "全部答對且全程未使用提示。"],
  ["plant_material_transport_reflection_reporter", "高品質運輸回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_plant_material_transport", "再探綠植調度進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => {
  const readyIds = new Set(["plant_material_transport_entry", "xylem_upward_carrier", "phloem_nutrient_dispatcher", "plant_material_transport_flawless"]);
  return { id, name, condition, badge_image_path: badgeAsset(id), image_status: readyIds.has(id) ? "ready" : "pending" };
});

const sequenceSteps = [
  { id: "soil_contact", label: "土壤中的水分接觸根毛" },
  { id: "root_water_entry", label: "水分進入根部" },
  { id: "xylem_upward_transport", label: "水分主要經木質部往上運送" },
  { id: "water_reaches_leaf", label: "水分到達葉片" },
  { id: "transpiration_from_stoma", label: "部分水分由氣孔散失形成蒸散作用" }
];
const correctSequence = sequenceSteps.map((step) => step.id);

const questions = [
  {id:"q01",section:"checkpoint1",concept:"transport_overview",type:"choice",answer:"material_transport",prompt:"一株植物的根吸收水分與礦物質，葉片製造養分，其他部位也需要這些物質。這最能說明植物需要哪一種功能？",hint:"先想不同部位取得或製造的物質，是否都只留在原來位置。",misconception:"material_stays_local",options:[{id:"material_transport",text:"物質運輸"},{id:"petal_color",text:"花色改變"},{id:"seed_dormancy",text:"種子休眠"},{id:"outer_support_only",text:"只靠外表支撐"}]},
  {id:"q02",section:"checkpoint1",concept:"water_mineral_absorption",type:"choice",answer:"root_hair_soil_contact",prompt:"若要判斷植物水分和礦物質主要從哪裡進入植物體，哪個線索最值得先看？",hint:"注意題目問的是水分和礦物質從外界進入植物的位置。",misconception:"leaf_absorbs_water_mainly",options:[{id:"root_hair_soil_contact",text:"根毛與土壤接觸"},{id:"petal_color",text:"花瓣顏色"},{id:"fruit_skin",text:"果皮厚度"},{id:"pollen_shape",text:"花粉形狀"}]},
  {id:"q03",section:"checkpoint1",concept:"transport_overview",type:"mapping",prompt:"請把下列物質依主要來源分類。",hint:"先分辨這些物質是從土壤進入，還是由葉片利用光合作用製造。",misconception:"all_nutrients_from_roots",items:[{id:"water",label:"水分"},{id:"minerals",label:"礦物質"},{id:"sugar",label:"葉片製造的糖類養分"}],choices:[{id:"root_source",text:"根從土壤取得"},{id:"leaf_source",text:"葉片光合作用製造"}],answer:{water:"root_source",minerals:"root_source",sugar:"leaf_source"}},
  {id:"q04",section:"checkpoint1",concept:"evidence_interpretation",type:"choice",answer:"water_moves_up_inside",prompt:"將白色花枝插入有色水中一段時間後，莖和花瓣部分位置出現顏色。這個觀察較適合用來支持哪一類推論？",hint:"先把有色水想成水分移動的線索，再判斷它能支持哪一種有限推論。",misconception:"unfair_data_conclusion",options:[{id:"water_moves_up_inside",text:"水分可沿植物內部運輸構造往上移動"},{id:"petal_makes_minerals",text:"花瓣能製造所有礦物質"},{id:"no_roots_needed",text:"植物完全不需要根"},{id:"phloem_air_only",text:"韌皮部只運送空氣"}]},
  {id:"q05",section:"checkpoint2",concept:"xylem_upward_transport",type:"choice",answer:"root_xylem_upward",prompt:"根吸收的水分和礦物質要送到莖與葉，最合理的運輸路徑是哪一個？",hint:"觀察題目中的物質是水分與礦物質，並想想它們最初從哪個部位進入植物。",misconception:"xylem_phloem_confusion",options:[{id:"root_xylem_upward",text:"根毛吸收後，主要經木質部往上運送"},{id:"leaf_to_root_water",text:"葉片先吸水再送到根"},{id:"petal_minerals_to_soil",text:"花瓣先製造礦物質再送到土壤"},{id:"phloem_drains_water",text:"韌皮部只把水分往外排"}]},
  {id:"q06",section:"checkpoint2",concept:"phloem_nutrient_transport",type:"choice",answer:"phloem",prompt:"葉片在光合作用後製造的養分，要送到根或果實等部位使用或儲存，主要和哪一類構造有關？",hint:"先看題目中的物質是葉片製造的養分，而不是根吸收的水分。",misconception:"all_nutrients_from_roots",options:[{id:"phloem",text:"韌皮部"},{id:"xylem",text:"木質部"},{id:"root_surface",text:"根毛外表"},{id:"stoma_wall",text:"氣孔外壁"}]},
  {id:"q07",section:"checkpoint2",concept:"phloem_nutrient_transport",type:"choice",answer:"roots_water_leaves_sugar",prompt:"有同學說：「植物養分一定都是從根吸收，再一路往上送。」哪個修正較合理？",hint:"先分開看「根吸收」和「葉製造」兩件事，再判斷養分來源。",misconception:"all_nutrients_from_roots",options:[{id:"roots_water_leaves_sugar",text:"根主要吸收水分與礦物質；葉片可製造養分，並送到需要或儲存的部位"},{id:"root_all_glucose",text:"根會直接吸收所有葡萄糖"},{id:"leaf_no_sugar",text:"葉片不能製造養分"},{id:"sugar_stays_leaf",text:"養分只能停留在葉片"}]},
  {id:"q08",section:"checkpoint2",concept:"phloem_nutrient_transport",type:"choice",answer:"phloem_to_needed_parts",prompt:"下列哪個說法較符合國中階段對韌皮部運輸的理解？",hint:"不必背高階機制，先抓住「葉片製造的養分」和「送到需要的位置」。",misconception:"phloem_only_downward",options:[{id:"phloem_to_needed_parts",text:"韌皮部可將葉製造的養分送到需要或儲存的部位"},{id:"phloem_water_root_to_leaf",text:"韌皮部只會把水分由根送往葉"},{id:"phloem_green_only",text:"韌皮部只負責讓葉片變綠"},{id:"phloem_no_nutrients",text:"韌皮部和養分運輸無關"}]},
  {id:"q09",section:"checkpoint3",concept:"transpiration_link",type:"sequence",prompt:"請拖曳排序卡，排出水分從土壤進入植物並和蒸散作用連結的基礎流程。",hint:"先從水分接觸根部開始，再看往上運輸，最後連到葉片氣孔。",misconception:"transpiration_only_waste",steps:sequenceSteps,answer:correctSequence},
  {id:"q10",section:"checkpoint3",concept:"transpiration_link",type:"choice",answer:"transpiration_transport_link",prompt:"有同學說：「蒸散作用只是浪費水，和植物體內運輸沒有關係。」哪個修正較合理？",hint:"注意「水分散失」不等於沒有功能，回想葉片水分散失和根部吸水可能形成連續關係。",misconception:"transpiration_only_waste",options:[{id:"transpiration_transport_link",text:"蒸散作用會造成水分散失，但也和水分由根往上運輸有基本關聯"},{id:"transpiration_makes_glucose",text:"蒸散作用會直接製造葡萄糖"},{id:"root_only",text:"蒸散作用只發生在根毛"},{id:"no_water_movement",text:"蒸散作用完全不影響水分移動"}]},
  {id:"q11",section:"checkpoint3",concept:"stomata_balance",type:"choice",answer:"water_loss_and_gas_exchange",prompt:"天氣炎熱乾燥時，植物若關閉部分氣孔，最直接可能同時影響哪兩件事？",hint:"想想氣孔位在葉片表面，和水蒸氣、二氧化碳、氧氣進出都有關。",misconception:"stomata_single_function",options:[{id:"water_loss_and_gas_exchange",text:"水分散失與氣體交換"},{id:"flower_fruit",text:"花瓣顏色與果實甜度"},{id:"root_seed",text:"根毛數量與種子形狀"},{id:"xylem_chloroplast",text:"木質部是否消失與葉綠體是否變多"}]},
  {id:"q12",section:"checkpoint3",concept:"evidence_interpretation",type:"choice",answer:"more_leaves_more_water_drops",prompt:"同一植物兩枝相近枝條套上透明袋，枝條 A 葉片較多、枝條 B 葉片較少；一段時間後 A 袋內水珠較多。若其他條件相近，較合理的推論是什麼？",hint:"先比較兩組主要不同條件，再把袋內水珠連到葉片水分散失。",misconception:"unfair_data_conclusion",options:[{id:"more_leaves_more_water_drops",text:"葉片較多時，水分散失的證據可能較明顯"},{id:"few_leaves_no_life",text:"葉片較少一定沒有生命活動"},{id:"soil_drips_into_bag",text:"水珠一定來自土壤直接滴入袋中"},{id:"leaf_count_unrelated",text:"葉片多寡和水分散失完全無關"}]},
  {id:"q13",section:"checkpoint3",concept:"evidence_interpretation",type:"set",prompt:"若要比較「風」是否會影響蒸散作用，哪些條件應盡量保持相同？（可複選，選好後按「確認這組答案」）",hint:"題目想看風的影響，因此除了風之外，其他可能影響水分散失的條件要盡量相同。",misconception:"unfair_data_conclusion",options:[{id:"plant_type_size",text:"植物種類與大小"},{id:"leaf_area",text:"葉片數量或面積"},{id:"light_time",text:"照光時間"},{id:"temperature",text:"溫度"},{id:"wind",text:"是否有風"},{id:"container_color_random",text:"容器顏色任意改變"}],answer:["plant_type_size","leaf_area","light_time","temperature"]},
  {id:"q14",section:"checkpoint3",concept:"xylem_upward_transport",type:"choice",answer:"xylem_water_phloem_sugar",prompt:"有同學把木質部和韌皮部功能混在一起。哪個整理較合理？",hint:"用「根吸收的水分礦物質」和「葉製造的養分」兩組線索分開看。",misconception:"xylem_phloem_confusion",options:[{id:"xylem_water_phloem_sugar",text:"木質部主要運送水分與礦物質；韌皮部主要運送葉製造的養分"},{id:"xylem_pollen",text:"木質部主要運送花粉"},{id:"phloem_transpiration_only",text:"韌皮部只負責葉片散水"},{id:"same_function",text:"兩者完全相同"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
  checkpoint3: ["q09", "q10", "q11", "q12", "q13", "q14"]
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
  const attemptId = uid("plant_material_transport_guest_attempt");
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
  earned.push("plant_material_transport_entry");
  if (passed(["q01"])) earned.push("transport_overview_mapper");
  if (passed(["q02"])) earned.push("water_mineral_absorber");
  if (passed(["q05", "q14"])) earned.push("xylem_upward_carrier");
  if (passed(["q06", "q07", "q08"])) earned.push("phloem_nutrient_dispatcher");
  if (passed(["q03"])) earned.push("nutrient_source_classifier");
  if (passed(["q09", "q10"])) earned.push("transpiration_flow_linker");
  if (passed(["q11"])) earned.push("stomata_balance_judge");
  if (passed(["q04", "q12", "q13"])) earned.push("transport_evidence_reader");
  if (correctedCore) earned.push("plant_material_misconception_reviser");
  if (flawless) earned.push("plant_material_transport_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("plant_material_transport_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_plant_material_transport");
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
  const sceneMedia = `<picture class="bq-brief-scene-media">${assets.briefingSceneMobileHook ? `<source media="(max-width: 680px)" srcset="${assets.briefingSceneMobileHook}">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在植物體內物質運輸任務場景中引導學生"></picture>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene plant-material-transport-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>綠植運輸調度站收到一株植物的移動紀錄：根取得水分與礦物質，葉製造養分，氣孔影響水分散失與氣體交換。請用來源、管線、方向與證據協助判讀。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入綠植運輸調度站前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚物質來源、運輸構造、移動方向與資料證據。</h3><p>根毛吸收水分與礦物質；木質部主要往上運水分與礦物質；韌皮部主要運送葉製造的養分；氣孔和蒸散、氣體交換有關。</p></div></div><div class="concept-grid"><article><strong>來源</strong><p>水分與礦物質多由根取得；糖類養分由葉片製造。</p></article><article><strong>管線</strong><p>木質部、韌皮部負責不同物質的運輸任務。</p></article><article><strong>方向</strong><p>水分從根往莖葉；養分送到需要或儲存的部位。</p></article><article><strong>證據</strong><p>有色水、套袋水珠與控制變因可作有限推論。</p></article></div><button class="primary" data-next="checkpoint1">開始綠植運輸判讀</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["物質來源與運輸總覽","從根取得、葉製造與有色水證據，整理植物為何需要體內運輸。"], checkpoint2:["木質部、韌皮部與運輸方向","比較根吸收的物質與葉製造的養分會走哪類構造。"], checkpoint3:["蒸散、氣孔與資料證據","用排序、情境判斷、資料表與複選題整理植物運輸過程。"] }[section];
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

function conceptLabel(concept) { return {transport_overview:"植物運輸總覽",water_mineral_absorption:"水分礦物吸收",xylem_upward_transport:"木質部上行運輸",phloem_nutrient_transport:"韌皮部養分運輸",transpiration_link:"蒸散與水分路徑",stomata_balance:"氣孔平衡判斷",evidence_interpretation:"資料證據判讀"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (qid === "q01") return `<div class="evidence-card"><strong>整株植物情境卡</strong><p>根、葉與其他部位會取得、製造、使用或儲存不同物質；請根據部位與物質來源，判斷植物可能需要哪種功能。</p><figure class="question-asset"><img src="${assets.questionOverview}" alt="整株植物示意圖，呈現根、莖、葉與其他部位的位置關係，供學生觀察不同部位。"></figure></div>`;
  if (qid === "q04") return `<div class="evidence-card"><strong>有色水觀察卡</strong><p>有色水出現在莖與花瓣部分位置，只能支持和水分移動相關的有限推論。</p></div>`;
  if (qid === "q12") return `<div class="evidence-card evidence-table"><strong>套袋水珠資料</strong><table><thead><tr><th>枝條</th><th>葉片狀態</th><th>一段時間後袋內觀察</th></tr></thead><tbody><tr><td>A</td><td>葉片較多</td><td>水珠較多</td></tr><tr><td>B</td><td>葉片較少</td><td>水珠較少</td></tr></tbody></table></div>`;
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
        <h2>先整理你目前的植物運輸線索</h2>
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

function misconceptionText(tag) { return {material_stays_local:"植物不同部位會吸收、製造、使用或儲存物質，因此需要運輸。",leaf_absorbs_water_mainly:"根毛主要協助植物從土壤吸收水分與礦物質。",all_nutrients_from_roots:"根主要吸收水分和礦物質，葉片可行光合作用製造糖類養分。",xylem_phloem_confusion:"木質部主要運送水分與礦物質，韌皮部主要運送葉片製造的養分。",phloem_only_downward:"本階段先掌握韌皮部把葉片製造的養分送到需要或儲存的部位。",transpiration_only_waste:"水分從葉片氣孔散失，也和水分由根往上運輸有基本關聯。",stomata_single_function:"氣孔和氣體交換有關，也會影響水分散失。",unfair_data_conclusion:"比較蒸散或運輸資料時，要先看主要改變條件和其他條件是否相近。"}[tag] || tag; }

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
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：木質部運送水分和礦物質">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認韌皮部把葉片製造的養分送到根或果實時，是看哪裡需要養分，還是固定方向？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>綠植運輸調度任務結算</h2>
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
          <div class="badge-visual" data-badge-image-status="${escapeHtml(badge.image_status || "ready")}">
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
          <li>回報空白可提交但 0 EXP；具體且與植物體內物質運輸概念相關的問題才會取得回報 EXP。</li>
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
  window.__plant_material_transportTest = {
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
    renderBrief,
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
