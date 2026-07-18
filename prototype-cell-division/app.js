const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-cell-division-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_cell_division_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "cell_division",
  unit_title: "細胞的分裂",
  mission_title: "染色體分配校準任務",
  mission_area: "微觀研究站"
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
  conceptTerms: ["細胞分裂", "新細胞", "原有細胞", "生長", "修補", "染色體", "DNA", "遺傳資訊", "複製", "分配", "均分", "母細胞", "子細胞", "根尖", "傷口", "一般細胞分裂", "單元邊界"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["染色體為什麼要先複製再分配", "一個母細胞如何形成兩個子細胞", "生長、修補和細胞分裂的關係", "子細胞遺傳資訊大致相同", "細胞分裂和無性生殖、有性生殖的邊界"]
};

const badges = [
  ["cell_division_entry", "染色體分配入門", "完成染色體分配校準任務。"],
  ["cells_from_cells_observer", "新細胞來源觀察", "能修正新細胞由養分直接形成的迷思。"],
  ["growth_repair_division_linker", "生長修補連結", "能連結細胞分裂與新細胞增加。"],
  ["chromosome_dna_info_reader", "染色體資訊判讀", "能連結染色體、DNA 與遺傳資訊。"],
  ["chromosome_copy_before_division_reader", "先複製再分裂", "能判斷染色體先複製再分配。"],
  ["cell_division_sequence_tracker", "分裂流程排序", "能排出一般細胞分裂簡化流程。"],
  ["chromosome_distribution_checker", "染色體均分檢查", "能判斷兩個子細胞都取得染色體。"],
  ["mother_daughter_cell_mapper", "母子細胞對應", "能辨識一個母細胞形成兩個子細胞。"],
  ["genetic_info_similarity_reader", "子細胞資訊相似", "能區分遺傳資訊相似與功能完全相同。"],
  ["root_tip_evidence_interpreter", "根尖證據判讀", "能用觀察證據連回細胞分裂。"],
  ["division_reproduction_boundary_classifier", "分裂邊界分類", "能把 U28/U29 內容排除於 U27 核心外。"],
  ["cell_division_unit_boundary_guardian", "細胞分裂邊界守門", "能辨識細胞分裂與相鄰單元邊界。"],
  ["cell_division_misconception_reviser", "細胞分裂迷思修正", "提示後修正本單元迷思。"],
  ["cell_division_flawless", "分裂校準零提示全對", "全部答對且全程未使用提示。"],
  ["cell_division_reflection_reporter", "高品質細胞分裂回報", "回報品質達 discussion_question。"],
  ["cell_division_mastery", "細胞分裂精熟校準", "完成且正確率達 90% 以上。"],
  ["retry_growth_cell_division", "再探分裂校準進步", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const boundaryChoices = [
  { id: "cell_division_core", text: "本單元核心：細胞分裂本身" },
  { id: "later_u28", text: "留到 U28：無性生殖方式" },
  { id: "later_u29", text: "留到 U29：有性生殖與受精" }
];

const questions = [
  {id:"cell_division_q01",section:"checkpoint1",concept:"cells_from_cells",type:"choice",answer:"cells_arise_from_existing_cells",prompt:"有同學說：「身體需要新細胞時，細胞會從養分直接變出來。」哪個修正較合理？",hint:"先想「新細胞」前面需要哪一個原有結構。",misconception:"cell_origin_from_nutrients_confusion",options:[{id:"cells_arise_from_existing_cells",text:"新細胞通常由原有細胞分裂產生"},{id:"nutrients_create_cells",text:"新細胞只要有葡萄糖就會自己出現"},{id:"urine_cells_return",text:"新細胞是由尿液排出後再長回去"},{id:"fertilization_only",text:"新細胞一定由精子和卵結合才會形成"}]},
  {id:"cell_division_q02",section:"checkpoint1",concept:"division_growth_repair",type:"choice",answer:"division_supports_repair",prompt:"皮膚擦傷後，傷口附近需要補上新的皮膚細胞。哪個說法較合理？",hint:"看情境是在補充細胞數量，還是在改變體溫或生殖方式。",misconception:"growth_by_cell_size_only",options:[{id:"division_supports_repair",text:"原有皮膚細胞分裂，增加細胞數量以協助修補"},{id:"cells_only_expand",text:"每個皮膚細胞只要一直變大就能補滿傷口"},{id:"glucose_homeostasis_grows_skin",text:"傷口修補主要靠血糖恆定直接長出皮膚"},{id:"budding_required",text:"一定要先完成出芽生殖才會修補"}]},
  {id:"cell_division_q03",section:"checkpoint1",concept:"chromosome_dna_basic",type:"choice",answer:"chromosomes_carry_dna_information",prompt:"關於染色體和 DNA，下列哪個說法最適合七年級本單元？",hint:"想想染色體和「遺傳資訊」之間的關係。",misconception:"chromosome_dna_layer_confusion",options:[{id:"chromosomes_carry_dna_information",text:"染色體含有 DNA，帶有遺傳資訊"},{id:"chromosomes_excrete_urine",text:"染色體只負責排出尿液"},{id:"dna_is_sweat",text:"DNA 是皮膚表面的汗水"},{id:"chromosomes_only_when_hot",text:"染色體只在體溫升高時才出現"}]},
  {id:"cell_division_q04",section:"checkpoint2",concept:"chromosome_copy_before_division",type:"choice",answer:"chromosomes_copy_before_division",prompt:"一個細胞準備分裂成兩個子細胞。為什麼分裂前染色體需要先複製？",hint:"先想分裂後會有幾個子細胞，每個子細胞需要什麼。",misconception:"chromosome_not_copied_before_division",options:[{id:"chromosomes_copy_before_division",text:"讓兩個子細胞都有遺傳資訊"},{id:"mother_discards_chromosomes",text:"讓母細胞把染色體全部丟掉"},{id:"make_gametes",text:"讓細胞變成精子或卵"},{id:"control_temperature",text:"讓體溫回到適當範圍"}]},
  {id:"cell_division_q05",section:"checkpoint2",concept:"chromosome_copy_before_division",type:"sequence",answer:["cell_prepares_to_divide","chromosomes_are_copied","copied_chromosomes_distribute_to_both_sides","cytoplasm_separates_into_two_daughter_cells"],prompt:"請拖曳排序，排出一般細胞分裂的簡化流程。",hint:"先找「複製」和「分配」的先後關係。",misconception:"division_sequence_order_confusion",steps:[{id:"cell_prepares_to_divide",label:"細胞準備分裂"},{id:"chromosomes_are_copied",label:"染色體複製"},{id:"copied_chromosomes_distribute_to_both_sides",label:"複製後的染色體分配到兩邊"},{id:"cytoplasm_separates_into_two_daughter_cells",label:"細胞質分開形成兩個子細胞"}]},
  {id:"cell_division_q06",section:"checkpoint2",concept:"chromosome_equal_distribution",type:"choice",answer:"chromosomes_distributed_to_both_cells",prompt:"觀察兩張簡化示意：哪一種比較符合一般細胞分裂後染色體分配的概念？",hint:"不用背階段名稱，先看兩個子細胞是否都取得染色體。",misconception:"chromosome_distribution_unequal",options:[{id:"chromosomes_distributed_to_both_cells",text:"兩個子細胞各有一組相同染色體"},{id:"one_gets_all",text:"一個子細胞拿到全部染色體，另一個沒有"},{id:"chromosomes_disappear",text:"染色體全部消失"},{id:"chromosomes_outside_cell",text:"染色體只跑到細胞外面"}]},
  {id:"cell_division_q07",section:"checkpoint2",concept:"chromosome_equal_distribution",type:"choice",answer:"chromosome_distribution_is_ordered",prompt:"有同學說：「細胞分裂就是把染色體隨便切一半，兩邊有多少都沒關係。」哪個修正較合理？",hint:"先想每個子細胞是否都需要維持細胞活動的資訊。",misconception:"chromosome_random_split_confusion",options:[{id:"chromosome_distribution_is_ordered",text:"染色體需要有規律地分配，讓兩個子細胞都有遺傳資訊"},{id:"fewer_chromosomes_better",text:"染色體越少越好，所以不用分配"},{id:"sweat_balances_chromosomes",text:"只要汗水夠多，染色體就會平均"},{id:"daughter_cells_no_info",text:"子細胞不需要任何遺傳資訊"}]},
  {id:"cell_division_q08",section:"checkpoint2",concept:"chromosome_copy_before_division",type:"choice",answer:"copied_chromosomes_then_distributed",prompt:"一張流程資料顯示：某細胞分裂前染色體數量暫時變成兩份，分裂完成後兩個子細胞各得到一份。哪個解讀較合理？",hint:"先看資料中的變化是不是「先有兩份，再分到兩個細胞」。",misconception:"copied_chromosome_data_misread",options:[{id:"copied_chromosomes_then_distributed",text:"染色體先複製，分裂後分配到兩個子細胞"},{id:"budding_reproduction",text:"染色體數量增加就代表生物正在出芽生殖"},{id:"high_glucose",text:"染色體暫時變多表示血糖偏高"},{id:"always_gametes",text:"染色體複製後一定形成精子和卵"}]},
  {id:"cell_division_q09",section:"checkpoint3",concept:"mother_daughter_cells",type:"choice",answer:"one_mother_cell_forms_two_daughter_cells",prompt:"一個母細胞完成一般細胞分裂後，最基本會形成什麼？",hint:"注意題目問的是一個細胞完成分裂後的直接結果。",misconception:"mother_daughter_cell_count_confusion",options:[{id:"one_mother_cell_forms_two_daughter_cells",text:"兩個子細胞"},{id:"one_kidney",text:"一個腎臟"},{id:"whole_organism_all_organs",text:"一個完整新個體的所有器官"},{id:"larger_mother_only",text:"只有一個較大的母細胞"}]},
  {id:"cell_division_q10",section:"checkpoint3",concept:"genetic_info_similarity",type:"choice",answer:"daughter_cells_similar_genetic_information",prompt:"關於一般細胞分裂後的子細胞，哪個說法較合理？",hint:"區分「遺傳資訊大致相同」和「未來功能一定完全一樣」。",misconception:"genetic_info_vs_function_confusion",options:[{id:"daughter_cells_similar_genetic_information",text:"子細胞通常與母細胞具有大致相同的遺傳資訊"},{id:"daughter_no_chromosomes",text:"子細胞一定完全沒有染色體"},{id:"daughter_are_gametes",text:"子細胞一定是精子或卵"},{id:"same_function_forever",text:"子細胞一定和母細胞功能永遠完全一樣"}]},
  {id:"cell_division_q11",section:"checkpoint3",concept:"division_growth_repair",type:"choice",answer:"growth_involves_more_cells",prompt:"有同學說：「生物長大只是每個細胞一直膨脹，細胞數量不需要增加。」哪個修正較合理？",hint:"想想從幼小個體到長大，細胞數量是否也可能改變。",misconception:"growth_by_cell_size_only",options:[{id:"growth_involves_more_cells",text:"生長常包含細胞分裂，使細胞數量增加"},{id:"urine_growth",text:"生長只靠尿液變多"},{id:"temperature_growth",text:"生長只靠體溫升高"},{id:"asexual_category",text:"生長一定是無性生殖分類題"}]},
  {id:"cell_division_q12",section:"checkpoint3",concept:"division_growth_repair",type:"choice",answer:"root_tip_growth_cell_division_evidence",prompt:"洋蔥根尖觀察資料顯示某區域有許多細胞正在形成新的細胞。這最能支持哪個概念？",hint:"先看資料提供的是「正在形成新細胞」還是「生殖細胞」。",misconception:"cell_division_evidence_misread",options:[{id:"root_tip_growth_cell_division_evidence",text:"生長區域常有細胞分裂，增加細胞數量"},{id:"root_tip_temperature",text:"根尖正在進行體溫調節"},{id:"root_tip_gametes",text:"根尖一定正在形成精子和卵"},{id:"root_tip_no_chromosomes",text:"根尖細胞都不含染色體"}]},
  {id:"cell_division_q13",section:"checkpoint3",concept:"division_not_reproduction_type",type:"mapping",answer:{chromosome_copy_distribution:"cell_division_core",wound_repair_new_cells:"cell_division_core",yeast_budding:"later_u28",sperm_egg_fertilization:"later_u29"},prompt:"請把下列內容分成「本單元核心」或「留到後續/其他單元」。",hint:"先問自己：這是在說細胞如何分裂，還是在分類產生新個體的方式？",misconception:"cell_division_reproduction_boundary_confusion",items:[{id:"chromosome_copy_distribution",label:"染色體複製後分配到兩個子細胞"},{id:"wound_repair_new_cells",label:"傷口修補需要新細胞"},{id:"yeast_budding",label:"酵母菌出芽生殖"},{id:"sperm_egg_fertilization",label:"精子和卵結合"}],choices:boundaryChoices},
  {id:"cell_division_q14",section:"checkpoint3",concept:"unit_boundary_control",type:"choice",answer:"chromosome_copy_distribution_belongs_cell_division",prompt:"下列哪個情境最適合放在「細胞的分裂」本單元核心檢核？",hint:"找出和染色體、母細胞、子細胞最直接相關的情境。",misconception:"cell_division_unit_boundary_confusion",options:[{id:"chromosome_copy_distribution_belongs_cell_division",text:"染色體複製後分配到兩個子細胞"},{id:"heat_loss_sweating",text:"流汗與皮膚血管擴張協助散熱"},{id:"potato_vegetative_reproduction",text:"馬鈴薯利用營養器官繁殖新個體"},{id:"fertilized_egg",text:"精子和卵結合形成受精卵"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["cell_division_q01", "cell_division_q02", "cell_division_q03"],
  checkpoint2: ["cell_division_q04", "cell_division_q05", "cell_division_q06", "cell_division_q07", "cell_division_q08"],
  checkpoint3: ["cell_division_q09", "cell_division_q10", "cell_division_q11", "cell_division_q12", "cell_division_q13", "cell_division_q14"]
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
  const attemptId = uid("cell_division_guest_attempt");
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
  const correctCount = logs.filter((log) => log.is_correct).length;
  const accuracy = logs.length ? correctCount / logs.length : 0;
  const correctedCore = logs.some((log) => log.is_correct && log.hint_used);
  const earned = [];
  earned.push("cell_division_entry");
  if (passed(["cell_division_q01"])) earned.push("cells_from_cells_observer");
  if (["cell_division_q02", "cell_division_q11", "cell_division_q12"].filter((id) => byId[id]?.is_correct).length >= 2) earned.push("growth_repair_division_linker");
  if (passed(["cell_division_q03"])) earned.push("chromosome_dna_info_reader");
  if (passed(["cell_division_q04", "cell_division_q08"])) earned.push("chromosome_copy_before_division_reader");
  if (passed(["cell_division_q05"])) earned.push("cell_division_sequence_tracker");
  if (passed(["cell_division_q06", "cell_division_q07"])) earned.push("chromosome_distribution_checker");
  if (passed(["cell_division_q09"])) earned.push("mother_daughter_cell_mapper");
  if (passed(["cell_division_q10"])) earned.push("genetic_info_similarity_reader");
  if (passed(["cell_division_q12"])) earned.push("root_tip_evidence_interpreter");
  if (passed(["cell_division_q13"])) earned.push("division_reproduction_boundary_classifier");
  if (passed(["cell_division_q14"])) earned.push("cell_division_unit_boundary_guardian");
  if (correctedCore) earned.push("cell_division_misconception_reviser");
  if (flawless) earned.push("cell_division_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("cell_division_reflection_reporter");
  if (accuracy >= 0.9) earned.push("cell_division_mastery");
  if (retryExp > 0) earned.push("retry_growth_cell_division");
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
  if (["cell_division_q01", "cell_division_q02", "cell_division_q03"].includes(questionId)) return "cell_origin_and_function";
  if (["cell_division_q04", "cell_division_q05", "cell_division_q06", "cell_division_q07", "cell_division_q08"].includes(questionId)) return "copy_and_distribution";
  if (["cell_division_q09", "cell_division_q10", "cell_division_q11", "cell_division_q12"].includes(questionId)) return "mother_daughter_and_evidence";
  if (["cell_division_q13", "cell_division_q14"].includes(questionId)) return "unit_boundary_control";
  return "cell_origin_and_function";
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
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="細胞的分裂簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="微觀研究站場景待接">
        <strong>微觀研究站</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與染色體分配校準場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene cell-division-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>微觀研究站偵測到組織需要新細胞。請協助判讀細胞如何準備染色體，並讓兩個子細胞都取得遺傳資訊。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入微觀研究站前，先抓住四個分裂線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚「新細胞來源、染色體複製、染色體分配、母細胞與子細胞」。</h3><p>本任務會用情境、排序、資料判讀與邊界分類，幫你判斷一般細胞分裂如何產生新細胞。</p></div></div><div class="concept-grid"><article><strong>新細胞來源</strong><p>新細胞通常由原有細胞分裂產生，不是由養分直接變成。</p></article><article><strong>生長與修補</strong><p>多細胞生物長大或修補傷口，常需要細胞分裂增加細胞數量。</p></article><article><strong>先複製再分配</strong><p>分裂前染色體需先複製，分裂時再分配到兩個子細胞。</p></article><article><strong>守住單元邊界</strong><p>本單元看細胞如何分裂；無性生殖方式與有性生殖留到後續單元。</p></article></div><button class="primary" data-next="checkpoint1">開始校準染色體分配</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["新細胞來源、分裂用途與染色體基礎","先判斷新細胞從哪裡來，並連結生長修補與染色體/DNA。"], checkpoint2:["染色體複製、均分與流程","判斷分裂前為什麼要複製染色體，並排出一般細胞分裂的簡化順序。"], checkpoint3:["母細胞、子細胞、證據與邊界","辨識母細胞與子細胞關係，用觀察資料連結分裂，並守住 U27/U28/U29 邊界。"] }[section];
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

function conceptLabel(concept) { return {cells_from_cells:"新細胞來源",division_growth_repair:"生長修補",chromosome_dna_basic:"染色體與 DNA",chromosome_copy_before_division:"先複製再分裂",chromosome_equal_distribution:"染色體均分",mother_daughter_cells:"母細胞與子細胞",genetic_info_similarity:"遺傳資訊相似",division_not_reproduction_type:"分裂邊界",unit_boundary_control:"單元邊界"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["cell_division_q01", "cell_division_q02", "cell_division_q03"].includes(qid)) return `<div class="evidence-card"><strong>細胞來源概念卡</strong><p>新細胞來自原有細胞；生長修補常需要細胞數量增加；染色體含有遺傳資訊。</p></div>`;
  if (["cell_division_q04", "cell_division_q08"].includes(qid)) return `<div class="evidence-card"><strong>染色體複製資料卡</strong><p>分裂前染色體可先形成兩份，之後分配到兩個子細胞。</p></div>`;
  if (qid === "cell_division_q05") return `<div class="evidence-card"><strong>流程排序卡</strong><p>請把四張流程卡排成概念順序；卡片不含高中期別名稱。</p></div>`;
  if (["cell_division_q06", "cell_division_q07"].includes(qid)) return `<div class="evidence-card"><strong>染色體分配示意</strong><p>比較兩個子細胞是否都取得染色體，而不是只看某一邊。</p></div>`;
  if (["cell_division_q09", "cell_division_q10"].includes(qid)) return `<div class="evidence-card"><strong>母細胞與子細胞卡</strong><p>一個母細胞分裂後形成兩個子細胞；遺傳資訊大致相同不等於功能永遠完全一樣。</p></div>`;
  if (["cell_division_q11", "cell_division_q12"].includes(qid)) return `<div class="evidence-card"><strong>生長修補證據卡</strong><p>生長區域或修補情境常可看到新細胞形成，支持細胞數量增加。</p></div>`;
  if (["cell_division_q13", "cell_division_q14"].includes(qid)) return `<div class="evidence-card"><strong>單元邊界卡</strong><p>本單元聚焦細胞分裂、染色體複製與分配；繁殖方式與受精留到後續單元。</p></div>`;
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
        <h2>先整理你目前的細胞分裂判讀線索</h2>
        <p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的細胞分裂概念。</p>
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
  cell_origin_from_nutrients_confusion:"建議再確認新細胞來源：養分可供細胞活動，但完整新細胞通常由原有細胞分裂產生。",
  growth_by_cell_size_only:"建議再整理生長與修補：生物體長大或修補傷口常需要細胞分裂增加細胞數量。",
  chromosome_dna_layer_confusion:"建議再確認染色體與 DNA：染色體含有 DNA，帶有遺傳資訊。",
  chromosome_not_copied_before_division:"建議再整理分裂前準備：染色體先複製，才有資訊可分配給子細胞。",
  division_sequence_order_confusion:"建議再整理一般細胞分裂概念順序：準備分裂、染色體複製、分配、形成兩個子細胞。",
  chromosome_distribution_unequal:"建議再看染色體分配：兩個子細胞都需要取得遺傳資訊。",
  chromosome_random_split_confusion:"建議再確認染色體分配的目的，不是隨機丟棄或隨便切半。",
  copied_chromosome_data_misread:"建議再用資料判斷染色體是否先複製、再分配。",
  mother_daughter_cell_count_confusion:"建議再確認母細胞與子細胞：一個母細胞一般分裂後形成兩個子細胞。",
  genetic_info_vs_function_confusion:"建議再區分遺傳資訊和功能：子細胞遺傳資訊大致相同，不代表未來功能永遠完全一樣。",
  cell_division_evidence_misread:"建議再用觀察證據連結生長區域與細胞分裂。",
  cell_division_reproduction_boundary_confusion:"建議再確認單元邊界：本單元看細胞如何分裂，無性生殖方式與有性生殖留到後續。",
  cell_division_unit_boundary_confusion:"建議再確認 U26/U27/U28/U29 邊界，避免把恆定或生殖單元混入本單元。"
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
        <p class="muted">可以從新細胞來源、生長修補、染色體與 DNA、分裂前複製、染色體均分、母細胞/子細胞或 U28/U29 邊界中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：染色體先複製再分配">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認染色體為什麼要先複製，再分配到兩個子細胞？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>染色體分配校準任務結算</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與新細胞來源、染色體、DNA、複製、分配、母細胞/子細胞或單元邊界相關的問題才會取得回報 EXP。</li>
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
  window.__cell_divisionTest = {
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
