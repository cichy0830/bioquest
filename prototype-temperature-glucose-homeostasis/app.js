const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-temperature-glucose-homeostasis-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_temperature_glucose_homeostasis_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "temperature_glucose_homeostasis",
  unit_title: "體溫與血糖的恆定",
  mission_title: "恆定警報校正任務",
  mission_area: "恆定調節站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: ""
};

const badgeAsset = () => "";
const reflectionRules = {
  conceptTerms: ["恆定", "相對穩定", "適當範圍", "負回饋", "反向調整", "內溫動物", "外溫動物", "體溫", "流汗", "散熱", "發抖", "皮膚血管", "水分流失", "血糖", "葡萄糖", "胰島素", "升糖素", "飯後", "空腹", "資料判讀"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["恆定是相對穩定", "負回饋方向", "內溫與外溫動物", "熱時散熱", "冷時保溫或產熱", "流汗與水分", "血糖偏高偏低調節", "資料判讀"]
};

const badges = [
  ["temperature_glucose_homeostasis_entry", "恆定警報入門", "完成恆定警報校正任務。"],
  ["homeostasis_range_keeper", "恆定範圍守門", "能判斷恆定是維持在適當範圍附近。"],
  ["negative_feedback_direction_reader", "負回饋方向判讀", "能判斷偏高或偏低時的反向調節方向。"],
  ["endotherm_ectotherm_classifier", "內外溫分類", "能分類內溫動物與外溫動物。"],
  ["hot_response_heat_loss_reader", "熱時散熱判讀", "能判斷高溫時流汗與血管擴張等散熱反應。"],
  ["cold_response_heat_keeper", "冷時保溫判讀", "能判斷低溫時發抖與血管收縮等保溫或產熱反應。"],
  ["sweating_water_heat_linker", "流汗水分散熱連結", "能連結流汗、散熱與水分流失。"],
  ["temperature_data_interpreter", "體溫資料判讀", "能用資料判斷體溫回到適當範圍。"],
  ["temperature_feedback_sequence_tracker", "體溫回饋排序", "能排出體溫偏高時負回饋調節的大方向。"],
  ["blood_glucose_range_reader", "血糖範圍判讀", "能用資料判斷血糖是否回到適當範圍。"],
  ["blood_glucose_hormone_direction_reader", "血糖激素方向", "能判斷胰島素與升糖素對血糖方向的作用。"],
  ["glucose_curve_interpreter", "血糖曲線解讀", "能用飯後血糖曲線判讀調節趨勢。"],
  ["temperature_glucose_unit_boundary_guardian", "體溫血糖邊界守門", "能分辨體溫血糖恆定與相鄰單元。"],
  ["temperature_glucose_misconception_reviser", "恆定迷思修正", "提示後修正本單元迷思。"],
  ["temperature_glucose_homeostasis_flawless", "體溫血糖零提示全對", "全部答對且全程未使用提示。"],
  ["temperature_glucose_homeostasis_reflection_reporter", "高品質體溫血糖回報", "回報品質達 discussion_question。"],
  ["retry_growth_temperature_glucose_homeostasis", "再探恆定進步", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const animalTemperatureChoices = [
  { id: "endotherm", text: "內溫動物：體溫較能維持在一定範圍" },
  { id: "ectotherm", text: "外溫動物：體溫較容易受外界環境影響" }
];
const feedbackDirectionChoices = [
  { id: "increase_heat_loss", text: "增加散熱，讓體溫往適當範圍下降" },
  { id: "conserve_or_make_heat", text: "減少散熱或增加產熱，讓體溫往適當範圍上升" },
  { id: "lower_glucose", text: "降低血糖，讓血糖往適當範圍下降" },
  { id: "raise_glucose", text: "升高血糖，讓血糖往適當範圍上升" }
];

const questions = [
  {id:"temperature_glucose_homeostasis_q01",section:"checkpoint1",concept:"homeostasis_range",type:"choice",answer:"homeostasis_is_range_not_fixed",prompt:"有同學說：「恆定就是數值完全不變。」哪個修正較合理？",hint:"先想身體狀態是否需要維持在適當範圍附近，而不是固定一個完全不變的數字。",misconception:"homeostasis_fixed_value",options:[{id:"homeostasis_is_range_not_fixed",text:"恆定是維持在適當範圍附近，可能有小幅波動"},{id:"always_exact_same",text:"恆定代表體溫與血糖每秒都完全相同"},{id:"only_excretion",text:"恆定只和腎臟形成尿液有關"},{id:"only_cell_division",text:"恆定是細胞分裂前染色體複製"}]},
  {id:"temperature_glucose_homeostasis_q02",section:"checkpoint1",concept:"negative_feedback",type:"choice",answer:"negative_feedback_opposite_adjustment",prompt:"負回饋調節的共同方向，下列哪一項較合理？",hint:"注意身體偵測到偏高或偏低時，反應通常會把狀態往適當範圍拉回。",misconception:"feedback_same_direction",options:[{id:"negative_feedback_opposite_adjustment",text:"偏高時啟動降低方向；偏低時啟動升高方向，讓狀態回到範圍附近"},{id:"same_direction_more",text:"偏高時繼續升高，偏低時繼續降低"},{id:"random_response",text:"身體反應和偏高偏低沒有關係"},{id:"only_by_will",text:"體溫與血糖只能靠意志控制"}]},
  {id:"temperature_glucose_homeostasis_q03",section:"checkpoint1",concept:"endotherm_ectotherm",type:"mapping",answer:{human:"endotherm",sparrow:"endotherm",lizard:"ectotherm",frog:"ectotherm"},prompt:"請把例子配對到較合適的體溫特性分類。",hint:"先判斷體溫主要能否靠體內調節維持在一定範圍，或較容易受環境溫度影響。",misconception:"endotherm_ectotherm_confusion",items:[{id:"human",label:"人類"},{id:"sparrow",label:"麻雀"},{id:"lizard",label:"蜥蜴"},{id:"frog",label:"青蛙"}],choices:animalTemperatureChoices},
  {id:"temperature_glucose_homeostasis_q04",section:"checkpoint2",concept:"hot_response",type:"choice",answer:"hot_sweating_vasodilation",prompt:"天氣炎熱或運動後體溫偏高時，下列哪組反應最有助於散熱？",hint:"找出能讓熱比較容易散出去的反應。",misconception:"hot_response_confusion",options:[{id:"hot_sweating_vasodilation",text:"流汗增加、皮膚血管擴張，幫助散熱"},{id:"hot_shivering",text:"發抖增加產熱，讓體溫更高"},{id:"hot_vasoconstriction",text:"皮膚血管收縮，減少散熱"},{id:"hot_glucagon",text:"升糖素讓血糖上升就是散熱"}]},
  {id:"temperature_glucose_homeostasis_q05",section:"checkpoint2",concept:"cold_response",type:"choice",answer:"cold_shivering_vasoconstriction",prompt:"環境寒冷、體溫偏低時，下列哪組反應較有助於維持體溫？",hint:"找出能減少散熱或增加產熱的反應。",misconception:"cold_response_confusion",options:[{id:"cold_shivering_vasoconstriction",text:"發抖增加產熱、皮膚血管收縮減少散熱"},{id:"cold_sweat_more",text:"大量流汗增加散熱"},{id:"cold_vasodilation",text:"皮膚血管擴張讓熱更快散出"},{id:"cold_insulin",text:"胰島素降低血糖就是保溫"}]},
  {id:"temperature_glucose_homeostasis_q06",section:"checkpoint2",concept:"sweating_water_heat",type:"choice",answer:"sweating_cools_and_loses_water",prompt:"關於流汗，下列哪個說法最符合本單元範圍？",hint:"同時想一想流汗和散熱、水分流失之間的關係。",misconception:"sweating_only_water_or_only_heat",options:[{id:"sweating_cools_and_loses_water",text:"流汗蒸發可幫助散熱，但也會讓身體失去水分"},{id:"sweating_no_water_loss",text:"流汗只會降溫，不會造成水分流失"},{id:"sweating_heats_body",text:"流汗一定讓體溫上升"},{id:"sweating_makes_urine",text:"汗水在皮膚上直接變成尿液"}]},
  {id:"temperature_glucose_homeostasis_q07",section:"checkpoint2",concept:"temperature_data",type:"choice",answer:"body_temp_returns_to_range_data",prompt:"一位同學運動後體溫升高，休息並補充水分後，體溫逐漸回到平常範圍。哪個解讀較合理？",hint:"先比較體溫變化方向，再判斷是否接近適當範圍。",misconception:"temperature_data_misread",options:[{id:"body_temp_returns_to_range_data",text:"身體可能啟動散熱反應，使體溫往適當範圍回復"},{id:"temperature_fixed_forever",text:"體溫完全不可能有任何波動"},{id:"kidney_forms_heat",text:"腎臟形成尿液就是體溫下降的唯一原因"},{id:"cell_division_heats",text:"這表示染色體正在平均分配"}]},
  {id:"temperature_glucose_homeostasis_q08",section:"checkpoint2",concept:"temperature_feedback_sequence",type:"sequence",answer:["body_temperature_high","activate_heat_loss_response","sweating_or_vasodilation_increases_heat_loss","temperature_returns_toward_range"],prompt:"請拖曳排序：體溫偏高時，負回饋調節的大方向。",hint:"先找偏離狀態，再排出身體啟動反應、增加散熱，最後回到範圍附近。",misconception:"temperature_feedback_order_confusion",steps:[{id:"body_temperature_high",label:"體溫偏高，超出平常範圍"},{id:"activate_heat_loss_response",label:"身體啟動散熱方向的反應"},{id:"sweating_or_vasodilation_increases_heat_loss",label:"流汗或皮膚血管擴張讓散熱增加"},{id:"temperature_returns_toward_range",label:"體溫往適當範圍回復"}]},
  {id:"temperature_glucose_homeostasis_q09",section:"checkpoint3",concept:"blood_glucose_range",type:"choice",answer:"blood_glucose_returns_to_range",prompt:"飯後血糖升高，過一段時間又回到平常範圍附近。哪個解讀較合理？",hint:"先看血糖是否從偏高往範圍附近回復。",misconception:"glucose_data_misread",options:[{id:"blood_glucose_returns_to_range",text:"身體可能啟動血糖調節，使血糖往適當範圍回復"},{id:"glucose_never_changes",text:"血糖完全不會受飲食影響"},{id:"sweating_controls_glucose_only",text:"流汗是降低血糖的唯一方法"},{id:"alveoli_store_glucose",text:"肺泡會暫時儲存葡萄糖"}]},
  {id:"temperature_glucose_homeostasis_q10",section:"checkpoint3",concept:"high_glucose_insulin",type:"choice",answer:"high_glucose_insulin_lowers",prompt:"血糖偏高時，下列哪個方向較符合本單元的基礎概念？",hint:"用負回饋想：偏高時，調節方向應讓血糖往哪裡移動。",misconception:"insulin_direction_confusion",options:[{id:"high_glucose_insulin_lowers",text:"胰島素有助於讓血糖降低，往適當範圍回復"},{id:"high_glucose_glucagon",text:"升糖素讓血糖繼續升高"},{id:"high_glucose_no_response",text:"血糖偏高時身體完全不會調節"},{id:"high_glucose_cold_response",text:"發抖是降低血糖的主要反應"}]},
  {id:"temperature_glucose_homeostasis_q11",section:"checkpoint3",concept:"low_glucose_glucagon",type:"choice",answer:"low_glucose_glucagon_raises",prompt:"長時間未進食、血糖偏低時，下列哪個方向較符合本單元的基礎概念？",hint:"用負回饋想：偏低時，調節方向應讓血糖往哪裡移動。",misconception:"glucagon_direction_confusion",options:[{id:"low_glucose_glucagon_raises",text:"升糖素有助於讓血糖升高，往適當範圍回復"},{id:"low_glucose_insulin_more",text:"胰島素讓血糖繼續降低"},{id:"low_glucose_sweating",text:"流汗就是升高血糖的主要反應"},{id:"low_glucose_cell_wall",text:"細胞壁會直接提高血糖"}]},
  {id:"temperature_glucose_homeostasis_q12",section:"checkpoint3",concept:"glucose_curve",type:"choice",answer:"insulin_data_returns_glucose_range",prompt:"一張飯後血糖曲線顯示血糖先升高，之後逐漸下降並接近平常範圍。哪個解讀較合理？",hint:"觀察曲線方向：先偏高，後來是否往適當範圍回復。",misconception:"glucose_curve_misread",options:[{id:"insulin_data_returns_glucose_range",text:"血糖偏高後可能受胰島素等調節影響，逐漸回到範圍附近"},{id:"curve_means_no_homeostasis",text:"只要曲線有變化，就代表沒有恆定"},{id:"curve_is_temperature",text:"這張血糖曲線只能用來判斷體溫"},{id:"curve_is_urine",text:"曲線一定代表尿液路徑"}]},
  {id:"temperature_glucose_homeostasis_q13",section:"checkpoint3",concept:"feedback_direction_compare",type:"mapping",answer:{body_temperature_high:"increase_heat_loss",body_temperature_low:"conserve_or_make_heat",blood_glucose_high:"lower_glucose",blood_glucose_low:"raise_glucose"},prompt:"請把偏離狀態配對到較合適的負回饋調節方向。",hint:"先判斷每個狀態是偏高或偏低，再選會把它拉回適當範圍的方向。",misconception:"feedback_direction_confusion",items:[{id:"body_temperature_high",label:"體溫偏高"},{id:"body_temperature_low",label:"體溫偏低"},{id:"blood_glucose_high",label:"血糖偏高"},{id:"blood_glucose_low",label:"血糖偏低"}],choices:feedbackDirectionChoices},
  {id:"temperature_glucose_homeostasis_q14",section:"checkpoint3",concept:"unit_boundary_control",type:"choice",answer:"glucose_temperature_belongs_homeostasis",prompt:"下列哪一個情境最適合放在「體溫與血糖的恆定」本單元核心檢核？",hint:"找出和體溫或血糖偏離後，透過反向調節回到範圍附近最直接相關的情境。",misconception:"temperature_glucose_unit_boundary_confusion",options:[{id:"glucose_temperature_belongs_homeostasis",text:"飯後血糖偏高後逐漸回到範圍，或體溫偏高後增加散熱"},{id:"kidney_urine_belongs_excretion_water",text:"腎臟形成尿液並協助排出代謝廢物與多餘水分"},{id:"chromosome_division",text:"分裂前染色體複製並平均分配到子細胞"},{id:"cell_wall_support",text:"細胞壁提供植物細胞支持與保護"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["temperature_glucose_homeostasis_q01", "temperature_glucose_homeostasis_q02", "temperature_glucose_homeostasis_q03"],
  checkpoint2: ["temperature_glucose_homeostasis_q04", "temperature_glucose_homeostasis_q05", "temperature_glucose_homeostasis_q06", "temperature_glucose_homeostasis_q07", "temperature_glucose_homeostasis_q08"],
  checkpoint3: ["temperature_glucose_homeostasis_q09", "temperature_glucose_homeostasis_q10", "temperature_glucose_homeostasis_q11", "temperature_glucose_homeostasis_q12", "temperature_glucose_homeostasis_q13", "temperature_glucose_homeostasis_q14"]
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
  const attemptId = uid("temperature_glucose_homeostasis_guest_attempt");
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
  earned.push("temperature_glucose_homeostasis_entry");
  if (passed(["temperature_glucose_homeostasis_q01"])) earned.push("homeostasis_range_keeper");
  if (passed(["temperature_glucose_homeostasis_q02", "temperature_glucose_homeostasis_q13"])) earned.push("negative_feedback_direction_reader");
  if (passed(["temperature_glucose_homeostasis_q03"])) earned.push("endotherm_ectotherm_classifier");
  if (passed(["temperature_glucose_homeostasis_q04"])) earned.push("hot_response_heat_loss_reader");
  if (passed(["temperature_glucose_homeostasis_q05"])) earned.push("cold_response_heat_keeper");
  if (passed(["temperature_glucose_homeostasis_q06"])) earned.push("sweating_water_heat_linker");
  if (passed(["temperature_glucose_homeostasis_q07"])) earned.push("temperature_data_interpreter");
  if (passed(["temperature_glucose_homeostasis_q08"])) earned.push("temperature_feedback_sequence_tracker");
  if (passed(["temperature_glucose_homeostasis_q09"])) earned.push("blood_glucose_range_reader");
  if (passed(["temperature_glucose_homeostasis_q10", "temperature_glucose_homeostasis_q11"])) earned.push("blood_glucose_hormone_direction_reader");
  if (passed(["temperature_glucose_homeostasis_q12"])) earned.push("glucose_curve_interpreter");
  if (passed(["temperature_glucose_homeostasis_q14"])) earned.push("temperature_glucose_unit_boundary_guardian");
  if (correctedCore) earned.push("temperature_glucose_misconception_reviser");
  if (flawless) earned.push("temperature_glucose_homeostasis_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("temperature_glucose_homeostasis_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_temperature_glucose_homeostasis");
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
  if (["temperature_glucose_homeostasis_q01", "temperature_glucose_homeostasis_q02", "temperature_glucose_homeostasis_q03"].includes(questionId)) return "homeostasis_temperature_basics";
  if (["temperature_glucose_homeostasis_q04", "temperature_glucose_homeostasis_q05", "temperature_glucose_homeostasis_q06", "temperature_glucose_homeostasis_q07", "temperature_glucose_homeostasis_q08"].includes(questionId)) return "temperature_responses";
  if (["temperature_glucose_homeostasis_q09", "temperature_glucose_homeostasis_q10", "temperature_glucose_homeostasis_q11", "temperature_glucose_homeostasis_q12", "temperature_glucose_homeostasis_q13"].includes(questionId)) return "blood_glucose_feedback";
  if (questionId === "temperature_glucose_homeostasis_q14") return "unit_boundary_control";
  return "homeostasis_temperature_basics";
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
  const sceneAttrs = `${assets.briefingSceneHook ? ` data-briefing-scene-hook="${assets.briefingSceneHook}"` : ""}${assets.briefingSceneMobileHook ? ` data-mobile-hook="${assets.briefingSceneMobileHook}"` : ""}`;
  const sceneMedia = assets.briefingSceneHook
    ? `<picture class="brief-scene-media">
        ${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="體溫與血糖的恆定簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="恆定調節站場景待接">
        <strong>恆定調節站</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與體溫血糖監測場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene temperature-glucose-homeostasis-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>恆定調節站收到體溫與血糖警報。請協助判讀身體如何用負回饋，把偏高或偏低的狀態往適當範圍拉回。</p>
          <p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入恆定調節站前，先抓住四個調節線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚「適當範圍、負回饋、體溫反應、血糖調節」。</h3><p>本任務會用分類、排序與資料判讀，幫你判斷身體如何把偏高或偏低的狀態拉回範圍附近。</p></div></div><div class="concept-grid"><article><strong>恆定不是完全不變</strong><p>體溫與血糖可能小幅波動，重點是維持在適當範圍附近。</p></article><article><strong>負回饋方向</strong><p>偏高時啟動降低方向；偏低時啟動升高方向。</p></article><article><strong>體溫調節</strong><p>熱時增加散熱；冷時減少散熱或增加產熱。</p></article><article><strong>血糖調節</strong><p>血糖偏高可往下降低；偏低可往上升高，回到適當範圍。</p></article></div><button class="primary" data-next="checkpoint1">開始校正恆定警報</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["恆定、負回饋與內外溫動物","先分辨適當範圍、反向調節與動物體溫特性。"], checkpoint2:["體溫調節與散熱資料","判斷熱時、冷時與流汗水分散熱，並排出體溫偏高時的回饋流程。"], checkpoint3:["血糖調節、資料判讀與邊界","用血糖資料與偏高偏低狀態判斷調節方向，並守住相鄰單元邊界。"] }[section];
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

function conceptLabel(concept) { return {homeostasis_range:"恆定範圍",negative_feedback:"負回饋",endotherm_ectotherm:"內外溫動物",hot_response:"熱時散熱",cold_response:"冷時保溫",sweating_water_heat:"流汗與水分",temperature_data:"體溫資料",temperature_feedback_sequence:"體溫回饋排序",blood_glucose_range:"血糖範圍",high_glucose_insulin:"血糖偏高",low_glucose_glucagon:"血糖偏低",glucose_curve:"血糖曲線",feedback_direction_compare:"調節方向",unit_boundary_control:"單元邊界"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["temperature_glucose_homeostasis_q01", "temperature_glucose_homeostasis_q02"].includes(qid)) return `<div class="evidence-card"><strong>恆定概念卡</strong><p>身體狀態可有小幅波動；負回饋會把偏高或偏低的狀態往適當範圍拉回。</p></div>`;
  if (qid === "temperature_glucose_homeostasis_q03") return `<div class="evidence-card"><strong>動物體溫特性卡</strong><p>比較例子是否較能靠體內調節維持體溫，或較容易受外界環境影響。</p></div>`;
  if (["temperature_glucose_homeostasis_q04", "temperature_glucose_homeostasis_q05", "temperature_glucose_homeostasis_q06"].includes(qid)) return `<div class="evidence-card"><strong>體溫反應卡</strong><p>熱時看散熱，冷時看保溫或產熱；流汗同時和散熱、水分流失相關。</p></div>`;
  if (qid === "temperature_glucose_homeostasis_q07") return `<div class="evidence-card"><strong>體溫資料卡</strong><p>運動後體溫偏高，休息後逐漸往平常範圍回復。</p></div>`;
  if (qid === "temperature_glucose_homeostasis_q08") return `<div class="evidence-card"><strong>流程排序卡</strong><p>先找偏離狀態，再追蹤身體啟動調節反應與回到範圍的大方向。</p></div>`;
  if (["temperature_glucose_homeostasis_q09", "temperature_glucose_homeostasis_q12"].includes(qid)) return `<div class="evidence-card"><strong>血糖資料卡</strong><p>飯後血糖可能先升高，之後逐漸往平常範圍附近回復。</p></div>`;
  if (["temperature_glucose_homeostasis_q10", "temperature_glucose_homeostasis_q11", "temperature_glucose_homeostasis_q13"].includes(qid)) return `<div class="evidence-card"><strong>血糖調節方向卡</strong><p>判斷偏高或偏低，再選擇能把血糖往適當範圍拉回的方向。</p></div>`;
  if (qid === "temperature_glucose_homeostasis_q14") return `<div class="evidence-card"><strong>單元邊界卡</strong><p>本單元聚焦體溫與血糖的負回饋調節；腎臟排泄、細胞分裂與細胞構造屬相鄰單元。</p></div>`;
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
        <h2>先整理你目前的恆定調節判讀線索</h2>
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

function misconceptionText(tag) { return {
  homeostasis_fixed_value:"建議再確認：恆定是維持在適當範圍附近，不是完全固定不變。",
  feedback_same_direction:"建議再用負回饋方向判斷：偏高通常啟動降低方向，偏低通常啟動升高方向。",
  endotherm_ectotherm_confusion:"建議再比較內溫與外溫動物：看體溫較能由體內調節，或較容易受環境影響。",
  hot_response_confusion:"建議再確認熱時反應：流汗與皮膚血管擴張有助於散熱。",
  cold_response_confusion:"建議再確認冷時反應：發抖與皮膚血管收縮有助於保溫或產熱。",
  sweating_only_water_or_only_heat:"建議再連結流汗、散熱與水分流失：流汗可幫助散熱，也會失去水分。",
  temperature_data_misread:"建議再練習體溫資料判讀：先看偏高後是否往平常範圍回復。",
  temperature_feedback_order_confusion:"建議再整理體溫偏高的回饋流程：偏高、啟動散熱反應、增加散熱、回到範圍。",
  glucose_data_misread:"建議再練習血糖資料判讀：飯後偏高後是否往平常範圍回復。",
  insulin_direction_confusion:"建議再確認胰島素方向：血糖偏高時有助於讓血糖降低。",
  glucagon_direction_confusion:"建議再確認升糖素方向：血糖偏低時有助於讓血糖升高。",
  glucose_curve_misread:"建議再用曲線判斷血糖變化方向，不要把有波動誤判成沒有恆定。",
  feedback_direction_confusion:"建議再把體溫與血糖都用偏高/偏低判斷調節方向。",
  temperature_glucose_unit_boundary_confusion:"建議再確認單元邊界：本單元聚焦體溫與血糖；腎臟排泄屬 U25，細胞分裂屬 U27。"
}[tag] || tag; }

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
        <p class="muted">可以從恆定範圍、負回饋、內溫/外溫動物、熱時散熱、冷時保溫、流汗與水分、血糖偏高/偏低調節或資料判讀中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：負回饋會把偏高或偏低的狀態拉回適當範圍">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>恆定警報校正任務結算</h2>
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
    <h2>本單元 17 枚徽章</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與恆定範圍、負回饋、體溫反應、流汗水分或血糖調節相關的問題才會取得回報 EXP。</li>
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
  window.__temperature_glucose_homeostasisTest = {
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
