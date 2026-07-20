const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260720-stimulus-response-readiness-v1";
const QUESTION_VERSION = "20260718-stimulus-response-ready-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_stimulus_response_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "stimulus_response",
  unit_title: "刺激與反應",
  mission_title: "反應訊號追蹤任務",
  mission_area: "反應控制室"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  // Visual team handoff names stay documented below; only set real WebP paths after approval.
  briefingSceneHook: "assets/stimulus-response-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: "assets/stimulus-response-entry-wide.webp",
  questionRoleCards: "stimulus-response-role-cards",
  questionPathwayFlow: "stimulus-response-pathway-flow",
  questionReactionTime: "stimulus-response-reaction-time",
  questionDataCards: "stimulus-response-data-cards"
};

const badgeAsset = () => "";
const reflectionRules = {
  conceptTerms: ["刺激", "反應", "受器", "動器", "感受", "接收刺激", "肌肉", "腺體", "訊息傳遞", "協調", "流程", "有意識", "反應時間", "注意力", "疲勞", "練習", "多次測量", "公平測量", "控制變因"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["刺激與反應", "受器與動器", "基本流程", "反應時間", "影響反應時間的因素", "公平測量"]
};

const badges = [
  ["stimulus_response_entry", "訊號追蹤入門徽章", "完成反應訊號追蹤任務。"],
  ["stimulus_response_identifier", "刺激反應辨識徽章", "能區分刺激與反應。"],
  ["stimulus_response_misconception_spotter", "先後關係校正徽章", "能修正刺激與反應先後混淆。"],
  ["receptor_effector_matcher", "受器動器配對徽章", "能分辨受器接收刺激、動器產生反應。"],
  ["response_pathway_sequencer", "反應流程排序徽章", "能排出刺激到反應的基本流程。"],
  ["role_context_classifier", "情境角色分類徽章", "能在生活情境中分類刺激、受器、動器與反應。"],
  ["rapid_response_reasoner", "快速反應推理徽章", "能理解反應不一定都先經有意識思考。"],
  ["reaction_time_reader", "反應時間判讀徽章", "能用時間長短判斷反應快慢。"],
  ["reaction_data_cautious_reader", "謹慎資料解讀徽章", "能避免用少數資料過度推論。"],
  ["fair_test_designer", "公平測量設計徽章", "能判斷反應時間測量的公平設計。"],
  ["stimulus_response_misconception_reviser", "刺激反應迷思修正徽章", "提示後修正本單元迷思。"],
  ["stimulus_response_flawless", "訊號追蹤零提示全對徽章", "全部答對且全程未使用提示。"],
  ["stimulus_response_reflection_reporter", "高品質反應回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_stimulus_response", "再探反應進步徽章", "再挑戰完整完成且正確率進步。"],
  ["response_evidence_integrator", "反應證據整合徽章", "能整合反應時間與公平測量證據。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const sequenceSteps = [
  { id: "stimulus_appears", label: "刺激出現" },
  { id: "receptor_receives", label: "受器接收刺激" },
  { id: "signal_coordination", label: "訊息傳遞與協調" },
  { id: "effector_acts", label: "動器作用" },
  { id: "response_happens", label: "產生反應" }
];
const correctSequence = sequenceSteps.map((step) => step.id);
const roleChoices = [
  { id: "stimulus", text: "刺激" },
  { id: "response", text: "反應" },
  { id: "receptor", text: "受器" },
  { id: "effector", text: "動器" }
];

const questions = [
  {id:"stimulus_response_q01",section:"checkpoint1",concept:"stimulus_definition",type:"choice",answer:"bell_sound",prompt:"下列哪一項最像「刺激」？",hint:"先找出生物感受到的外在或體內變化，而不是後續動作。",misconception:"stimulus_response_confusion",options:[{id:"bell_sound",text:"突然響起的鈴聲"},{id:"turn_head",text:"聽到鈴聲後轉頭"},{id:"muscle_contract",text:"手臂肌肉收縮"},{id:"write_note",text:"寫下觀察紀錄"}]},
  {id:"stimulus_response_q02",section:"checkpoint1",concept:"response_definition",type:"choice",answer:"pull_hand",prompt:"下列哪一項最像「反應」？",hint:"看看哪一項是生物接收刺激後做出的動作或生理變化。",misconception:"stimulus_response_confusion",options:[{id:"pull_hand",text:"手碰到熱杯後縮回"},{id:"hot_surface",text:"熱杯表面溫度升高"},{id:"bright_light",text:"強光照進眼睛"},{id:"smell_air",text:"空氣中出現氣味"}]},
  {id:"stimulus_response_q03",section:"checkpoint1",concept:"stimulus_definition",type:"mapping",answer:{hot_cup:"stimulus",pull_hand:"response",bright_light:"stimulus",blink:"response"},prompt:"請將情境中的刺激與反應配對。",hint:"先找「被感受到的變化」，再找「生物做出的動作」。",misconception:"stimulus_response_confusion",items:[{id:"hot_cup",label:"熱杯"},{id:"pull_hand",label:"縮手"},{id:"bright_light",label:"強光"},{id:"blink",label:"眨眼"}],choices:roleChoices.filter((choice)=>["stimulus","response"].includes(choice.id))},
  {id:"stimulus_response_q04",section:"checkpoint1",concept:"response_definition",type:"choice",answer:"movement_is_response",prompt:"有同學說：「只要身體有動作，那個動作就是刺激。」哪個修正較合理？",hint:"想想一個事件中，哪個先出現、哪個是生物做出的結果。",misconception:"stimulus_response_confusion",options:[{id:"movement_is_response",text:"身體動作通常是對刺激產生的反應，刺激是先被感受到的變化"},{id:"no_movement_response",text:"所有動作都不是反應"},{id:"plants_only",text:"刺激只會出現在植物身上"},{id:"write_speak_only",text:"反應一定是寫字或說話"}]},
  {id:"stimulus_response_q05",section:"checkpoint2",concept:"receptor_role",type:"choice",answer:"eye_receptor",prompt:"看到紅燈後停下腳步，情境中最主要接收「紅燈」這個刺激的是哪一類構造？",hint:"找出負責接收光線變化的構造，不是做出動作的構造。",misconception:"receptor_effector_confusion",options:[{id:"eye_receptor",text:"眼睛中的感受構造"},{id:"leg_muscle",text:"腿部肌肉"},{id:"sweat_gland",text:"汗腺"},{id:"stomach",text:"胃"}]},
  {id:"stimulus_response_q06",section:"checkpoint2",concept:"effector_role",type:"choice",answer:"leg_muscle",prompt:"聽到哨聲後立刻跑出起點，哪一項最接近產生跑步反應的動器？",hint:"想想哪個構造實際產生動作。",misconception:"receptor_effector_confusion",options:[{id:"leg_muscle",text:"腿部肌肉"},{id:"ear_receptor",text:"耳朵中的感受構造"},{id:"whistle_sound",text:"哨聲本身"},{id:"light",text:"光線"}]},
  {id:"stimulus_response_q07",section:"checkpoint2",concept:"stimulus_response_pathway",type:"sequence",answer:correctSequence,prompt:"請拖曳排序，排出刺激到反應的基礎流程。",hint:"先找事件的起點，再找接收者、協調過程和實際做出反應的構造。",misconception:"pathway_order_confusion",steps:sequenceSteps},
  {id:"stimulus_response_q08",section:"checkpoint2",concept:"receptor_role",type:"mapping",answer:{food_smell:"stimulus",nose_receptor:"receptor",neck_muscle:"effector",turn_head:"response"},prompt:"請判斷下列項目在「聞到食物香味後轉頭」情境中較接近哪個角色。",hint:"一張卡問的是「變化、接收、執行、結果」中的哪一種。",misconception:"role_classification_confusion",items:[{id:"food_smell",label:"食物香味"},{id:"nose_receptor",label:"鼻中的感受構造"},{id:"neck_muscle",label:"頸部肌肉"},{id:"turn_head",label:"轉頭"}],choices:roleChoices},
  {id:"stimulus_response_q09",section:"checkpoint3",concept:"conscious_unconscious_response",type:"choice",answer:"not_always_conscious",prompt:"有同學說：「所有反應都要先想清楚才會發生。」哪個修正較合理？",hint:"想想突然遇到強光眨眼或碰到熱物縮手時，是否一定先完整思考。",misconception:"all_responses_conscious",options:[{id:"not_always_conscious",text:"有些反應可能很快發生，不一定都先經過有意識思考"},{id:"body_unrelated",text:"所有反應都和身體無關"},{id:"plants_only",text:"反應只會出現在植物"},{id:"fast_not_response",text:"只要很快就不是反應"}]},
  {id:"stimulus_response_q10",section:"checkpoint3",concept:"reaction_time_measurement",type:"choice",answer:"reaction_time",prompt:"接尺活動中，尺落下到學生抓住尺之間的時間，最接近哪個概念？",hint:"找出題目在測量的是刺激出現到做出動作之間的間隔。",misconception:"reaction_time_definition_confusion",options:[{id:"reaction_time",text:"反應時間"},{id:"systemic_circulation",text:"體循環"},{id:"photosynthesis_rate",text:"光合作用速率"},{id:"digestion_time",text:"消化時間"}]},
  {id:"stimulus_response_q11",section:"checkpoint3",concept:"reaction_time_measurement",type:"choice",answer:"second_shorter",prompt:"兩次按鍵測試資料如下：第一次 0.42 秒，第二次 0.31 秒。若只比較這兩次，哪次反應較快？",hint:"反應時間是花掉的時間，先想短時間和快慢的關係。",misconception:"reaction_time_data_misread",options:[{id:"second_shorter",text:"第二次，因為所花時間較短"},{id:"first_larger",text:"第一次，因為數字較大"},{id:"same",text:"兩次一定完全相同"},{id:"seconds_unrelated",text:"無法判斷，因為秒數和反應無關"}]},
  {id:"stimulus_response_q12",section:"checkpoint3",concept:"factors_affect_reaction",type:"choice",answer:"practice_possible",prompt:"某生連續做五次反應測試，前兩次較慢，後三次變快。哪個解釋較謹慎？",hint:"注意資料只有少數幾次，且連續測量可能受到熟悉程度影響。",misconception:"overgeneralize_reaction_data",options:[{id:"practice_possible",text:"練習或熟悉規則可能影響反應時間，還需要控制條件再判斷"},{id:"always_fastest",text:"這證明他永遠比所有人快"},{id:"receptor_disappeared",text:"這代表受器消失了"},{id:"stimulus_unrelated",text:"這表示刺激不會影響反應"}]},
  {id:"stimulus_response_q13",section:"checkpoint3",concept:"factors_affect_reaction",type:"choice",answer:"controlled_repeated",prompt:"若要比較「疲勞是否影響反應時間」，下列哪個設計較合理？",hint:"想想要比較疲勞影響時，其他測量方式應盡量一致，且需要多次資料。",misconception:"unfair_reaction_test",options:[{id:"controlled_repeated",text:"同一類反應測試，記錄休息充足與疲勞後的多次結果，再比較平均"},{id:"different_stimulus_once",text:"一次用聲音刺激、一次用光刺激，且只測一次"},{id:"different_body_part",text:"一人用手按鍵，另一人用腳踢球"},{id:"best_only",text:"只選最好的一次當全部結果"}]},
  {id:"stimulus_response_q14",section:"checkpoint3",concept:"factors_affect_reaction",type:"choice",answer:"single_trial_caution",prompt:"有同學說：「只測一次反應時間，就可以判定一個人永遠反應比較快。」哪個修正較合理？",hint:"想想同一個人不同狀態下，結果是否可能有差異。",misconception:"single_trial_overclaim",options:[{id:"single_trial_caution",text:"單次結果可能受注意力、疲勞或測量誤差影響，應多次測量並謹慎解釋"},{id:"cannot_measure",text:"反應時間完全不能測量"},{id:"factors_never_matter",text:"注意力和疲勞一定不會影響結果"},{id:"pretty_number",text:"只要數字漂亮就不用記錄方法"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["stimulus_response_q01", "stimulus_response_q02", "stimulus_response_q03", "stimulus_response_q04"],
  checkpoint2: ["stimulus_response_q05", "stimulus_response_q06", "stimulus_response_q07", "stimulus_response_q08"],
  checkpoint3: ["stimulus_response_q09", "stimulus_response_q10", "stimulus_response_q11", "stimulus_response_q12", "stimulus_response_q13", "stimulus_response_q14"]
};
const requiredQuestionIds = questions.map((question) => question.id);

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
    if (!parsed || !parsed.question_version) return createEmptyState();
    return { ...createEmptyState(), ...parsed, question_version: QUESTION_VERSION };
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
  const attemptId = uid("stimulus_response_guest_attempt");
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
        question_version: QUESTION_VERSION
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
  earned.push("stimulus_response_entry");
  if (passed(["stimulus_response_q01", "stimulus_response_q02", "stimulus_response_q03", "stimulus_response_q04"])) earned.push("stimulus_response_identifier");
  if (passed(["stimulus_response_q03", "stimulus_response_q04"])) earned.push("stimulus_response_misconception_spotter");
  if (passed(["stimulus_response_q05", "stimulus_response_q06", "stimulus_response_q08"])) earned.push("receptor_effector_matcher");
  if (passed(["stimulus_response_q07"])) earned.push("response_pathway_sequencer");
  if (passed(["stimulus_response_q08"])) earned.push("role_context_classifier");
  if (passed(["stimulus_response_q09"])) earned.push("rapid_response_reasoner");
  if (passed(["stimulus_response_q10", "stimulus_response_q11"])) earned.push("reaction_time_reader");
  if (passed(["stimulus_response_q12", "stimulus_response_q14"])) earned.push("reaction_data_cautious_reader");
  if (passed(["stimulus_response_q13"])) earned.push("fair_test_designer");
  if (passed(["stimulus_response_q10", "stimulus_response_q11", "stimulus_response_q12", "stimulus_response_q13", "stimulus_response_q14"])) earned.push("response_evidence_integrator");
  if (correctedCore) earned.push("stimulus_response_misconception_reviser");
  if (flawless) earned.push("stimulus_response_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("stimulus_response_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_stimulus_response");
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
  if (sections.checkpoint1.includes(questionId)) return "stimulus_response_identification";
  if (sections.checkpoint2.includes(questionId)) return "receptor_effector_pathway";
  if (["stimulus_response_q09", "stimulus_response_q10", "stimulus_response_q11", "stimulus_response_q12"].includes(questionId)) return "reaction_time_reasoning";
  return "fair_measurement_review";
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

function updateBadgeOverviewBridge() {
  if (typeof window === "undefined") return;
  if (!state.student) {
    delete window.__BIOQUEST_BADGE_OVERVIEW_STATE__;
    return;
  }
  const progress = state.student.progress || state.student.student_progress || {};
  window.__BIOQUEST_BADGE_OVERVIEW_STATE__ = {
    student: {
      ...state.student,
      progress,
      student_progress: progress,
      is_guest: Boolean(state.student.is_guest),
      title_avatar_path: state.student.title_avatar_path || progress.title_avatar_path || "",
      current_title_id: state.student.current_title_id || progress.current_title_id || "",
      current_title: state.student.current_title || progress.current_title || ""
    },
    progress,
    student_progress: progress
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
  const sceneMedia = `<picture class="bq-brief-scene-media">${assets.briefingSceneMobileHook ? `<source media="(max-width: 680px)" srcset="${assets.briefingSceneMobileHook}">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在刺激與反應任務場景中引導學生"></picture>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene stimulus-response-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>反應控制室收到多筆事件紀錄。請判斷哪些是刺激、哪些是反應，並追蹤受器、訊息協調與動器如何串成基礎流程。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入反應控制室前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先用「變化、接收、協調、執行、結果」拆解情境。</h3><p>刺激是可被感受的變化；受器接收刺激；訊息經過協調後，由肌肉或腺體等動器產生反應。</p></div></div><div class="concept-grid"><article><strong>刺激</strong><p>生物能感受到的環境或體內變化，例如光、聲音、熱或氣味。</p></article><article><strong>受器</strong><p>負責接收刺激的構造或細胞，例如眼、耳、皮膚中的感受構造。</p></article><article><strong>動器</strong><p>產生反應的構造，常見例子包含肌肉與腺體。</p></article><article><strong>反應時間</strong><p>刺激出現到做出反應所花的時間，會受注意力、疲勞、練習與測量方法影響。</p></article></div><button class="primary" data-next="checkpoint1">開始追蹤反應訊號</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["刺激與反應辨識","先區分被感受到的變化，以及生物做出的動作或生理變化。"], checkpoint2:["受器、動器與基本流程","整理接收刺激、訊息協調、產生反應的角色和順序。"], checkpoint3:["反應時間與公平測量","用資料判斷反應快慢，並避免從少數測量做過度推論。"] }[section];
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

function conceptLabel(concept) { return {stimulus_definition:"刺激辨識",response_definition:"反應辨識",receptor_role:"受器角色",effector_role:"動器角色",stimulus_response_pathway:"刺激反應流程",conscious_unconscious_response:"快速反應",reaction_time_measurement:"反應時間",factors_affect_reaction:"公平測量"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["stimulus_response_q01", "stimulus_response_q02", "stimulus_response_q03", "stimulus_response_q04"].includes(qid)) return `<div class="evidence-card"><strong>情境拆解卡</strong><p>先找「被感受到的變化」，再找「生物做出的動作或生理變化」。</p></div>`;
  if (qid === "stimulus_response_q07") return `<div class="evidence-card"><strong>流程排序卡</strong><p>排序題請拖曳卡片；手機可用上移 / 下移。提示只協助判斷流程角色，不直接列答案。</p></div>`;
  if (["stimulus_response_q05", "stimulus_response_q06", "stimulus_response_q08"].includes(qid)) return `<div class="evidence-card"><strong>情境角色閱讀</strong><p>先判斷這張卡是在問：環境或體內變化、接收變化的構造、執行動作的構造，還是最後出現的反應；不要只看器官名稱猜答案。</p></div>`;
  if (qid === "stimulus_response_q09") return `<div class="evidence-card"><strong>情境先後提醒</strong><p>比較強光、熱物或突然聲音情境中，身體反應和完整思考之間的先後是否都相同。</p></div>`;
  if (qid === "stimulus_response_q10") return `<div class="evidence-card"><strong>測量紀錄</strong><p>這張卡記錄某個事件出現到學生完成動作之間的時間間隔；請判斷題目要你辨識的是哪一種測量概念。</p></div>`;
  if (qid === "stimulus_response_q11") return `<div class="evidence-card evidence-table"><strong>測量紀錄</strong><table><thead><tr><th>測量</th><th>時間</th></tr></thead><tbody><tr><td>第一次</td><td>0.42 秒</td></tr><tr><td>第二次</td><td>0.31 秒</td></tr></tbody></table></div>`;
  if (qid === "stimulus_response_q12") return "";
  if (["stimulus_response_q13", "stimulus_response_q14"].includes(qid)) return `<div class="evidence-card"><strong>測量設計閱讀</strong><p>比較某個因素時，先看測量方式是否一致、資料是否只有一次，以及是否只改變一個主要條件。</p></div>`;
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
        <h2>先整理你目前的反應訊號線索</h2>
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
  stimulus_response_confusion:"建議用先後關係區分：刺激是被感受到的變化，反應是生物做出的結果。",
  receptor_effector_confusion:"建議再比較受器與動器：受器接收刺激，動器產生反應。",
  pathway_order_confusion:"建議再整理流程：刺激出現後，先被受器接收，再經協調由動器產生反應。",
  role_classification_confusion:"建議用「變化、接收、執行、結果」四個角色重新拆解情境。",
  all_responses_conscious:"建議再確認：有些反應可能很快發生，不一定都先經過有意識思考。",
  reaction_time_definition_confusion:"建議再理解反應時間：它是刺激出現到做出反應之間的時間間隔。",
  reaction_time_data_misread:"建議再練習資料判讀：同一測量方式下，反應時間較短通常代表反應較快。",
  overgeneralize_reaction_data:"建議再確認資料解釋：少數結果不能直接推論長期能力。",
  unfair_reaction_test:"建議再留意公平測量：比較某個因素時，其他條件要盡量一致。",
  single_trial_overclaim:"建議再理解多次測量：一次反應時間可能受注意力、疲勞或測量誤差影響。"
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
        <p class="muted">可以從刺激與反應、受器與動器、基本流程、反應不一定都先思考、反應時間或公平測量中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：受器負責接收刺激">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認為什麼同一人連續測五次變快時，不能直接說他永遠反應比較快？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>反應訊號追蹤任務結算</h2>
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
      note: "正式認列 / 累積增量 0；正式累積、完成單元與全冊徽章需使用學生帳號登入並經後台確認。"
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
    note: "正式認列 / 累積增量 0；本次資料已保留為待確認狀態，完成後台同步後才會更新正式累積。"
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
          <li>回報空白可提交但 0 EXP；具體且與刺激/反應、受器/動器、流程或反應時間概念相關的問題才會取得回報 EXP。</li>
          <li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li>
        </ul>
        <button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>
      </section>
    </div>
  `;
}

function renderApp() {
  if (!screen) return;
  updateBadgeOverviewBridge();
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
  window.__stimulus_responseTest = {
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
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
