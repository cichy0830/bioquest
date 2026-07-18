const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-behavior-sensing-ready-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_behavior_sensing_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "behavior_sensing",
  unit_title: "行為與感應",
  mission_title: "環境訊號判讀任務",
  mission_area: "反應控制室"
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
  conceptTerms: ["行為", "感應", "刺激", "反應", "動物行為", "取食", "避敵", "求偶", "育幼", "趨性", "向性", "植物感應", "觸發運動", "睡眠運動", "含羞草", "向光", "生長方向", "整體移動", "資料判讀"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["動物行為功能", "趨性", "向性", "觸發運動", "睡眠運動", "植物反應方式", "資料判讀"]
};

const badges = [
  ["behavior_sensing_entry", "環境訊號入門徽章", "完成環境訊號判讀任務。"],
  ["stimulus_adaptation_observer", "刺激適應觀察徽章", "能說明生物會對環境刺激產生反應。"],
  ["animal_behavior_function_mapper", "動物行為功能判讀徽章", "能用取食、避敵、求偶、育幼方向判讀行為。"],
  ["taxis_whole_body_tracker", "趨性整體移動辨識徽章", "能以整個生物體移動判斷趨性。"],
  ["tropism_growth_direction_reader", "向性生長方向判讀徽章", "能用植物生長方向改變判斷向性。"],
  ["taxis_tropism_classifier", "趨性向性分類徽章", "能完整分類趨性與向性情境。"],
  ["plant_nastic_response_reader", "植物感應運動判讀徽章", "能判斷含羞草觸發運動與局部可逆反應。"],
  ["sleep_movement_observer", "睡眠運動觀察徽章", "能判斷晝夜葉片開合屬植物感應反應。"],
  ["plant_response_boundary_guardian", "植物反應邊界守門徽章", "能修正植物不會反應的迷思。"],
  ["behavior_evidence_interpreter", "行為感應證據判讀徽章", "能用情境與資料判讀反應類型。"],
  ["behavior_unit_boundary_guardian", "單元邊界辨識徽章", "能守住行為與感應和相鄰單元的邊界。"],
  ["behavior_sensing_misconception_reviser", "行為感應迷思修正徽章", "提示後修正本單元迷思。"],
  ["behavior_sensing_flawless", "環境訊號零提示全對徽章", "全部答對且全程未使用提示。"],
  ["behavior_sensing_reflection_reporter", "高品質行為感應回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_behavior_sensing", "再探行為感應進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const behaviorFunctionChoices = [
  { id: "feeding", text: "取食" },
  { id: "avoid_predator", text: "避敵" },
  { id: "courtship", text: "求偶" },
  { id: "parental_care", text: "育幼" }
];
const taxisTropismChoices = [
  { id: "taxis", text: "趨性" },
  { id: "tropism", text: "向性" }
];

const questions = [
  {id:"behavior_sensing_q01",section:"checkpoint1",concept:"stimulus_response_adaptation",type:"choice",answer:"organisms_respond_to_stimuli",prompt:"看到強光、聞到食物氣味或碰到危險物時，生物可能出現不同反應。哪個說法最能說明本單元重點？",hint:"找出同時包含「環境刺激」和「生物反應」的敘述。",misconception:"plants_do_not_respond",options:[{id:"organisms_respond_to_stimuli",text:"生物能對環境刺激產生反應，這些反應常有助於適應環境"},{id:"sleep_only_response",text:"生物只會在睡覺時反應"},{id:"winged_animals_only",text:"只有有翅膀的動物才會反應"},{id:"no_environment_effect",text:"植物和動物都完全不受環境影響"}]},
  {id:"behavior_sensing_q02",section:"checkpoint1",concept:"animal_behavior_function",type:"choice",answer:"parental_behavior_reproduction",prompt:"鳥類築巢並餵食幼鳥，最適合用哪個方向理解這種行為？",hint:"先看這個行為和後代存活或繁殖是否有關。",misconception:"animal_behavior_function_confusion",options:[{id:"parental_behavior_reproduction",text:"和育幼及繁殖成功有關"},{id:"moves_oxygen",text:"只是在移動氧氣"},{id:"plant_phototropism",text:"是植物向光生長"},{id:"blood_glucose_regulation",text:"是血糖調節"}]},
  {id:"behavior_sensing_q03",section:"checkpoint1",concept:"animal_behavior_function",type:"mapping",answer:{butterfly_nectar:"feeding",rabbit_hide_sound:"avoid_predator",peacock_display:"courtship",bird_feed_young:"parental_care"},prompt:"請將動物行為情境配到較合適的功能方向。",hint:"先問自己：這個行為比較是在取得食物、避開危險，還是和繁殖後代有關。",misconception:"animal_behavior_function_confusion",items:[{id:"butterfly_nectar",label:"蝴蝶吸食花蜜"},{id:"rabbit_hide_sound",label:"兔子聽到聲響躲藏"},{id:"peacock_display",label:"孔雀展羽吸引配偶"},{id:"bird_feed_young",label:"鳥類餵食幼鳥"}],choices:behaviorFunctionChoices},
  {id:"behavior_sensing_q04",section:"checkpoint1",concept:"animal_behavior_function",type:"choice",answer:"behavior_supports_survival_reproduction",prompt:"有同學說：「動物行為多半沒有意義，只是看起來在活動。」哪個修正較合理？",hint:"想想行為是否可能幫助生物活下來或留下後代。",misconception:"animal_behavior_no_function",options:[{id:"behavior_supports_survival_reproduction",text:"許多動物行為和取食、避敵、求偶、育幼或適應環境有關"},{id:"sleep_only",text:"所有動物行為都只為了睡覺"},{id:"caused_by_plant_growth",text:"動物行為一定是植物生長造成"},{id:"controlled_by_alveoli",text:"動物行為只由肺泡控制"}]},
  {id:"behavior_sensing_q05",section:"checkpoint2",concept:"taxis_whole_organism",type:"choice",answer:"taxis_whole_body_moves",prompt:"一種小型生物在水中會朝光源方向游動。這種「整個生物朝刺激方向移動」較接近哪個概念？",hint:"觀察重點是整個生物體的位置有沒有改變。",misconception:"taxis_tropism_confusion",options:[{id:"taxis_whole_body_moves",text:"趨性"},{id:"tropism",text:"向性"},{id:"sleep_movement",text:"睡眠運動"},{id:"blood_glucose_regulation",text:"血糖調節"}]},
  {id:"behavior_sensing_q06",section:"checkpoint2",concept:"taxis_whole_organism",type:"choice",answer:"taxis_not_plant_bending",prompt:"有同學說：「只要植物的一部分往光彎，就是趨性。」哪個修正較合理？",hint:"分辨「整個生物移動」和「植物生長方向改變」。",misconception:"taxis_tropism_confusion",options:[{id:"taxis_not_plant_bending",text:"趨性重點是生物整體移動；植物生長方向受光影響較接近向性"},{id:"taxis_in_blood_only",text:"趨性只會發生在血液裡"},{id:"plants_never_respond",text:"趨性代表植物完全不會反應"},{id:"taxis_respiration",text:"趨性就是呼吸作用"}]},
  {id:"behavior_sensing_q07",section:"checkpoint2",concept:"tropism_growth_direction",type:"choice",answer:"phototropism_growth_direction",prompt:"放在窗邊的豆苗，幾天後莖往光線較強的一側彎長。這較接近哪個概念？",hint:"注意反應需要一段生長時間，而且是植物莖的生長方向改變。",misconception:"plant_tropism_as_taxis",options:[{id:"phototropism_growth_direction",text:"向性"},{id:"taxis",text:"趨性"},{id:"pulmonary_circulation",text:"肺循環"},{id:"insulin_action",text:"胰島素作用"}]},
  {id:"behavior_sensing_q08",section:"checkpoint2",concept:"evidence_interpretation",type:"mapping",answer:{bug_to_dark:"taxis",stem_bends_to_window:"tropism",root_grows_down:"tropism",unicell_away_strong_light:"taxis"},prompt:"請依情境判斷較接近「趨性」或「向性」。",hint:"每個情境先看反應者是整個生物移動，還是植物部位因生長改變方向。",misconception:"taxis_tropism_confusion",items:[{id:"bug_to_dark",label:"小蟲整隻往陰暗處爬"},{id:"stem_bends_to_window",label:"植物莖往窗邊彎長"},{id:"root_grows_down",label:"植物根向下生長"},{id:"unicell_away_strong_light",label:"單細胞生物遠離強光移動"}],choices:taxisTropismChoices},
  {id:"behavior_sensing_q09",section:"checkpoint3",concept:"plant_nastic_response",type:"choice",answer:"touch_nastic_response",prompt:"含羞草葉片被碰觸後快速閉合，過一段時間又逐漸打開。這較適合判斷為哪一類反應？",hint:"看反應是不是由碰觸引發，且主要是植物局部構造快速改變。",misconception:"nastic_vs_taxis_confusion",options:[{id:"touch_nastic_response",text:"觸發運動或植物感應運動"},{id:"whole_plant_crawls",text:"整株植物往前爬的趨性"},{id:"alveoli_exchange",text:"肺泡氣體交換"},{id:"pancreas_hormone",text:"胰島分泌激素"}]},
  {id:"behavior_sensing_q10",section:"checkpoint3",concept:"plant_nastic_response",type:"choice",answer:"sleep_movement_day_night",prompt:"某些植物的葉片白天展開、夜晚合起，這種隨晝夜變化的可逆反應較接近哪個概念？",hint:"找出和晝夜變化、葉片開合、可逆反應最相關的說法。",misconception:"plant_sensing_movement_confusion",options:[{id:"sleep_movement_day_night",text:"睡眠運動"},{id:"body_circulation",text:"體循環"},{id:"digestion_absorption",text:"消化吸收"},{id:"reflex_pathway",text:"神經元反射路徑"}]},
  {id:"behavior_sensing_q11",section:"checkpoint3",concept:"plant_response_boundary",type:"choice",answer:"plants_respond_without_animal_nerves",prompt:"有同學說：「植物沒有神經，所以一定不會對刺激產生反應。」哪個修正較合理？",hint:"想想向光彎長或含羞草閉合是否都需要動物式神經系統。",misconception:"plants_do_not_respond",options:[{id:"plants_respond_without_animal_nerves",text:"植物沒有像動物一樣的神經系統，但仍能對光、重力、觸碰或晝夜變化產生反應"},{id:"plants_use_alveoli",text:"植物一定用肺泡接收刺激"},{id:"plants_use_insulin",text:"植物只靠胰島素移動"},{id:"plants_never_change",text:"植物完全不能改變任何構造或姿態"}]},
  {id:"behavior_sensing_q12",section:"checkpoint3",concept:"tropism_growth_direction",type:"choice",answer:"light_affects_growth_direction",prompt:"一組觀察紀錄顯示：把幼苗單側照光三天後，莖逐漸往光源方向彎長。這份紀錄最支持哪個判斷？",hint:"從資料看「三天後」「莖彎長」兩個線索，不必加入其他系統。",misconception:"plant_tropism_as_taxis",options:[{id:"light_affects_growth_direction",text:"光會影響植物莖的生長方向"},{id:"whole_plant_walks",text:"植物整株像動物一樣走向光源"},{id:"light_alveoli_exchange",text:"光讓肺泡交換氧氣"},{id:"insulin_bends_stem",text:"胰島素讓莖彎曲"}]},
  {id:"behavior_sensing_q13",section:"checkpoint3",concept:"plant_nastic_response",type:"choice",answer:"reversible_touch_response",prompt:"觀察含羞草：碰觸後葉片很快閉合，等待一段時間又打開；同一天再碰觸也可能再次閉合。這份紀錄較支持哪個判斷？",hint:"先看反應是否由碰觸引發、是否局部、是否可逆。",misconception:"nastic_vs_tropism_confusion",options:[{id:"reversible_touch_response",text:"這是受碰觸影響的局部、可逆反應"},{id:"whole_plant_migration",text:"這表示整株植物正在遷徙"},{id:"leaf_pulmonary",text:"這表示葉片正在進行肺循環"},{id:"plants_no_response",text:"這表示所有植物都完全不會反應"}]},
  {id:"behavior_sensing_q14",section:"checkpoint3",concept:"plant_response_boundary",type:"choice",answer:"touch_response_belongs_behavior_sensing",prompt:"下列哪一個情境最適合放在「行為與感應」本單元核心檢核？",hint:"找出與環境刺激造成的行為或植物反應最直接相關的情境。",misconception:"unit_boundary_confusion",options:[{id:"touch_response_belongs_behavior_sensing",text:"含羞草受到碰觸後葉片閉合"},{id:"alveoli_oxygen_to_blood",text:"肺泡讓氧氣進入血液"},{id:"insulin_lowers_blood_glucose",text:"胰島素協助血糖降低"},{id:"diaphragm_inhale",text:"橫膈下降造成吸氣"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["behavior_sensing_q01", "behavior_sensing_q02", "behavior_sensing_q03", "behavior_sensing_q04"],
  checkpoint2: ["behavior_sensing_q05", "behavior_sensing_q06", "behavior_sensing_q07", "behavior_sensing_q08"],
  checkpoint3: ["behavior_sensing_q09", "behavior_sensing_q10", "behavior_sensing_q11", "behavior_sensing_q12", "behavior_sensing_q13", "behavior_sensing_q14"]
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
  const attemptId = uid("behavior_sensing_guest_attempt");
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
  earned.push("behavior_sensing_entry");
  if (passed(["behavior_sensing_q01"])) earned.push("stimulus_adaptation_observer");
  if (passed(["behavior_sensing_q02", "behavior_sensing_q03", "behavior_sensing_q04"])) earned.push("animal_behavior_function_mapper");
  if (passed(["behavior_sensing_q05", "behavior_sensing_q06"])) earned.push("taxis_whole_body_tracker");
  if (passed(["behavior_sensing_q07", "behavior_sensing_q12"])) earned.push("tropism_growth_direction_reader");
  if (passed(["behavior_sensing_q08"])) earned.push("taxis_tropism_classifier");
  if (passed(["behavior_sensing_q09", "behavior_sensing_q13"])) earned.push("plant_nastic_response_reader");
  if (passed(["behavior_sensing_q10"])) earned.push("sleep_movement_observer");
  if (passed(["behavior_sensing_q11"])) earned.push("plant_response_boundary_guardian");
  if (passed(["behavior_sensing_q08", "behavior_sensing_q12", "behavior_sensing_q13"])) earned.push("behavior_evidence_interpreter");
  if (passed(["behavior_sensing_q14"])) earned.push("behavior_unit_boundary_guardian");
  if (correctedCore) earned.push("behavior_sensing_misconception_reviser");
  if (flawless) earned.push("behavior_sensing_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("behavior_sensing_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_behavior_sensing");
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
  if (["behavior_sensing_q01", "behavior_sensing_q04", "behavior_sensing_q11"].includes(questionId)) return "behavior_response_basics";
  if (["behavior_sensing_q02", "behavior_sensing_q03", "behavior_sensing_q04"].includes(questionId)) return "animal_behavior_functions";
  if (["behavior_sensing_q05", "behavior_sensing_q06", "behavior_sensing_q07", "behavior_sensing_q08", "behavior_sensing_q12"].includes(questionId)) return "taxis_vs_tropism";
  if (["behavior_sensing_q09", "behavior_sensing_q10", "behavior_sensing_q13"].includes(questionId)) return "plant_nastic_movements";
  if (questionId === "behavior_sensing_q14") return "unit_boundary_control";
  return "behavior_response_basics";
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
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="行為與感應簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="反應控制室場景待接">
        <strong>反應控制室</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與環境訊號判讀場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene behavior-sensing-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>反應控制室收到多筆環境訊號紀錄。請判斷動物與植物如何回應光、觸碰、氣味與晝夜變化，並分辨趨性、向性與植物感應運動。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入反應控制室前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先看「刺激、反應者、反應方式、是否整體移動」。</h3><p>動物可能用行為回應刺激；植物也會用生長方向或局部運動回應光、觸碰與晝夜變化。</p></div></div><div class="concept-grid"><article><strong>刺激與反應</strong><p>生物會接收環境刺激並產生反應，這些反應常有助於適應環境。</p></article><article><strong>動物行為功能</strong><p>動物行為可從取食、避敵、求偶、育幼等生活需求方向判斷。</p></article><article><strong>趨性與向性</strong><p>趨性看整個生物體移動；向性看植物生長方向受刺激影響。</p></article><article><strong>植物感應運動</strong><p>含羞草觸發運動與睡眠運動都屬植物對刺激的反應，但不是整株像動物般移動。</p></article></div><button class="primary" data-next="checkpoint1">開始判讀環境訊號</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["刺激反應與動物行為","先確認環境刺激、生物反應，以及動物行為可能支持的生活需求。"], checkpoint2:["趨性與向性判讀","用整體移動或植物生長方向改變，分辨趨性與向性。"], checkpoint3:["植物感應運動與邊界","判讀含羞草、睡眠運動、植物反應方式，並守住相鄰單元邊界。"] }[section];
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

function conceptLabel(concept) { return {stimulus_response_adaptation:"刺激反應",animal_behavior_function:"動物行為",taxis_whole_organism:"趨性",tropism_growth_direction:"向性",plant_nastic_response:"植物感應運動",plant_response_boundary:"植物反應邊界",evidence_interpretation:"資料判讀"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["behavior_sensing_q01", "behavior_sensing_q02", "behavior_sensing_q03", "behavior_sensing_q04"].includes(qid)) return `<div class="evidence-card"><strong>動物行為情境卡</strong><p>先找刺激與反應，再判斷行為可能和取食、避敵、求偶或育幼哪個生活需求較相關。</p></div>`;
  if (["behavior_sensing_q05", "behavior_sensing_q06", "behavior_sensing_q07", "behavior_sensing_q08"].includes(qid)) return `<div class="evidence-card"><strong>趨性 / 向性線索卡</strong><p>趨性看整個生物體移動；向性看植物部位因生長改變方向。</p></div>`;
  if (["behavior_sensing_q09", "behavior_sensing_q10", "behavior_sensing_q13"].includes(qid)) return `<div class="evidence-card"><strong>植物感應運動卡</strong><p>觀察反應是否由觸碰或晝夜變化引發、是否局部、是否可逆。</p></div>`;
  if (qid === "behavior_sensing_q11") return `<div class="evidence-card"><strong>植物反應邊界卡</strong><p>植物沒有動物式神經系統，但仍可能以生長或局部運動回應刺激。</p></div>`;
  if (qid === "behavior_sensing_q12") return `<div class="evidence-card"><strong>觀察紀錄卡</strong><p>從時間、光照方向與莖彎長等線索判讀資料，不把植物說成整株移動。</p></div>`;
  if (qid === "behavior_sensing_q14") return `<div class="evidence-card"><strong>單元邊界卡</strong><p>本單元聚焦行為與感應；激素、血糖、肺泡與吸氣呼氣屬相鄰單元。</p></div>`;
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
        <h2>先整理你目前的環境訊號判讀線索</h2>
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
  plants_do_not_respond:"建議再確認：植物沒有動物式神經系統，但仍能對光、重力、觸碰或晝夜變化產生反應。",
  animal_behavior_function_confusion:"建議再用生活功能理解動物行為：取食、避敵、求偶、育幼等方向可幫助判讀情境。",
  animal_behavior_no_function:"建議再確認：許多動物行為和存活、繁殖或適應環境有關，不只是隨意活動。",
  taxis_tropism_confusion:"建議再比較趨性與向性：趨性看整個生物移動，向性看植物生長方向改變。",
  plant_tropism_as_taxis:"建議再閱讀植物向性：莖往光彎長是生長方向受光影響，不是整株植物走向光。",
  nastic_vs_taxis_confusion:"建議再比較觸發運動與趨性：含羞草葉片閉合是局部感應運動，不是整株移動。",
  plant_sensing_movement_confusion:"建議再確認睡眠運動：某些植物葉片會隨晝夜出現可逆開合。",
  nastic_vs_tropism_confusion:"建議再比較感應運動與向性：感應運動可較快且可逆，向性重點是生長方向。",
  unit_boundary_confusion:"建議再確認本單元邊界：行為與感應看環境刺激造成的行為或植物反應；激素與呼吸氣體交換屬相鄰單元。"
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
        <p class="muted">可以從動物行為功能、趨性、向性、觸發運動、睡眠運動、植物反應方式或資料判讀中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：趨性看整個生物體移動">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認含羞草閉合和豆苗向光彎長都算植物反應，為什麼一個不是向性？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>環境訊號判讀任務結算</h2>
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
    <h2>本單元 15 枚徽章</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與動物行為、趨性、向性、觸發運動、睡眠運動、植物反應方式或資料判讀相關的問題才會取得回報 EXP。</li>
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
  window.__behavior_sensingTest = {
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
