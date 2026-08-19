const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260819-dichotomous-key-local-functional-v1";
const QUESTION_VERSION = "20260819-dichotomous-key-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_dichotomous_key_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_dichotomous_key_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "dichotomous_key",
  "unit_title": "檢索表的認識與應用",
  "mission_title": "特徵分支追蹤任務",
  "mission_area": "生物辨識站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  dichotomous_key_q01: 15,
  dichotomous_key_q02: 15,
  dichotomous_key_q03: 15,
  dichotomous_key_q04: 18,
  dichotomous_key_q05: 14,
  dichotomous_key_q06: 17,
  dichotomous_key_q07: 18,
  dichotomous_key_q08: 14,
  dichotomous_key_q09: 14,
  dichotomous_key_q10: 17,
  dichotomous_key_q11: 14,
  dichotomous_key_q12: 14,
  dichotomous_key_q13: 18,
  dichotomous_key_q14: 17
};
const revisionExpWeights = {
  dichotomous_key_q01: 12,
  dichotomous_key_q02: 12,
  dichotomous_key_q03: 12,
  dichotomous_key_q04: 15,
  dichotomous_key_q05: 11,
  dichotomous_key_q06: 14,
  dichotomous_key_q07: 15,
  dichotomous_key_q08: 11,
  dichotomous_key_q09: 11,
  dichotomous_key_q10: 14,
  dichotomous_key_q11: 11,
  dichotomous_key_q12: 11,
  dichotomous_key_q13: 15,
  dichotomous_key_q14: 16
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/dichotomous_key/badge-dichotomous_key-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "檢索表",
    "二分檢索",
    "可觀察特徵",
    "互斥選項",
    "分支",
    "節點",
    "路徑",
    "結果",
    "不跳步",
    "特徵描述",
    "觀察卡",
    "U37",
    "U38",
    "U39",
    "U40"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["檢索表", "二分檢索", "可觀察特徵", "互斥選項", "分支", "節點", "路徑", "結果", "不跳步"]
};

const formalBadgeCatalog = [
  ["dichotomous_key_entry", "檢索表入門", "完成 q01-q14 並提交 q15 回報。"],
  ["key_purpose_observation_reader", "檢索目的觀察者", "q01 與 q02 正確。"],
  ["mutually_exclusive_choice_checker", "互斥選項檢查員", "q03 與 q09 正確。"],
  ["branch_start_tracker", "起點分支追蹤者", "q04 branching answer 正確。"],
  ["no_skip_path_keeper", "不跳步守門員", "q05 與 q07 正確。"],
  ["observation_path_reader", "觀察路徑判讀者", "q06 正確。"],
  ["clear_feature_wording_editor", "清楚特徵編修者", "q08 與 q14 正確。"],
  ["path_result_reasoner", "路徑結果推理者", "q10 正確。"],
  ["key_scope_transferer", "檢索表遷移應用者", "q11 正確。"],
  ["u37_u40_boundary_mapper", "U37-U40 邊界配對者", "q12 正確且 q13 全對。"],
  ["branching_model_integrator", "分支模型整合者", "q04、q06、q07 全對。"],
  ["feature_evidence_guard", "特徵證據守門員", "q02、q06、q10、q14 正確。"],
  ["dichotomous_key_flawless", "零提示全對：檢索表追蹤", "q01-q14 第一次提交全對且未使用提示。"],
  ["dichotomous_key_reflection_reporter", "高品質回報：檢索表疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_dichotomous_key", "再挑戰進步：檢索表追蹤", "合法重新登入再挑戰且 verified 後比前次進步。"]
];
const formalBadgeIds = formalBadgeCatalog.map(([id]) => id);
const badges = formalBadgeCatalog.map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const branchPathMap = {
  path_alpha: ["start", "has_wings", "winged_node", "long_antennae", "result_alpha"],
  path_beta: ["start", "has_wings", "winged_node", "short_antennae", "result_beta"],
  path_gamma: ["start", "no_wings", "no_wings_node", "segmented_body", "result_gamma"],
  path_delta: ["start", "no_wings", "no_wings_node", "smooth_body", "result_delta"]
};

const unitBoundaryChoices = [
  { id: "u37_fossils_evolution", text: "第 37 站：化石與演化" },
  { id: "u38_naming_classification", text: "第 38 站：生物的命名與分類" },
  { id: "u39_dichotomous_key", text: "第 39 站：檢索表的認識與應用" },
  { id: "u40_prokaryotes_protists_fungi", text: "第 40 站：原核、原生生物及真菌界" }
];

const questions = [
  { id: "dichotomous_key_q01", section: "checkpoint1", concept: "key_purpose", skill_tag: "key_purpose", type: "choice", answer: "identify_by_features", prompt: "哪一種情境最適合使用檢索表？", hint: "想想檢索表最常用來解決「我手上的資料是哪一類」的問題。", misconception: "key_purpose_confusion", options: [ { id: "identify_by_features", text: "依特徵逐步辨識未知生物" }, { id: "make_common_name", text: "替生物取俗名" }, { id: "memorize_taxonomy", text: "背分類階層" }, { id: "value_debate", text: "討論政策或價值" } ] },
  { id: "dichotomous_key_q02", section: "checkpoint1", concept: "observable_features", skill_tag: "observable_features", type: "choice", answer: "observation_card", prompt: "使用檢索表時，學生應優先依據哪一種資訊？", hint: "先回到資料卡，找出能被不同人看見的特徵。", misconception: "impression_over_observation", options: [ { id: "observation_card", text: "觀察卡上的特徵" }, { id: "heard_name", text: "曾經聽過的名字" }, { id: "pretty_picture", text: "圖片好不好看" }, { id: "guessed_relation", text: "自己猜測的親緣" } ] },
  { id: "dichotomous_key_q03", section: "checkpoint2", concept: "mutually_exclusive_choices", skill_tag: "mutually_exclusive_choices", type: "choice", answer: "wings_yes_no", prompt: "哪一組選項比較適合作為二分檢索表的一步？", hint: "兩個選項最好不能同時成立，才容易把資料分開。", misconception: "nonexclusive_feature_pair", options: [ { id: "wings_yes_no", text: "有翅 / 無翅" }, { id: "cute_common", text: "可愛 / 常見" }, { id: "pretty_special", text: "顏色漂亮 / 形狀特別" }, { id: "maybe_size", text: "可能小 / 可能大" } ] },
  { id: "dichotomous_key_q04", section: "checkpoint3", concept: "branching_path", skill_tag: "branching_path", type: "branch_choice", backend_type: "branch_choice", answer: { node_id: "start", choice_id: "has_wings", next_node_id: "winged_node" }, prompt: "觀察卡甲有翅。從 start 節點應選哪個分支？", hint: "只看目前節點問的特徵：是否有翅。", misconception: "branch_as_global_sequence", options: [ { id: "has_wings", text: "有翅", node_id: "start", next_node_id: "winged_node" }, { id: "no_wings", text: "無翅", node_id: "start", next_node_id: "no_wings_node" } ] },
  { id: "dichotomous_key_q05", section: "checkpoint3", concept: "no_skipping_steps", skill_tag: "no_skipping_steps", type: "choice", answer: "missing_path", prompt: "有學生直接跳到最後一列猜結果，哪裡有問題？", hint: "每一步的選擇會決定下一步；少一步，後面的結果就缺少依據。", misconception: "key_skip_steps", options: [ { id: "missing_path", text: "沒有依路徑累積" }, { id: "always_faster", text: "節省時間一定較好" }, { id: "guess_ok", text: "只要猜對就好" }, { id: "no_order_needed", text: "檢索表不用看前後節點" } ] },
  { id: "dichotomous_key_q06", section: "checkpoint1", concept: "observable_features", skill_tag: "observable_features", type: "branch_path", backend_type: "branch_path", answer: { path_id: "path_alpha", node_path: ["start", "has_wings", "winged_node", "long_antennae", "result_alpha"] }, prompt: "依觀察卡甲的特徵，哪一條路徑最符合檢索表？", hint: "不看名稱，也不要猜像不像；依觀察卡列出的特徵走路徑。", misconception: "impression_over_observation", options: [ { id: "path_alpha", text: "start → has_wings → winged_node → long_antennae → result_alpha" }, { id: "path_beta", text: "start → has_wings → winged_node → short_antennae → result_beta" }, { id: "path_gamma", text: "start → no_wings → no_wings_node → segmented_body → result_gamma" }, { id: "path_delta", text: "start → no_wings → no_wings_node → smooth_body → result_delta" } ] },
  { id: "dichotomous_key_q07", section: "checkpoint3", concept: "branching_path", skill_tag: "branching_path", type: "branch_next_node", backend_type: "branch_next_node", answer: { current_path: ["start", "has_wings"], next_node_id: "winged_node" }, prompt: "已走過 start → has_wings，下一步應看哪個節點？", hint: "目前路徑最後停在哪個節點，下一步就從那裡繼續。", misconception: "key_skip_steps", options: [ { id: "winged_node", text: "winged_node" }, { id: "start", text: "start" }, { id: "no_wings_node", text: "no_wings_node" }, { id: "result_list", text: "result_list" } ] },
  { id: "dichotomous_key_q08", section: "checkpoint2", concept: "clear_feature_wording", skill_tag: "clear_feature_wording", type: "choice", answer: "clear_wings", prompt: "哪一個特徵描述比較適合放入檢索表？", hint: "好特徵要能讓不同人看同一張卡時做出相近判斷。", misconception: "unclear_feature_wording", options: [ { id: "clear_wings", text: "身體有明顯翅" }, { id: "looks_strong", text: "看起來很厲害" }, { id: "looks_like_other", text: "很像某某" }, { id: "probably_common", text: "大概比較常見" } ] },
  { id: "dichotomous_key_q09", section: "checkpoint2", concept: "mutually_exclusive_choices", skill_tag: "mutually_exclusive_choices", type: "choice", answer: "can_both_be_true", prompt: "「有斑點 / 身體很漂亮」作為二分選項有什麼問題？", hint: "二分選項應盡量讓同一張卡不會同時落入兩邊。", misconception: "nonexclusive_feature_pair", options: [ { id: "can_both_be_true", text: "兩者可能同時成立" }, { id: "too_easy", text: "太容易分類" }, { id: "plants_only", text: "只適合植物" }, { id: "never_color", text: "一定不能用顏色" } ] },
  { id: "dichotomous_key_q10", section: "checkpoint3", concept: "branching_path", skill_tag: "branching_path", type: "choice", answer: "different_node_path", prompt: "兩位學生拿同一張卡，若第一步選不同，為什麼結果可能不同？", hint: "檢索結果不是只看最後一格，而是由前面每步選擇連起來。", misconception: "path_result_confusion", options: [ { id: "different_node_path", text: "路徑不同會進入不同節點" }, { id: "key_useless", text: "檢索表沒有用" }, { id: "picture_unreliable", text: "圖片一定不可信" }, { id: "names_hard", text: "名字太難" } ] },
  { id: "dichotomous_key_q11", section: "checkpoint4", concept: "key_scope_not_only_biology", skill_tag: "key_scope_not_only_biology", type: "choice", answer: "rocks_stationery_features", prompt: "哪一個例子也可以用檢索表協助辨識？", hint: "只要資料有清楚可比較特徵，就可以設計類似檢索表。", misconception: "key_only_for_biology", options: [ { id: "rocks_stationery_features", text: "依特徵辨識岩石或文具" }, { id: "popularity_vote", text: "判斷誰比較受歡迎" }, { id: "brand_value", text: "決定哪個品牌較好" }, { id: "give_nickname", text: "替物品取綽號" } ] },
  { id: "dichotomous_key_q12", section: "checkpoint4", concept: "u38_u39_u40_boundary", skill_tag: "u38_u39_u40_boundary", type: "choice", answer: "stepwise_key", prompt: "下列哪個任務屬於 U39「檢索表的認識與應用」？", hint: "U38 是命名與分類階層；U39 才完整使用檢索表走路徑。", misconception: "u38_u39_boundary_confusion", options: [ { id: "stepwise_key", text: "依二分檢索表逐步辨識" }, { id: "binomial_naming", text: "背二名法" }, { id: "taxonomy_order", text: "排界門綱目科屬種" }, { id: "microbe_groups", text: "學原核、原生與真菌類群" } ] },
  { id: "dichotomous_key_q13", section: "checkpoint4", concept: "u38_u39_u40_boundary", skill_tag: "u38_u39_u40_boundary", type: "mapping", answer: { fossil_evidence_task: "u37_fossils_evolution", binomial_naming_task: "u38_naming_classification", branch_key_path_task: "u39_dichotomous_key", microbe_group_task: "u40_prokaryotes_protists_fungi" }, prompt: "將學習任務放到合適單元。", hint: "先看任務是在命名分類、檢索路徑、微生物類群，還是化石證據。", misconception: "adjacent_unit_boundary_confusion", items: [ { id: "fossil_evidence_task", label: "判讀地層與化石證據" }, { id: "binomial_naming_task", label: "分辨俗名、學名與分類階層" }, { id: "branch_key_path_task", label: "依二分檢索表逐步辨識" }, { id: "microbe_group_task", label: "學原核、原生與真菌類群" } ], choices: unitBoundaryChoices },
  { id: "dichotomous_key_q14", section: "checkpoint2", concept: "clear_feature_wording", skill_tag: "clear_feature_wording", type: "choice", answer: "observable_exclusive_feature", prompt: "若要替四張觀察卡建立第一個分支，哪一種做法較好？", hint: "建表第一步不一定要知道全部答案，但特徵要能清楚分開資料。", misconception: "unclear_feature_wording", options: [ { id: "observable_exclusive_feature", text: "選能把卡片清楚分成兩邊的可觀察特徵" }, { id: "higher_lower", text: "先猜哪種較高等" }, { id: "favorite_color", text: "用最喜歡的顏色" }, { id: "write_final_answer", text: "直接寫最後答案" } ] }
];
const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["dichotomous_key_q01", "dichotomous_key_q02", "dichotomous_key_q06"],
  checkpoint2: ["dichotomous_key_q03", "dichotomous_key_q08", "dichotomous_key_q09", "dichotomous_key_q14"],
  checkpoint3: ["dichotomous_key_q04", "dichotomous_key_q05", "dichotomous_key_q07", "dichotomous_key_q10"],
  checkpoint4: ["dichotomous_key_q11", "dichotomous_key_q12", "dichotomous_key_q13"]
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

function loadVerifiedSnapshot() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(verifiedSnapshotKey) || "null");
  } catch (error) {
    return null;
  }
}

function saveVerifiedSnapshot(student = state.student) {
  if (typeof localStorage === "undefined" || !student || student.is_guest) return;
  const progress = student.progress || {};
  localStorage.setItem(verifiedSnapshotKey, JSON.stringify({
    student_id: student.student_id,
    class_name: student.class_name,
    seat_no: student.seat_no,
    student_name: student.student_name,
    profile_gender: student.profile_gender || "male",
    total_exp: Number(progress.total_exp ?? student.total_exp ?? 0),
    current_title_id: progress.current_title_id || student.current_title_id || "",
    current_title: progress.current_title || student.current_title || "",
    title_avatar_path: progress.title_avatar_path || student.title_avatar_path || "",
    progress
  }));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function cacheAsset(src) {
  if (!src) return "";
  return `${src}${src.includes("?") ? "&" : "?"}v=${VERSION}`;
}

function renderScenePicture(prefix, alt) {
  const main = assets[`${prefix}Scene`];
  const src390 = assets[`${prefix}Scene390`];
  const src960 = assets[`${prefix}Scene960`];
  const src1440 = assets[`${prefix}Scene1440`];
  if (!main) {
    return `<div class="u36-scene-neutral" role="img" aria-label="${escapeHtml(alt || "檢索表的認識與應用中性任務場景")}">
      <span class="u36-scene-strand"></span>
      <span class="u36-scene-card">觀察卡</span>
      <span class="u36-scene-card">分支節點</span>
      <span class="u36-scene-card">路徑紀錄</span>
      <span class="u36-scene-card">結果欄位</span>
    </div>`;
  }
  return `<picture class="u36-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u36-page-scene u36-${prefix}-scene ${className}" data-u36-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "檢索表的認識與應用中性任務場景")}
    ${azhe ? `<img class="u36-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u36-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
  </figure>`;
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
  if (question.type === "choice" || question.type === "image_select") return typeof value === "string" && value.length > 0;
  if (question.type === "mapping") return Boolean(value && Object.keys(question.answer).every((key) => value[key]));
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length;
  if (isBranchQuestion(question)) return Boolean(normalizeBranchAnswer(question, value));
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
  if (question.type === "choice" || question.type === "image_select") return value === question.answer;
  if (question.type === "mapping") return sameMapping(value, question.answer);
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length && value.every((id, index) => id === question.answer[index]);
  if (isBranchQuestion(question)) return sameBranchAnswer(normalizeBranchAnswer(question, value), question.answer);
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

function sameOrder(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function avoidCanonicalSequenceCollision(question, order) {
  if (question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function avoidBranchChoiceCollision(question, order) {
  if (!isBranchQuestion(question)) return order;
  const canonical = (question.options || []).map((option) => option.id);
  if (!sameOrder(order, canonical)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function isBranchQuestion(question) {
  return ["branch_choice", "branch_path", "branch_next_node"].includes(question?.type);
}

function normalizeBranchAnswer(question, value) {
  if (!question || !isBranchQuestion(question) || value == null || value === "") return null;
  if (question.type === "branch_choice") {
    const choiceId = typeof value === "string" ? value : value.choice_id;
    const option = (question.options || []).find((item) => item.id === choiceId);
    return option ? { node_id: option.node_id || "start", choice_id: option.id, next_node_id: option.next_node_id || "" } : null;
  }
  if (question.type === "branch_path") {
    const pathId = typeof value === "string" ? value : value.path_id;
    const nodePath = Array.isArray(value?.node_path) ? value.node_path : branchPathMap[pathId];
    return pathId && nodePath ? { path_id: pathId, node_path: [...nodePath] } : null;
  }
  if (question.type === "branch_next_node") {
    const nextNode = typeof value === "string" ? value : value.next_node_id;
    return nextNode ? { current_path: ["start", "has_wings"], next_node_id: nextNode } : null;
  }
  return null;
}

function sameBranchAnswer(value, answer) {
  if (!value || !answer) return false;
  if (answer.choice_id) return value.node_id === answer.node_id && value.choice_id === answer.choice_id && value.next_node_id === answer.next_node_id;
  if (answer.path_id) return value.path_id === answer.path_id && sameOrder(value.node_path, answer.node_path);
  if (answer.next_node_id) return value.next_node_id === answer.next_node_id && sameOrder(value.current_path, answer.current_path);
  return false;
}

function avoidMappingOrderCollision(question, order, canonicalIds) {
  if (!sameOrder(order, canonicalIds)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function mappingAlignedWithAnswer(question, itemOrder, choiceOrder) {
  if (!question?.answer || !Array.isArray(itemOrder) || !Array.isArray(choiceOrder)) return false;
  return itemOrder.length > 1 && itemOrder.every((itemId, index) => question.answer[itemId] === choiceOrder[index]);
}

function avoidMappingAnswerAlignment(question, itemOrder, choiceOrder, side) {
  if (!mappingAlignedWithAnswer(question, itemOrder, choiceOrder)) return side === "items" ? itemOrder : choiceOrder;
  const next = [...(side === "items" ? itemOrder : choiceOrder)];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function orderedOptions(question) {
  if (!state.optionOrders[question.id]) {
    const ids = (question.type === "sequence" ? question.steps : question.options || []).map((item) => item.id);
    let order = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`);
    order = avoidCanonicalSequenceCollision(question, order);
    order = avoidBranchChoiceCollision(question, order);
    state.optionOrders[question.id] = order;
  }
  const source = Object.fromEntries((question.type === "sequence" ? question.steps : question.options || []).map((item) => [item.id, item]));
  return state.optionOrders[question.id].map((id) => source[id]).filter(Boolean);
}

function orderedMappingItems(question) {
  const key = `${question.id}_items`;
  if (!state.optionOrders[key]) {
    const ids = question.items.map((item) => item.id);
    let order = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), ids);
    const choiceOrder = state.optionOrders[`${question.id}_choices`];
    if (choiceOrder) order = avoidMappingAnswerAlignment(question, order, choiceOrder, "items");
    state.optionOrders[key] = order;
  }
  const source = Object.fromEntries(question.items.map((item) => [item.id, item]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function orderedMappingChoices(question) {
  const key = `${question.id}_choices`;
  if (!state.optionOrders[key]) {
    const ids = question.choices.map((choice) => choice.id);
    let order = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), Object.values(question.answer || {}));
    const itemOrder = state.optionOrders[`${question.id}_items`];
    if (itemOrder) order = avoidMappingAnswerAlignment(question, itemOrder, order, "choices");
    state.optionOrders[key] = order;
  }
  const source = Object.fromEntries(question.choices.map((choice) => [choice.id, choice]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function formatSelected(question) {
  const value = answerValue(question.id);
  if (question.type === "choice" || question.type === "image_select") return question.options.find((option) => option.id === value)?.text || "尚未選擇";
  if (isBranchQuestion(question)) {
    const normalized = normalizeBranchAnswer(question, value);
    if (!normalized) return "尚未選擇";
    if (normalized.choice_id) return `${normalized.node_id}｜${normalized.choice_id}`;
    if (normalized.path_id) return `${normalized.path_id}｜${normalized.node_path.join(" → ")}`;
    if (normalized.next_node_id) return `${normalized.current_path.join(" → ")}｜${normalized.next_node_id}`;
  }
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

function studentIdentityLine(student = state.student) {
  if (!student) return "尚未登入";
  if (student.is_guest) return "guest 測試身分｜不列入正式統計";
  const parts = [
    student.class_name ? `${student.class_name}班` : "",
    student.seat_no ? `${student.seat_no}號` : "",
    student.student_id ? `學號 ${student.student_id}` : ""
  ].filter(Boolean);
  return parts.join("｜") || "已連接正式學生帳號";
}

function resetScreenScroll() {
  if (typeof window === "undefined") return;
  const apply = () => {
    window.scrollTo?.(0, 0);
    if (document?.documentElement) document.documentElement.scrollTop = 0;
    if (document?.body) document.body.scrollTop = 0;
    const stage = document?.querySelector?.(".main-stage");
    if (stage) stage.scrollTop = 0;
  };
  apply();
  const raf = window.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
  raf(apply);
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
  const attemptId = uid("dichotomous_key_guest_attempt");
  state = { ...createEmptyState(), student, attempt_id: attemptId, attempt_session_token: `guest_${attemptId}`, attempt_session_id: `guest_session_${attemptId}`, question_version: QUESTION_VERSION, verification_mode: "local_guest", screen: "brief", completedScreens: ["login", "brief"] };
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
    resetScreenScroll();
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
    saveVerifiedSnapshot(student);
    renderApp();
    resetScreenScroll();
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
  resetScreenScroll();
}

function canUseNav(target) {
  if (target === "rules") return true;
  if (!state.student) return target === "login";
  if (state.submitted) return ["login", "result", "achievements", "rules"].includes(target);
  return state.completedScreens.includes(target);
}

function resetForRelogin() {
  saveVerifiedSnapshot();
  state = createEmptyState();
  state.notice = "請重新登入以開始新的挑戰。";
  saveState();
  renderApp();
  resetScreenScroll();
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
  state.answers[question.type === "sequence" ? `${questionId}_sequence` : questionId] = isBranchQuestion(question) ? normalizeBranchAnswer(question, value) : value;
  if ((question.type === "choice" || question.type === "image_select" || isBranchQuestion(question)) && value && !isCorrect(questionId)) markHint(questionId).then(renderApp);
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
  const next = { checkpoint1: "checkpoint2", checkpoint2: "checkpoint3", checkpoint3: "checkpoint4", checkpoint4: "review" }[section];
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
      skill_tag: questionMap[id].skill_tag || questionMap[id].concept,
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
  const directExp = logs.reduce((sum, log) => sum + (log.is_correct && !log.hint_used ? Number(directExpWeights[log.question_id] || 0) : 0), 0);
  const revisionExp = logs.reduce((sum, log) => sum + (log.is_correct && log.hint_used ? Number(revisionExpWeights[log.question_id] || 0) : 0), 0);
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
    concept_exp: directExp,
    revision_exp: revisionExp,
    reflection_exp: reflection.question_exp,
    question_exp: reflection.question_exp,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_exp: totalExp,
    attempt_total_exp: totalExp,
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
  const earned = [];
  earned.push("dichotomous_key_entry");
  if (passed(["dichotomous_key_q01", "dichotomous_key_q02"])) earned.push("key_purpose_observation_reader");
  if (passed(["dichotomous_key_q03", "dichotomous_key_q09"])) earned.push("mutually_exclusive_choice_checker");
  if (passed(["dichotomous_key_q04"])) earned.push("branch_start_tracker");
  if (passed(["dichotomous_key_q05", "dichotomous_key_q07"])) earned.push("no_skip_path_keeper");
  if (passed(["dichotomous_key_q06"])) earned.push("observation_path_reader");
  if (passed(["dichotomous_key_q08", "dichotomous_key_q14"])) earned.push("clear_feature_wording_editor");
  if (passed(["dichotomous_key_q10"])) earned.push("path_result_reasoner");
  if (passed(["dichotomous_key_q11"])) earned.push("key_scope_transferer");
  if (passed(["dichotomous_key_q12", "dichotomous_key_q13"])) earned.push("u37_u40_boundary_mapper");
  if (passed(["dichotomous_key_q04", "dichotomous_key_q06", "dichotomous_key_q07"])) earned.push("branching_model_integrator");
  if (passed(["dichotomous_key_q02", "dichotomous_key_q06", "dichotomous_key_q10", "dichotomous_key_q14"])) earned.push("feature_evidence_guard");
  if (flawless) earned.push("dichotomous_key_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("dichotomous_key_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_dichotomous_key");
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
  const conceptOnly = matched.length === 1 && normalized === normalizeText(matched[0]);
  if (irrelevant || lowEffort || copied || conceptOnly) return reflectionResult("invalid", 0, "回報目前較像玩笑、敷衍、單一概念詞或複製方向，保留給老師複核但不給 EXP。", "auto", normalized, original, { irrelevant, lowEffort: lowEffort || conceptOnly, copied });
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
  result.logs.forEach((log) => {
    const shortId = shortQuestionId(log.question_id);
    const question = questionMap[log.question_id];
    rawAnswers[log.question_id] = log.answer;
    rawAnswers[shortId] = log.answer;
    if (question?.type === "sequence") rawAnswers[`${shortId}_sequence`] = log.answer;
    if (question?.type === "branch_choice") rawAnswers[`${shortId}_branch`] = log.answer;
    if (question?.type === "branch_path") rawAnswers[`${shortId}_path`] = log.answer;
    if (question?.type === "branch_next_node") rawAnswers[`${shortId}_next_node`] = log.answer;
    if (question?.type === "mapping") rawAnswers[`${shortId}_map`] = log.answer;
  });
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
    question_logs: result.logs.map((log) => {
      const question = questionMap[log.question_id];
      const perQuestionExp = log.is_correct ? Math.round((log.hint_used ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / Math.max(1, result.logs.length)) : 0;
      return ({
      question_id: log.question_id,
      bare_question_id: shortQuestionId(log.question_id),
      question_version: QUESTION_VERSION,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: question?.backend_type || question?.type || "",
      attempt_answer: log.answer,
      answer_id: typeof log.answer === "string" ? log.answer : "",
      answer_raw: JSON.stringify(log.answer),
      answer_normalized: JSON.stringify(log.answer),
      answer_json: JSON.stringify(log.answer),
      branch_answer_json: isBranchQuestion(question) ? JSON.stringify(log.answer) : "",
      answer_map_json: question?.type === "mapping" ? JSON.stringify(log.answer) : "",
      evidence_id: evidenceIdForQuestion(log.question_id),
      used_hint: log.hint_used,
      hint_used: log.hint_used,
      analysis_group: analysisGroupForQuestion(log.question_id),
      concept_id: question?.concept || "",
      checkpoint_id: checkpointIdForQuestion(log.question_id),
      teacher_group_id: analysisGroupForQuestion(log.question_id),
      is_correct: log.is_correct,
      corrected_after_hint: Boolean(log.is_correct && log.hint_used),
      exp_type: log.is_correct ? (log.hint_used ? "revision" : "direct") : "none",
      exp_awarded: perQuestionExp,
      verification_status: state.student?.is_guest ? "local_guest" : "pending_backend",
      skill_tag: log.skill_tag,
      misconception_tag: log.misconception_tag
    });
    }),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
}

function shortQuestionId(questionId) {
  const match = String(questionId || "").match(/_q(\d{2})$/);
  return match ? `q${match[1]}` : String(questionId || "");
}

function analysisGroupForQuestion(questionId) {
  if (["dichotomous_key_q01", "dichotomous_key_q02", "dichotomous_key_q06"].includes(questionId)) return "key_purpose_observation";
  if (["dichotomous_key_q03", "dichotomous_key_q08", "dichotomous_key_q09", "dichotomous_key_q14"].includes(questionId)) return "mutually_exclusive_choices";
  if (["dichotomous_key_q04", "dichotomous_key_q05", "dichotomous_key_q07", "dichotomous_key_q10"].includes(questionId)) return "branch_path_reasoning";
  if (["dichotomous_key_q11"].includes(questionId)) return "key_scope_transfer";
  if (["dichotomous_key_q12", "dichotomous_key_q13"].includes(questionId)) return "unit_boundary_control";
  return "reflection_question_quality";
}

function checkpointIdForQuestion(questionId) {
  if (["dichotomous_key_q01", "dichotomous_key_q02", "dichotomous_key_q06"].includes(questionId)) return "key_cp1_purpose_observation";
  if (["dichotomous_key_q03", "dichotomous_key_q08", "dichotomous_key_q09", "dichotomous_key_q14"].includes(questionId)) return "key_cp2_exclusive_features";
  if (["dichotomous_key_q04", "dichotomous_key_q05", "dichotomous_key_q07", "dichotomous_key_q10"].includes(questionId)) return "key_cp3_branch_path";
  if (questionId === "dichotomous_key_q11") return "key_cp4_scope_boundary";
  if (["dichotomous_key_q12", "dichotomous_key_q13"].includes(questionId)) return "key_cp5_unit_boundary";
  return "key_cp6_reflection";
}

async function submitAttemptToBackend(payload) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  return requestBackend(payload);
}

function applyBackendSubmitResponse(response, localResult) {
  if (!response || response.ok === false) return localResult;
  const verified = response.verified_attempt || response.attempt || null;
  const attemptResult = response.attempt_result || response.result || null;
  const progress = response.student_progress || response.progress || null;
  if (progress) {
    state.student.progress = progress;
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id;
    state.student.current_title = progress.current_title || state.student.current_title;
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path;
    saveVerifiedSnapshot(state.student);
  }
  if (!verified && !attemptResult) return { ...localResult, backend_response: response };
  const verificationStatus = verified?.verification_status || attemptResult?.verification_status || response.verification_status || "server_verified";
  const serverVerified = verificationStatus === "server_verified" || verificationStatus === "server_verified_credited";
  const serverBadgeIds = backendBadgeIds(response, verified, attemptResult);
  const earnedBadges = serverBadgeIds.length ? serverBadgeIds : (serverVerified ? [] : localResult.earned_badges);
  const authoritative = verified || attemptResult || {};
  return {
    ...localResult,
    verification_status: verificationStatus,
    correct_count: numberFromAliases(localResult.correct_count, authoritative.correct_count, attemptResult?.correct_count),
    total_questions: numberFromAliases(localResult.total_questions, authoritative.total_questions, attemptResult?.total_questions),
    accuracy: numberFromAliases(localResult.accuracy, authoritative.accuracy, attemptResult?.accuracy),
    hint_used_count: numberFromAliases(localResult.hint_used_count, authoritative.hint_used_count, attemptResult?.hint_used_count),
    completion_exp: numberFromAliases(localResult.completion_exp, authoritative.completion_exp, attemptResult?.completion_exp),
    direct_exp: numberFromAliases(localResult.direct_exp, authoritative.direct_exp, authoritative.concept_exp, attemptResult?.direct_exp, attemptResult?.concept_exp),
    revision_exp: numberFromAliases(localResult.revision_exp, authoritative.revision_exp, attemptResult?.revision_exp),
    reflection_exp: numberFromAliases(localResult.reflection_exp, authoritative.reflection_exp, authoritative.question_exp, attemptResult?.reflection_exp, attemptResult?.question_exp),
    mastery_exp: numberFromAliases(localResult.mastery_exp, authoritative.mastery_exp, attemptResult?.mastery_exp),
    retry_exp: numberFromAliases(localResult.retry_exp, authoritative.retry_exp, attemptResult?.retry_exp),
    attempt_exp: numberFromAliases(localResult.attempt_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
    unit_credited_exp: numberFromAliases(localResult.unit_credited_exp, authoritative.unit_credited_exp, attemptResult?.unit_credited_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
    exp_delta: numberFromAliases(localResult.exp_delta, authoritative.credited_delta, authoritative.exp_delta, attemptResult?.credited_delta, attemptResult?.exp_delta),
    earned_badges: earnedBadges,
    backend_response: response
  };
}

function numberFromAliases(fallback, ...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return Number(fallback || 0);
}

function objectFromValue(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

function badgeIdsFromValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : item?.badge_id || item?.id).filter(Boolean);
  const parsed = objectFromValue(value);
  if (Array.isArray(parsed)) return badgeIdsFromValue(parsed);
  if (parsed && typeof parsed === "object") return Object.keys(parsed).filter((id) => parsed[id]);
  return [];
}

function backendBadgeIds(response, verified, attemptResult) {
  const sources = [
    attemptResult?.newly_credited_badges_json,
    attemptResult?.earned_badges_json,
    attemptResult?.newly_credited_badges,
    attemptResult?.earned_badges,
    verified?.newly_credited_badges_json,
    verified?.earned_badges_json,
    verified?.earned_badges,
    verified?.badges,
    verified?.badges_json,
    response?.newly_credited_badges_json,
    response?.earned_badges_json,
    response?.earned_badges,
    response?.badges_json
  ];
  for (const value of sources) {
    const ids = badgeIdsFromValue(value);
    if (ids.length) return [...new Set(ids)];
  }
  return [];
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
  resetScreenScroll();
}

function renderLogin() {
  return `
    <div class="wide-layout login-layout">
      <section class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">檢索表的認識與應用</h2>
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
  const studentName = state.student?.student_name || "同學";
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene dichotomous_key-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "檢索表的認識與應用中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用觀察卡、互斥選項與分支路徑，練習依可觀察特徵一步步辨識資料。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入檢索表任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "檢索表的認識與應用準備場景" })}<div><h3>讀資料時先看可觀察特徵、目前節點、可選分支與已走路徑。</h3><p>本任務不使用完整答案樹，也不提前進入 U40 類群細節；每一題只依穩定 ID 與當前資料判斷。</p></div></div><div class="concept-grid"><article><strong>用途</strong><p>檢索表用來依特徵逐步辨識資料。</p></article><article><strong>互斥</strong><p>二分選項要能把同一張卡清楚分開。</p></article><article><strong>分支</strong><p>每一步會決定下一個節點，不能跳步。</p></article><article><strong>邊界</strong><p>分清 U37 化石、U38 命名分類、U39 檢索表與 U40 類群內容。</p></article></div><button class="primary" data-next="checkpoint1">開始檢索表任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["目的、觀察卡與路徑讀取", "讀取觀察卡資料，確認檢索表用途與依特徵走路徑。"],
    checkpoint2: ["互斥選項與清楚特徵", "判斷二分選項是否互斥，修正模糊或主觀的特徵描述。"],
    checkpoint3: ["分支路徑與目前節點", "依目前節點、已走路徑與分支選項完成檢索判讀。"],
    checkpoint4: ["應用範圍與相鄰單元邊界", "確認檢索表可用於多種資料，並分清 U37-U40 任務。"]
  }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${renderCheckpointEvidence(section)}${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會整理概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint4" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
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

function conceptLabel(concept) {
  return {
    key_purpose: "檢索表目的",
    observable_features: "可觀察特徵",
    mutually_exclusive_choices: "互斥選項",
    branching_path: "分支路徑",
    no_skipping_steps: "不跳步",
    clear_feature_wording: "清楚特徵描述",
    key_scope_not_only_biology: "適用範圍",
    u38_u39_u40_boundary: "相鄰單元邊界",
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "dichotomous_key_q02") return `<div class="evidence-card key-observation-evidence" role="group" aria-label="觀察卡列出可被不同人看見的特徵欄位。"><strong>觀察卡資料</strong><div class="key-card-grid"><article><span class="model-field-label">觀察卡甲</span><span class="model-field-value">有翅；觸角較長；身體有斑點</span></article><article><span class="model-field-label">觀察卡乙</span><span class="model-field-value">有翅；觸角較短；身體無斑點</span></article><article><span class="model-field-label">欄位</span><span class="model-field-value">外形、附肢、表面特徵</span></article></div><p class="muted">資料卡只列出可觀察欄位，請依題目判讀。</p></div>`;
  if (qid === "dichotomous_key_q03") return `<div class="evidence-card key-choice-pair-evidence" role="group" aria-label="兩組二分選項文字卡。"><strong>A/B 選項卡</strong><div class="key-card-grid"><article><span class="model-field-label">選項組一</span><span class="model-field-value">有翅 / 無翅</span></article><article><span class="model-field-label">選項組二</span><span class="model-field-value">可愛 / 常見</span></article><article><span class="model-field-label">選項組三</span><span class="model-field-value">顏色漂亮 / 形狀特別</span></article></div><p class="muted">請比較每組文字是否能依同一張資料卡判斷。</p></div>`;
  if (qid === "dichotomous_key_q04") return `<div class="evidence-card key-branch-node-evidence" role="group" aria-label="目前節點卡列出 start 節點與可選分支。"><strong>目前節點卡</strong><div class="key-node-card"><span class="model-field-label">node_id</span><strong>start</strong><p>目前節點只檢查是否有翅。</p></div><div class="key-card-grid"><article><span class="model-field-label">choice_id</span><span class="model-field-value">has_wings</span></article><article><span class="model-field-label">choice_id</span><span class="model-field-value">no_wings</span></article></div><p class="muted">卡片只列出目前節點與兩個可選分支。</p></div>`;
  if (qid === "dichotomous_key_q06") return `<div class="evidence-card key-path-evidence" role="group" aria-label="觀察卡甲列出翅、觸角與斑點資料，並列出四條候選路徑。"><strong>觀察卡甲與路徑選項</strong><div class="key-card-grid"><article><span class="model-field-label">觀察卡甲</span><span class="model-field-value">有翅；觸角較長；身體有斑點</span></article><article><span class="model-field-label">路徑資料</span><span class="model-field-value">每條路徑由 node_id、choice_id 與 result_id 組成</span></article></div><p class="muted">請依觀察卡上的特徵，比較候選路徑。</p></div>`;
  if (qid === "dichotomous_key_q07") return `<div class="evidence-card key-current-path-evidence" role="group" aria-label="目前已走路徑顯示 start 到 has_wings。"><strong>目前已走路徑</strong><div class="key-path-strip"><span>start</span><span>has_wings</span></div><p class="muted">此區只顯示目前已累積的路徑，下一步需由題目選擇。</p></div>`;
  if (qid === "dichotomous_key_q09") return `<div class="evidence-card key-flawed-pair-evidence" role="group" aria-label="二分選項文字卡列出有斑點與身體很漂亮。"><strong>二分選項文字卡</strong><div class="key-card-grid"><article><span class="model-field-label">選項 A</span><span class="model-field-value">有斑點</span></article><article><span class="model-field-label">選項 B</span><span class="model-field-value">身體很漂亮</span></article></div><p class="muted">請只依這組選項文字判讀。</p></div>`;
  if (qid === "dichotomous_key_q10") return `<div class="evidence-card key-path-comparison-evidence" role="group" aria-label="路徑比較卡列出第一步後的不同節點資料。"><strong>路徑比較卡</strong><div class="key-card-grid"><article><span class="model-field-label">路徑甲</span><span class="model-field-value">start → has_wings → winged_node</span></article><article><span class="model-field-label">路徑乙</span><span class="model-field-value">start → no_wings → no_wings_node</span></article></div><p class="muted">資料卡只列出路徑分支資料，請依題目判讀。</p></div>`;
  if (qid === "dichotomous_key_q13") return `<div class="evidence-card key-boundary-evidence" role="group" aria-label="相鄰單元任務卡列出四個學習任務。"><strong>相鄰單元任務卡</strong><div class="key-card-grid"><article><span class="model-field-label">任務 A</span><span class="model-field-value">判讀地層與化石證據</span></article><article><span class="model-field-label">任務 B</span><span class="model-field-value">分辨俗名、學名與分類階層</span></article><article><span class="model-field-label">任務 C</span><span class="model-field-value">依二分檢索表逐步辨識</span></article><article><span class="model-field-label">任務 D</span><span class="model-field-value">學原核、原生與真菌類群</span></article></div><p class="muted">資料卡只呈現任務文字，請依題目對應。</p></div>`;
  if (qid === "dichotomous_key_q14") return `<div class="evidence-card key-feature-build-evidence" role="group" aria-label="四張觀察卡特徵表列出有翅、無翅、觸角與身體表面資料。"><strong>觀察卡特徵表</strong><div class="key-data-table" role="table" aria-label="觀察卡特徵表"><div role="row"><span role="columnheader">觀察卡</span><span role="columnheader">特徵欄位</span><span role="columnheader">紀錄</span></div><div role="row"><span role="cell">甲</span><span role="cell">翅</span><span role="cell">有</span></div><div role="row"><span role="cell">乙</span><span role="cell">翅</span><span role="cell">有</span></div><div role="row"><span role="cell">丙</span><span role="cell">翅</span><span role="cell">無</span></div><div role="row"><span role="cell">丁</span><span role="cell">翅</span><span role="cell">無</span></div></div><p class="muted">表格列出觀察卡欄位與紀錄，請依題目判讀。</p></div>`;
  return "";
}

function evidenceIdForQuestion(questionId) {
  const shortId = shortQuestionId(questionId);
  return ["q02", "q03", "q04", "q06", "q07", "q09", "q10", "q13", "q14"].includes(shortId) ? `dichotomous_key_${shortId}_html_evidence` : "";
}

function renderCheckpointEvidence(section) {
  return "";
}

function renderQuestionControl(question) {
  if (question.type === "choice" || question.type === "image_select") return renderChoiceQuestion(question);
  if (question.type === "mapping") return renderMappingQuestion(question);
  if (question.type === "sequence") return renderSequenceQuestion(question);
  if (isBranchQuestion(question)) return renderBranchQuestion(question);
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

function renderBranchQuestion(question) {
  const selected = normalizeBranchAnswer(question, state.answers[question.id]);
  return `<div class="option-grid branch-option-grid" data-branch-question="${question.id}">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected && (selected.choice_id === option.id || selected.path_id === option.id || selected.next_node_id === option.id) ? "selected" : ""}" data-answer="${question.id}" data-value="${option.id}">
      ${escapeHtml(option.text)}
    </button>
  `).join("")}</div>`;
}

function renderMappingQuestion(question) {
  const current = state.answers[question.id] || {};
  const items = orderedMappingItems(question);
  const choices = orderedMappingChoices(question);
  return `<div class="mapping-list">${items.map((item) => `
    <label class="mapping-row">
      <span>${escapeHtml(item.label)}</span>
      <select data-map-question="${question.id}" data-map-item="${item.id}">
        <option value="">尚未選擇</option>
        ${choices.map((choice) => `<option value="${choice.id}" ${current[item.id] === choice.id ? "selected" : ""}>${escapeHtml(choice.text)}</option>`).join("")}
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的檢索表判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的可觀察特徵、互斥選項、分支路徑與相鄰單元邊界。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  key_purpose_confusion: "建議再確認檢索表目的：重點是依清楚特徵逐步辨識資料。",
  impression_over_observation: "建議再確認可觀察特徵：不要只靠印象、名字或外觀好惡。",
  nonexclusive_feature_pair: "建議再確認互斥選項：同一張卡不應同時落入兩邊。",
  branch_as_global_sequence: "建議再確認分支檢索：分支不是所有資料共用的一條排序。",
  key_skip_steps: "建議再確認不跳步：要依目前路徑前進。",
  unclear_feature_wording: "建議再確認特徵描述：要清楚、具體、可觀察。",
  path_result_confusion: "建議再確認路徑結果：前面分支會影響後面節點與結果。",
  key_only_for_biology: "建議再確認檢索表範圍：它也可用於有清楚特徵的物件。",
  u38_u39_boundary_confusion: "建議再確認 U38 與 U39 邊界：U39 是完整檢索操作。",
  adjacent_unit_boundary_confusion: "建議再確認 U37、U38、U39、U40 的學習任務差異。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從檢索表、二分檢索、可觀察特徵、互斥選項、分支、節點、路徑、結果、不跳步或 U37-U40 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：二分檢索表要依目前節點前進"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認怎樣的特徵才算互斥且可觀察。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "檢索表的認識與應用結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>檢索表的認識與應用任務結算</h2>
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
          <button class="secondary" data-relogin="true">重新登入／再挑戰</button>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges, { onlyEarned: true })}
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
  return `
    <div class="stack achievements-stack" data-bq-achievements-overview-only="true">
      <section class="panel action-panel">
        <p class="eyebrow">再挑戰</p>
        <h2>重新登入後開始新的挑戰</h2>
        <p class="muted">本次作答與結算已鎖定；若要再挑戰，請重新登入並從頭完成。這不會刪除既有正式累積資料。</p>
        <button class="secondary" data-relogin="true">重新登入／再挑戰</button>
      </section>
    </div>
  `;
}

function resultMode(result = state.result || scoreAttempt()) {
  const status = result?.verification_status || (state.student?.is_guest ? "local_guest" : "pending_backend");
  if (state.student?.is_guest || status === "local_guest") return "guest";
  if (status === "server_verified" || status === "server_verified_credited") return "verified";
  return "pending";
}

function renderBadgeWall(earned = [], options = {}) {
  const earnedSet = new Set(earned);
  const earnedBadges = [...earnedSet].map((id) => badges.find((badge) => badge.id === id)).filter(Boolean);
  const visibleBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status === "ready" && badge.badge_image_path) : badges;
  const candidateBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status !== "ready" || !badge.badge_image_path) : [];
  if (options.onlyEarned && visibleBadges.length === 0 && candidateBadges.length === 0) {
    return `<section class="panel">
      <p class="eyebrow">本次取得項目</p>
      <h2>本次尚未取得新項目</h2>
      <p class="muted">完成任務後會依本次表現列出實際取得的正式圖像徽章；正式累積以後台確認為準。</p>
    </section>`;
  }
  return `<section class="panel">
    <p class="eyebrow">${options.onlyEarned ? "本次取得項目" : "本單元項目"}</p>
    <h2>${options.onlyEarned ? "本次正式圖像徽章" : `本單元 ${badges.length} 項`}</h2>
    ${visibleBadges.length ? `<div class="${options.onlyEarned ? "earned-badge-list" : "badge-wall"}">
      ${visibleBadges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual" data-badge-image-status="${badge.image_status || "pending"}"><img src="${badge.badge_image_path}?v=${VERSION}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();"></div>
          <strong>${escapeHtml(badge.name)}</strong>
          ${options.onlyEarned ? "" : `<p>${escapeHtml(badge.condition)}</p>`}
        </article>
      `).join("")}
    </div>` : `<p class="muted">本次沒有已核准正式圖像徽章可顯示；正式累積以後台確認為準。</p>`}
    ${candidateBadges.length ? `<div class="candidate-badge-list" aria-label="本次達成但未列正式圖像的項目"><h3>本次達成候選項目</h3><p class="muted">以下項目等正式圖像核准後才會進入正式徽章圖像展示；本頁不請求不存在的圖檔。</p><ul>${candidateBadges.map((badge) => `<li><strong>${escapeHtml(badge.name)}</strong><span>${escapeHtml(badge.condition)}</span></li>`).join("")}</ul></div>` : ""}
  </section>`;
}

function renderRules() {
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與檢索表、二分檢索、可觀察特徵、互斥選項、分支、節點、路徑、結果、不跳步或 U37-U40 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
    checkpoint4: () => renderCheckpoint("checkpoint4"),
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
  screen.querySelectorAll("[data-relogin]").forEach((button) => button.addEventListener("click", resetForRelogin));
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
    if (!canUseNav(button.dataset.nav)) return;
    if (state.submitted && button.dataset.nav === "login") resetForRelogin();
    else setScreen(button.dataset.nav);
  }));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderApp);
  else renderApp();
}

if (typeof window !== "undefined") {
  window.__dichotomousKeyTest = {
    VERSION,
    QUESTION_VERSION,
    mission,
    assets,
    formalBadgeIds,
    badges,
    questions,
    state: () => state,
    setState: (next) => { state = { ...createEmptyState(), ...next }; },
    createEmptyState,
    loadAttempts,
    loadVerifiedSnapshot,
    saveVerifiedSnapshot,
    resetForRelogin,
    canUseNav,
    orderedOptions,
    orderedMappingItems,
    orderedMappingChoices,
    mappingAlignedWithAnswer,
    avoidCanonicalSequenceCollision,
    avoidBranchChoiceCollision,
    normalizeBranchAnswer,
    sameBranchAnswer,
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    applyBackendSubmitResponse,
    evaluateReflection,
    titleAvatarPath,
    studentIdentityLine,
    resetScreenScroll,
    checkpointIdForQuestion,
    renderLogin,
    renderBrief,
    renderScan,
    renderQuestionEvidence,
    renderCheckpointEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements,
    renderBadgeWall,
    renderRules
  };
}
