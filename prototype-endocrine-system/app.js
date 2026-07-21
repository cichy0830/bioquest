const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260721-endocrine-system-minimal-p1-v1";
const QUESTION_VERSION = "20260718-endocrine-system-ready-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_endocrine_system_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "endocrine_system",
  unit_title: "內分泌系統",
  mission_title: "激素訊號追蹤任務",
  mission_area: "內分泌調節站"
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
  conceptTerms: ["內分泌", "激素", "內分泌腺", "血液", "血糖", "目標器官", "腦垂腺", "甲狀腺", "胰島", "腎上腺", "性腺", "胰島素", "升糖素", "代謝", "生長", "青春期", "調節", "神經調節", "平衡"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["內分泌腺與激素", "血液運送", "目標器官", "主要腺體功能", "胰島素/升糖素", "神經調節和激素調節比較"]
};

const badges = [
  ["endocrine_system_entry", "內分泌任務入門徽章", "完成激素訊號追蹤任務。"],
  ["endocrine_gland_mapper", "內分泌腺辨識徽章", "能說明內分泌腺會分泌激素。"],
  ["hormone_blood_target_tracker", "激素血液目標追蹤徽章", "能追蹤激素經血液到目標器官。"],
  ["pituitary_role_reader", "腦垂腺角色判讀徽章", "能判斷腦垂腺與生長及調節部分腺體有關。"],
  ["thyroid_metabolism_connector", "甲狀腺代謝連結徽章", "能連結甲狀腺與代謝、生長發育。"],
  ["pancreas_blood_glucose_regulator", "胰島血糖調節徽章", "能判斷胰島參與血糖調節。"],
  ["insulin_glucagon_balancer", "胰島素升糖素平衡徽章", "能比較胰島素與升糖素的方向。"],
  ["adrenal_response_connector", "腎上腺緊急反應徽章", "能連結腎上腺與緊急狀態反應。"],
  ["gonad_puberty_role_reader", "性腺發育角色徽章", "能判斷性腺與生殖及青春期發育有關。"],
  ["hormone_balance_reasoner", "激素適量推理徽章", "能理解激素過多或過少都不適合。"],
  ["endocrine_nervous_compare", "神經內分泌比較徽章", "能比較神經調節與激素調節差異。"],
  ["endocrine_system_misconception_reviser", "內分泌迷思修正徽章", "提示後修正本單元迷思。"],
  ["endocrine_system_flawless", "激素訊號零提示全對徽章", "全部答對且全程未使用提示。"],
  ["endocrine_system_reflection_reporter", "高品質內分泌回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_endocrine_system", "再探內分泌進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const sequenceSteps = [
  { id: "gland_secretes", label: "內分泌腺分泌激素" },
  { id: "hormone_enters_blood", label: "激素進入血液" },
  { id: "blood_transports", label: "血液運送激素" },
  { id: "target_reached", label: "激素到達目標器官" },
  { id: "target_responds", label: "目標器官產生反應" }
];
const correctSequence = sequenceSteps.map((step) => step.id);
const glandRoleChoices = [
  { id: "growth_regulation", text: "影響生長並可調節部分內分泌腺" },
  { id: "metabolism_growth", text: "影響代謝與生長發育" },
  { id: "blood_glucose", text: "參與血糖調節" },
  { id: "emergency_response", text: "協助身體面對緊急狀態" }
];

const questions = [
  {id:"endocrine_system_q01",section:"checkpoint1",concept:"endocrine_gland_role",type:"choice",answer:"endocrine_gland_secretes_hormones",prompt:"下列哪一項最能描述內分泌腺的主要角色？",hint:"找出和「分泌激素」以及「調節身體活動」最相關的描述。",misconception:"gland_hormone_confusion",options:[{id:"endocrine_gland_secretes_hormones",text:"分泌激素來調節身體活動"},{id:"pushes_blood",text:"直接把血液推到全身"},{id:"makes_oxygen",text:"製造氧氣供細胞使用"},{id:"body_support",text:"只負責支撐身體形狀"}]},
  {id:"endocrine_system_q02",section:"checkpoint1",concept:"hormone_transport_blood",type:"choice",answer:"hormone_travels_in_blood",prompt:"激素從內分泌腺分泌後，通常主要靠哪一種方式運送到身體各處？",hint:"想想激素離開腺體後，是靠哪個系統被送到較遠的地方。",misconception:"hormone_nerve_confusion",options:[{id:"hormone_travels_in_blood",text:"進入血液後隨血液運送"},{id:"neural_fiber",text:"沿神經纖維快速傳遞"},{id:"skin_surface",text:"只在皮膚表面擴散"},{id:"becomes_bone",text:"直接變成骨骼"}]},
  {id:"endocrine_system_q03",section:"checkpoint1",concept:"target_organ_specificity",type:"choice",answer:"hormone_targets_specific_organs",prompt:"有同學說：「激素進入血液後，身體所有細胞都一定產生一樣的反應。」哪個修正較合理？",hint:"激素可能到達許多地方，但不是所有地方都會同樣回應。",misconception:"target_organ_confusion",options:[{id:"hormone_targets_specific_organs",text:"激素主要影響能對它產生反應的目標器官或細胞"},{id:"no_blood",text:"激素完全不能進入血液"},{id:"bone_only",text:"激素只會作用在骨頭"},{id:"digestion_only",text:"所有激素都只負責消化"}]},
  {id:"endocrine_system_q04",section:"checkpoint1",concept:"hormone_transport_blood",type:"sequence",answer:correctSequence,prompt:"請拖曳排序，排出激素訊息傳遞的基本流程。",hint:"先找訊息從哪裡產生，再看它如何被運送，最後才看作用對象。",misconception:"endocrine_pathway_order_confusion",steps:sequenceSteps},
  {id:"endocrine_system_q05",section:"checkpoint2",concept:"major_glands_roles",type:"mapping",answer:{pituitary:"growth_regulation",thyroid:"metabolism_growth",pancreatic_islets:"blood_glucose",adrenal:"emergency_response"},prompt:"請將內分泌腺與較適合的功能方向配對。",hint:"先看題目中每個功能是生長、代謝、血糖，還是緊急狀態反應。",misconception:"gland_function_confusion",items:[{id:"pituitary",label:"腦垂腺"},{id:"thyroid",label:"甲狀腺"},{id:"pancreatic_islets",label:"胰島"},{id:"adrenal",label:"腎上腺"}],choices:glandRoleChoices},
  {id:"endocrine_system_q06",section:"checkpoint2",concept:"major_glands_roles",type:"choice",answer:"pituitary_growth_regulation",prompt:"哪一個腺體和「影響生長，並可調節部分內分泌腺活動」較有關？",hint:"找出常被稱為會影響生長，也會調節部分腺體活動的內分泌腺。",misconception:"gland_function_confusion",options:[{id:"pituitary_growth_regulation",text:"腦垂腺"},{id:"small_intestine",text:"小腸"},{id:"alveolus",text:"肺泡"},{id:"chloroplast",text:"葉綠體"}]},
  {id:"endocrine_system_q07",section:"checkpoint2",concept:"major_glands_roles",type:"choice",answer:"thyroid_metabolism_growth",prompt:"哪一個腺體和「影響代謝與生長發育」較有關？",hint:"注意關鍵詞是代謝和生長發育，不是消化、保護或物質交換。",misconception:"gland_function_confusion",options:[{id:"thyroid_metabolism_growth",text:"甲狀腺"},{id:"stomach",text:"胃"},{id:"rib",text:"肋骨"},{id:"capillary",text:"微血管"}]},
  {id:"endocrine_system_q08",section:"checkpoint2",concept:"major_glands_roles",type:"choice",answer:"gonads_reproduction_development",prompt:"哪一組配對較合理？",hint:"看看哪個功能和性腺名稱最直接相關。",misconception:"gland_function_confusion",options:[{id:"gonads_reproduction_development",text:"性腺：和生殖功能及青春期發育有關"},{id:"gonads_bile",text:"性腺：主要製造膽汁"},{id:"gonads_photosynthesis",text:"性腺：主要控制光合作用"},{id:"gonads_oxygen",text:"性腺：把氧氣送進血液"}]},
  {id:"endocrine_system_q09",section:"checkpoint3",concept:"insulin_role",type:"choice",answer:"insulin_lowers_blood_glucose",prompt:"飯後血糖上升時，哪一種激素可幫助血糖降低、回到較適當範圍？",hint:"看清楚題目問的是血糖偏高時，哪個激素方向是「降低」。",misconception:"insulin_glucagon_confusion",options:[{id:"insulin_lowers_blood_glucose",text:"胰島素"},{id:"glucagon",text:"升糖素"},{id:"chlorophyll",text:"葉綠素"},{id:"amylase",text:"唾液澱粉酶"}]},
  {id:"endocrine_system_q10",section:"checkpoint3",concept:"glucagon_role",type:"choice",answer:"glucagon_raises_blood_glucose",prompt:"若血糖偏低，哪一種激素可幫助血糖升高？",hint:"題目關鍵是血糖偏低，需要讓血糖往上調整。",misconception:"insulin_glucagon_confusion",options:[{id:"glucagon_raises_blood_glucose",text:"升糖素"},{id:"insulin",text:"胰島素"},{id:"gastric_acid",text:"胃酸"},{id:"hemoglobin",text:"血紅素"}]},
  {id:"endocrine_system_q11",section:"checkpoint3",concept:"pancreas_blood_glucose",type:"choice",answer:"insulin_data_lowers_glucose",prompt:"一組資料顯示：飯後血糖升高時，胰島素量也上升；過一段時間血糖逐漸下降。哪個解讀較合理？",hint:"先比較血糖和胰島素量的變化方向，再看血糖後來往哪裡變化。",misconception:"blood_glucose_data_misread",options:[{id:"insulin_data_lowers_glucose",text:"胰島素和降低血糖有關"},{id:"insulin_raises_forever",text:"胰島素一定讓血糖越來越高"},{id:"no_relation",text:"血糖和激素完全無關"},{id:"neurons_disappear",text:"這表示神經元消失了"}]},
  {id:"endocrine_system_q12",section:"checkpoint3",concept:"hormone_balance",type:"choice",answer:"hormones_need_balance",prompt:"有同學說：「激素越多越好，分泌越多身體一定越健康。」哪個修正較合理？",hint:"注意「調節」不代表越多越好，身體功能通常需要維持適當範圍。",misconception:"hormone_more_is_better",options:[{id:"hormones_need_balance",text:"激素需要適量，過多或過少都可能影響身體功能"},{id:"no_effect",text:"激素完全沒有作用"},{id:"plant_only",text:"激素只會存在植物"},{id:"all_lower_glucose",text:"所有激素都只讓血糖下降"}]},
  {id:"endocrine_system_q13",section:"checkpoint3",concept:"insulin_role",type:"choice",answer:"insulin_glucagon_opposite_directions",prompt:"有同學說：「胰島素和升糖素作用一樣，都是讓血糖下降。」哪個修正較合理？",hint:"從兩個名稱中的「升糖」線索和血糖調節方向思考。",misconception:"insulin_glucagon_confusion",options:[{id:"insulin_glucagon_opposite_directions",text:"胰島素可使血糖降低，升糖素可使血糖升高"},{id:"both_harden_bone",text:"兩者都只負責讓骨骼變硬"},{id:"both_reflex",text:"兩者都只負責神經反射"},{id:"not_pancreas",text:"兩者都和胰島無關"}]},
  {id:"endocrine_system_q14",section:"checkpoint3",concept:"nerve_endocrine_compare",type:"choice",answer:"nerve_endocrine_different_coordination",prompt:"有同學說：「神經系統和內分泌系統完全一樣，只是名稱不同。」哪個修正較合理？",hint:"先想訊息走的路徑：神經沿神經路線，激素多經血液運送。",misconception:"nerve_endocrine_same",options:[{id:"nerve_endocrine_different_coordination",text:"兩者都能協調身體活動，但神經訊息通常較快、路徑較明確；激素經血液運送，作用可能較慢、較廣或較持久"},{id:"endocrine_neurons_only",text:"內分泌系統只包含神經元"},{id:"nerve_blood_only",text:"神經系統只靠血液運送訊息"},{id:"both_photosynthesis",text:"兩者都只控制光合作用"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["endocrine_system_q01", "endocrine_system_q02", "endocrine_system_q03", "endocrine_system_q04"],
  checkpoint2: ["endocrine_system_q05", "endocrine_system_q06", "endocrine_system_q07", "endocrine_system_q08"],
  checkpoint3: ["endocrine_system_q09", "endocrine_system_q10", "endocrine_system_q11", "endocrine_system_q12", "endocrine_system_q13", "endocrine_system_q14"]
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
    question_version: QUESTION_VERSION,
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
    return parsed && parsed.question_version ? { ...createEmptyState(), ...parsed, question_version: QUESTION_VERSION } : createEmptyState();
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

function titleAndProgress(student = state.student) {
  const remoteTotal = Number(student?.progress?.total_exp ?? student?.total_exp);
  const explicitLevel = titleLevels.find((level) => level.id === (student?.current_title_id || student?.progress?.current_title_id));
  const totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, explicitLevel?.need || 0);
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
  const attemptId = uid("endocrine_system_guest_attempt");
  state = {
    ...createEmptyState(),
    student,
    attempt_id: attemptId,
    attempt_session_token: `guest_${attemptId}`,
    attempt_session_id: `guest_session_${attemptId}`,
    question_version: QUESTION_VERSION,
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
      question_version: QUESTION_VERSION
    });
    if (startData.verification_mode !== "server_verified" || !startData.attempt_session_token || startData.question_version !== QUESTION_VERSION) {
      throw new Error("backend_registry_not_ready");
    }
    state = {
      ...createEmptyState(),
      student,
      attempt_id: startData.attempt_id,
      attempt_session_token: startData.attempt_session_token,
      attempt_session_id: startData.attempt_session_id,
      previous_attempt_id: startData.previous_attempt_id || "",
      question_version: QUESTION_VERSION,
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

function resetViewportScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const apply = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (error) {
      try { window.scrollTo(0, 0); } catch (innerError) {}
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainStage = document.querySelector(".main-stage");
    if (mainStage) mainStage.scrollTop = 0;
  };
  apply();
  if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(apply);
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
  earned.push("endocrine_system_entry");
  if (passed(["endocrine_system_q01"])) earned.push("endocrine_gland_mapper");
  if (passed(["endocrine_system_q02", "endocrine_system_q03", "endocrine_system_q04"])) earned.push("hormone_blood_target_tracker");
  if (passed(["endocrine_system_q06"])) earned.push("pituitary_role_reader");
  if (passed(["endocrine_system_q07"])) earned.push("thyroid_metabolism_connector");
  if (passed(["endocrine_system_q05", "endocrine_system_q09", "endocrine_system_q10", "endocrine_system_q11"])) earned.push("pancreas_blood_glucose_regulator");
  if (passed(["endocrine_system_q09", "endocrine_system_q10", "endocrine_system_q13"])) earned.push("insulin_glucagon_balancer");
  if (passed(["endocrine_system_q05"])) earned.push("adrenal_response_connector");
  if (passed(["endocrine_system_q08"])) earned.push("gonad_puberty_role_reader");
  if (passed(["endocrine_system_q12"])) earned.push("hormone_balance_reasoner");
  if (passed(["endocrine_system_q02", "endocrine_system_q04", "endocrine_system_q14"])) earned.push("endocrine_nervous_compare");
  if (correctedCore) earned.push("endocrine_system_misconception_reviser");
  if (flawless) earned.push("endocrine_system_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("endocrine_system_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_endocrine_system");
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
    question_version: QUESTION_VERSION,
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
  if (sections.checkpoint1.includes(questionId)) return "hormone_basics";
  if (sections.checkpoint2.includes(questionId)) return "glands_roles";
  if (["endocrine_system_q09", "endocrine_system_q10", "endocrine_system_q11", "endocrine_system_q12", "endocrine_system_q13"].includes(questionId)) return "blood_glucose_balance";
  return "nerve_endocrine_compare";
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
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="內分泌系統簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="內分泌調節站場景待接">
        <strong>內分泌調節站</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與調節站場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene endocrine-system-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>反應控制室收到多筆激素訊號紀錄。請追蹤內分泌腺、激素、血液運送與目標器官，並用資料判斷血糖調節方向。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入內分泌調節站前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先用「腺體、激素、血液、目標器官」拆解情境。</h3><p>激素通常由內分泌腺分泌，經血液運送，到能對它反應的目標器官或細胞產生調節作用。</p></div></div><div class="concept-grid"><article><strong>內分泌腺與激素</strong><p>內分泌腺分泌激素，激素協助調節身體活動。</p></article><article><strong>血液與目標器官</strong><p>激素可隨血液到身體各處，但主要作用於能回應的目標器官或細胞。</p></article><article><strong>主要腺體功能</strong><p>腦垂腺、甲狀腺、胰島、腎上腺與性腺各有不同調節方向。</p></article><article><strong>血糖與調節平衡</strong><p>胰島素幫助血糖降低，升糖素幫助血糖升高；激素需要適量。</p></article></div><button class="primary" data-next="checkpoint1">開始追蹤激素訊號</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["激素訊息基本流程","先確認內分泌腺、激素、血液運送與目標器官。"], checkpoint2:["主要腺體與功能方向","配對腦垂腺、甲狀腺、胰島、腎上腺與性腺的功能線索。"], checkpoint3:["血糖調節與比較判斷","判斷胰島素、升糖素、激素適量與神經/內分泌調節差異。"] }[section];
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

function conceptLabel(concept) { return {endocrine_gland_role:"內分泌腺",hormone_transport_blood:"血液運送",target_organ_specificity:"目標器官",major_glands_roles:"主要腺體",insulin_role:"胰島素",glucagon_role:"升糖素",pancreas_blood_glucose:"血糖資料",hormone_balance:"激素適量",nerve_endocrine_compare:"神經/激素比較"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["endocrine_system_q01", "endocrine_system_q02", "endocrine_system_q03"].includes(qid)) return `<div class="evidence-card"><strong>激素訊息卡</strong><p>先找分泌激素的腺體、運送方式，以及哪些目標器官或細胞會產生回應。</p></div>`;
  if (qid === "endocrine_system_q04") return `<div class="evidence-card"><strong>流程排序卡</strong><p>排序題請拖曳卡片；手機可用上移 / 下移。提示只協助判斷分泌、運送與作用對象，不直接列答案。</p></div>`;
  if (["endocrine_system_q05", "endocrine_system_q06", "endocrine_system_q07", "endocrine_system_q08"].includes(qid)) return `<div class="evidence-card"><strong>腺體功能卡</strong><p>功能線索可先分成生長與調節、代謝、血糖、緊急狀態，以及生殖與青春期發育。</p></div>`;
  if (["endocrine_system_q09", "endocrine_system_q10", "endocrine_system_q13"].includes(qid)) return `<div class="evidence-card"><strong>血糖方向卡</strong><p>胰島素與升糖素都和血糖調節有關，但調整方向不同。</p></div>`;
  if (qid === "endocrine_system_q11") return `<div class="evidence-card"><strong>資料判讀卡</strong><p>比較飯後血糖與胰島素量的變化，再判斷資料支持哪個調節方向。</p></div>`;
  if (qid === "endocrine_system_q12") return `<div class="evidence-card"><strong>適量調節卡</strong><p>調節重點不是越多越好，而是讓身體功能維持在適當範圍。</p></div>`;
  if (qid === "endocrine_system_q14") return `<div class="evidence-card"><strong>協調方式比較卡</strong><p>神經訊息通常較快且路徑明確；激素多經血液運送，作用可能較慢、較廣或較持久。</p></div>`;
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
        <h2>先整理你目前的激素訊號線索</h2>
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
  gland_hormone_confusion:"建議再確認：內分泌腺會分泌激素，激素可協助調節身體活動。",
  hormone_nerve_confusion:"建議再比較傳訊方式：激素通常經血液運送，神經訊息沿神經路徑傳遞。",
  target_organ_confusion:"建議再理解目標器官：激素不會讓所有細胞都產生一樣反應。",
  endocrine_pathway_order_confusion:"建議再整理激素流程：腺體分泌激素，激素進入血液，再到目標器官產生作用。",
  gland_function_confusion:"建議再閱讀主要腺體功能：腦垂腺、甲狀腺、胰島、腎上腺、性腺各有不同功能方向。",
  insulin_glucagon_confusion:"建議再比較血糖調節：胰島素幫助血糖降低，升糖素幫助血糖升高。",
  blood_glucose_data_misread:"建議再練習資料判讀：比較飯後血糖、胰島素與時間變化，不用單一數字下結論。",
  hormone_more_is_better:"建議再確認激素量：身體需要適量激素，過多或過少都可能影響功能。",
  nerve_endocrine_same:"建議再比較兩種協調方式：神經通常較快、路徑明確；激素經血液運送，作用可能較慢、較廣或較持久。"
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
        <p class="muted">可以從內分泌腺與激素、血液運送、目標器官、主要腺體功能、胰島素/升糖素，或神經調節和激素調節比較中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：激素通常經血液運送到目標器官">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認胰島素和升糖素為什麼作用方向不同，卻都和血糖調節有關？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>激素訊號追蹤任務結算</h2>
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
  return `
    <div class="stack achievements-stack">
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function renderBadgeWall(earned = []) {
  const earnedSet = new Set(earned);
  return `<section class="panel" data-bq-unit-achievements="${mission.unit_id}">
    <p class="eyebrow">徽章收藏牆</p>
    <h2>本單元 ${badges.length} 枚徽章</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與內分泌腺、激素、血液運送、目標器官、腺體功能或血糖調節相關的問題才會取得回報 EXP。</li>
          <li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li>
        </ul>
        <button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>
      </section>
    </div>
  `;
}

function renderApp() {
  if (!screen) return;
  const screenChanged = renderApp.lastScreen !== state.screen;
  renderApp.lastScreen = state.screen;
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
  if (screenChanged) resetViewportScroll();
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
  window.__endocrine_systemTest = {
    VERSION,
    QUESTION_VERSION,
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
