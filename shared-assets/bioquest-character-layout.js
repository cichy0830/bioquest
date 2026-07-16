(function initBioQuestCharacterLayout(global) {
  const FEEDBACK_STATES = ["excellent", "strong", "stable", "needs_review", "retry_ready"];
  const FEEDBACK_COPY = {
    excellent: ["零提示精熟", "你已能穩定掌握本單元重點，接下來可以練習把判斷證據清楚說給同學聽。"],
    strong: ["概念掌握良好", "大部分判斷已經穩定，請把少數仍想確認的線索帶到課堂討論。"],
    stable: ["基礎概念穩定", "你已完成任務，接下來請整理最有把握的證據與仍會混淆的情境。"],
    needs_review: ["建議回看概念", "有幾個概念需要再釐清，請閱讀下方建議，再用自己的話留下問題。"],
    retry_ready: ["整理後再挑戰", "先保留這次找到的線索，重新整理後再登入挑戰，會更容易看見自己的進步。"]
  };
  const enhancedGenerations = new WeakMap();
  const BADGE_OVERVIEW_VERSION = "20260715-achievement-order-v1";
  const UNIT_BADGE_OVERVIEW_UNITS = [
    ["life_world", 1, "多彩多姿的生命世界", "open", 9],
    ["scientific_method", 2, "探究自然的科學方法", "open", 8],
    ["lab_intro", 3, "進入實驗室", "open", 8],
    ["microscope_use", 4, "顯微鏡的使用", "open", 8],
    ["cell_basic_unit", 5, "生物體的基本單位", "open", 8],
    ["cell_structure", 6, "細胞的構造", "open", 9],
    ["cell_observation", 7, "細胞的觀察", "open", 10],
    ["cell_transport", 8, "物質進出細胞的方式", "open", 10],
    ["biological_organization", 9, "生物體的組成層次", "open", 10],
    ["scale", 10, "尺度", "open", 11],
    ["nutrients_energy", 11, "食物中的養分與能量", "open", 11],
    ["nutrient_test", 12, "養分檢測", "open", 11],
    ["enzymes", 13, "酵素", "open", 11],
    ["photosynthesis", 14, "植物如何製造養分", "open", 11],
    ["human_nutrition", 15, "人體如何獲得養分", "open", 13],
    ["plant_transport_structures", 16, "植物的運輸構造", "open", 14],
    ["plant_material_transport", 17, "植物體內物質的運輸", "locked", null],
    ["cardiovascular_components", 18, "人體心血管系統的組成", "locked", null],
    ["human_circulation", 19, "人體的循環系統", "locked", null],
    ["stimulus_response", 20, "刺激與反應", "locked", null],
    ["nervous_system", 21, "神經系統", "locked", null],
    ["endocrine_system", 22, "內分泌系統", "locked", null],
    ["behavior_sensing", 23, "行為與感應", "locked", null],
    ["respiration_homeostasis", 24, "呼吸與氣體的恆定", "locked", null],
    ["excretion_water_homeostasis", 25, "排泄與水分的恆定", "locked", null],
    ["temperature_glucose_homeostasis", 26, "體溫與血糖的恆定", "locked", null],
    ["cell_division", 27, "細胞的分裂", "locked", null],
    ["asexual_reproduction", 28, "無性生殖", "locked", null],
    ["sexual_reproduction", 29, "有性生殖", "locked", null],
    ["egg_observation", 30, "蛋的觀察", "locked", null],
    ["flower_observation", 31, "花的觀察", "locked", null],
    ["genetics_chromosome_gene", 32, "遺傳、染色體與基因", "locked", null],
    ["human_genetics", 33, "人類的遺傳", "locked", null],
    ["abo_blood_type", 34, "人類的 ABO 血型遺傳", "locked", null],
    ["mutation_genetic_disease", 35, "突變與遺傳疾病", "locked", null],
    ["biotechnology", 36, "生物技術", "locked", null],
    ["fossils_evolution", 37, "化石與演化", "locked", null],
    ["naming_classification", 38, "生物的命名與分類", "locked", null],
    ["dichotomous_key", 39, "檢索表的認識與應用", "locked", null],
    ["prokaryotes_protists_fungi", 40, "原核、原生生物及真菌界", "locked", null],
    ["plant_kingdom", 41, "植物界", "locked", null],
    ["fern_observation", 42, "蕨類植物的觀察", "locked", null],
    ["animal_kingdom", 43, "動物界", "locked", null],
    ["population_community_succession", 44, "族群、群集與演替", "locked", null],
    ["population_sampling", 45, "族群個體數的調查", "locked", null],
    ["biotic_interactions", 46, "生物間的互動關係", "locked", null],
    ["ecosystem", 47, "生態系", "locked", null],
    ["ecosystem_types", 48, "生態系的類型", "locked", null],
    ["biodiversity", 49, "生物多樣性", "locked", null],
    ["biodiversity_crisis", 50, "生物多樣性面臨的危機", "locked", null],
    ["conservation_actions", 51, "保育的落實", "locked", null],
    ["environment_sustainability", 52, "環境的永續發展", "locked", null]
  ].map(([unit_id, sequence, unit_title, availability_status, total_badges]) => ({
    unit_id,
    sequence,
    unit_title,
    station_title: `第 ${sequence} 站｜${unit_title}`,
    availability_status,
    total_badges
  }));

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function setHtml(node, value) {
    if (node && node.innerHTML !== value) node.innerHTML = value;
  }

  function setAttribute(node, name, value) {
    if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
  }

  function setDataset(node, name, value) {
    if (node && node.dataset[name] !== value) node.dataset[name] = value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseJsonValue(value, fallback = []) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return value;
    if (typeof value !== "string" || !value.trim()) return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function appStateFromGlobals() {
    const explicit = global.__BIOQUEST_BADGE_OVERVIEW_STATE__;
    if (explicit && typeof explicit === "object") return explicit;
    for (const key of Object.keys(global)) {
      if (!/^__.*Test$/.test(key)) continue;
      const api = global[key];
      if (!api || typeof api.state !== "function") continue;
      try {
        const state = api.state();
        if (state && typeof state === "object") return state;
      } catch {
        // Ignore test helper state access failures; the renderer will use a safe empty state.
      }
    }
    return {};
  }

  function progressFromState(state) {
    return global.__BIOQUEST_BADGE_OVERVIEW_PROGRESS__
      || state?.student?.progress
      || state?.progress
      || state?.student_progress
      || {};
  }

  function normalizeTotalBadgeCount(value) {
    if (value === null || value === undefined || value === "") return null;
    const total = Number(value);
    return Number.isFinite(total) && total > 0 ? total : null;
  }

  function isGuestState(state) {
    const student = state?.student || state || {};
    const id = String(student.student_id || student.id || "").toLowerCase();
    return Boolean(student.is_guest || student.guest || id === "guest");
  }

  function isVerifiedProgress(progress) {
    if (!progress || typeof progress !== "object") return false;
    const source = String(progress.source || progress.verification_status || "").toLowerCase();
    const applied = progress.progress_applied === true || String(progress.progress_applied || "").toLowerCase() === "true";
    return source === "server_verified"
      || source === "last_verified_snapshot"
      || applied
      || progress.unit_badge_summary_json !== undefined;
  }

  function normalizeBadgeImagePath(path, unitId) {
    const value = String(path || "").trim();
    if (!value) return "";
    if (/^(https?:)?\/\//.test(value) || value.startsWith("/") || value.startsWith("../")) return value;
    if (value.startsWith("shared-assets/") || value.startsWith("prototype-")) return `../${value}`;
    if (value.startsWith("assets/")) {
      const unitPath = {
        life_world: "prototype-life-world",
        scientific_method: "prototype-scientific-method",
        lab_intro: "prototype-lab-entry",
        microscope_use: "prototype-microscope-use",
        cell_basic_unit: "prototype-cell-basic-unit",
        cell_structure: "prototype-cell-structure",
        cell_observation: "prototype-cell-observation",
        cell_transport: "prototype-cell-transport",
        biological_organization: "prototype-biological-organization",
        scale: "prototype-scale",
        nutrients_energy: "prototype-nutrients-energy",
        nutrient_test: "prototype-nutrient-test",
        enzymes: "prototype-enzymes",
        photosynthesis: "prototype-photosynthesis",
        human_nutrition: "prototype-human-nutrition",
        plant_transport_structures: "prototype-plant-transport-structures"
      }[unitId];
      return unitPath && unitId !== document.body?.dataset?.unitId ? `../${unitPath}/${value}` : value;
    }
    return value;
  }

  function normalizeUnitBadgeSummary(progress, state) {
    const fallback = UNIT_BADGE_OVERVIEW_UNITS.map((unit) => ({ ...unit, earned_count: 0, earned_badges: [] }));
    if (isGuestState(state)) return { units: fallback, status: "guest" };
    if (!isVerifiedProgress(progress)) return { units: fallback, status: "pending" };
    const raw = parseJsonValue(progress.unit_badge_summary_json, []);
    const summary = Array.isArray(raw) ? raw : Array.isArray(raw?.units) ? raw.units : [];
    if (!summary.length) return { units: fallback, status: "verified_empty" };
    const byId = new Map(summary.map((item) => [String(item.unit_id || item.unitId || ""), item]));
    const units = UNIT_BADGE_OVERVIEW_UNITS.map((unit) => {
      const item = byId.get(unit.unit_id) || {};
      const earnedBadges = parseJsonValue(item.earned_badges ?? item.earnedBadges, []);
      const total = item.total_badges ?? item.totalBadges ?? unit.total_badges;
      const availability = item.availability_status || item.availabilityStatus || unit.availability_status;
      return {
        ...unit,
        station_title: item.station_title || item.stationTitle || unit.station_title,
        availability_status: availability,
        total_badges: normalizeTotalBadgeCount(total),
        earned_count: Number(item.earned_count ?? item.earnedCount ?? earnedBadges.length ?? 0),
        earned_badges: Array.isArray(earnedBadges) ? earnedBadges : []
      };
    });
    return { units, status: "verified" };
  }

  function renderBadgeOverviewThumbs(unit) {
    const badges = Array.isArray(unit.earned_badges) ? unit.earned_badges : [];
    if (!badges.length) return `<span class="bq-unit-badge-empty">尚無正式取得徽章</span>`;
    return badges.map((badge) => {
      const id = badge.badge_id || badge.id || badge.badgeId || "";
      const label = badge.name || badge.badge_name || badge.badgeName || id || "已取得徽章";
      const src = normalizeBadgeImagePath(badge.badge_image_path || badge.badgeImagePath || badge.image || "", unit.unit_id);
      if (!src) return `<span class="bq-unit-badge-missing" role="img" aria-label="${escapeHtml(label)}缺圖" title="${escapeHtml(label)}缺圖">缺圖</span>`;
      return `<img class="bq-unit-badge-thumb" src="${escapeHtml(src)}" alt="${escapeHtml(label)}" title="${escapeHtml(label)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="bq-unit-badge-missing" hidden role="img" aria-label="${escapeHtml(label)}缺圖" title="${escapeHtml(label)}缺圖">缺圖</span>`;
    }).join("");
  }

  function renderWholeBookBadgeOverview() {
    const state = appStateFromGlobals();
    const progress = progressFromState(state);
    const { units, status } = normalizeUnitBadgeSummary(progress, state);
    const note = status === "verified"
      ? "以下只列入後台 verified 的正式累積徽章；未取得徽章與條件請看本單元成就。"
      : status === "guest"
        ? "guest 測試不列入正式累積徽章；正式帳號登入並完成後台同步後才會更新。"
        : "等待後台回傳 unit_badge_summary_json；pending 或本機候選徽章不列入正式總覽。";
    const cards = units.map((unit) => {
      const total = normalizeTotalBadgeCount(unit.total_badges);
      const open = ["open", "ready"].includes(String(unit.availability_status || "").toLowerCase());
      const countText = total === null ? (open ? "0/-" : "尚未開放") : `${Math.min(Number(unit.earned_count || 0), total)}/${total}`;
      const stateText = total === null ? (open ? "徽章目錄待接" : "尚未開放") : (Number(unit.earned_count || 0) ? "已有正式取得徽章" : "尚無正式取得徽章");
      return `<article class="bq-unit-badge-summary" data-unit-id="${escapeHtml(unit.unit_id)}" data-availability="${escapeHtml(unit.availability_status || "")}">
        <div class="bq-unit-badge-summary__head">
          <strong>${escapeHtml(unit.station_title || `第 ${unit.sequence} 站｜${unit.unit_title}`)}</strong>
          <span>${escapeHtml(countText)}</span>
        </div>
        <div class="bq-unit-badge-thumbs" aria-label="${escapeHtml(unit.unit_title)}已取得正式徽章">${renderBadgeOverviewThumbs(unit)}</div>
        <p>${escapeHtml(stateText)}</p>
      </article>`;
    }).join("");
    return `<p class="eyebrow">全部任務徽章</p>
      <h3>全冊徽章總覽</h3>
      <p class="muted">${note}</p>
      <div class="bq-unit-badge-summary-grid" data-bq-badge-overview-version="${BADGE_OVERVIEW_VERSION}">${cards}</div>`;
  }

  function activeScreen() {
    const rootScreen = document.querySelector("#screen");
    return rootScreen?.dataset?.bioquestScreen || document.querySelector("[data-nav].active")?.dataset.nav || "";
  }

  function bodyPath(name, fallback) {
    return document.body?.dataset?.[name] || fallback;
  }

  const loginBusyState = {
    active: false,
    controls: [],
    observer: null,
    busyText: ""
  };

  function loginControls() {
    const root = document.querySelector("#screen") || document;
    return [
      root.querySelector("#loginButton, #loginBtn"),
      root.querySelector("#guestButton, #guestBtn"),
      root.querySelector("#resetButton"),
      root.querySelector("#studentIdInput, #studentId")
    ].filter(Boolean);
  }

  function loginStatusNode() {
    const root = document.querySelector("#screen") || document;
    return root.querySelector("#loginMessage");
  }

  function restoreLoginBusy() {
    if (loginBusyState.observer) {
      loginBusyState.observer.disconnect();
      loginBusyState.observer = null;
    }
    loginBusyState.controls.forEach((control) => {
      control.disabled = control.dataset.bqLoginWasDisabled === "true";
      if (control.dataset.bqLoginText) control.textContent = control.dataset.bqLoginText;
      control.removeAttribute("aria-busy");
      delete control.dataset.bqLoginWasDisabled;
      delete control.dataset.bqLoginText;
    });
    loginBusyState.controls = [];
    loginBusyState.active = false;
    loginBusyState.busyText = "";
  }

  function beginLoginBusy(options = {}) {
    if (loginBusyState.active) return null;
    const status = loginStatusNode();
    const guest = Boolean(options.guest);
    const busyText = options.message || (guest
      ? "正在建立老師測試模式，請稍候……"
      : "正在連接 BioQuest 學習後台，請稍候……");
    const buttonText = options.buttonText || (guest ? "建立中……" : "連線中……");

    if (status) {
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.innerHTML = `<span class="pill">${busyText}</span>`;
      loginBusyState.observer = new MutationObserver(() => {
        const currentText = status.textContent || "";
        if (loginBusyState.active && currentText && !currentText.includes(loginBusyState.busyText)) restoreLoginBusy();
      });
      loginBusyState.observer.observe(status, { childList: true, subtree: true, characterData: true });
    }

    loginBusyState.controls = loginControls();
    loginBusyState.controls.forEach((control) => {
      control.dataset.bqLoginWasDisabled = String(control.disabled);
      if (control.tagName === "BUTTON") {
        control.dataset.bqLoginText = control.textContent;
        control.textContent = control.matches("#loginButton, #loginBtn") ? buttonText : control.textContent;
      }
      control.disabled = true;
      control.setAttribute("aria-busy", "true");
    });
    loginBusyState.active = true;
    loginBusyState.busyText = busyText;
    return { busyText };
  }

  function waitForLoginPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function enhanceBrandMark() {
    const mark = document.querySelector(".brand-mark");
    if (!mark) return;
    mark.classList.add("bq-brand-mark");
    if (mark.querySelector("img")) return;
    const source = bodyPath("brandIconSrc", "../shared-assets/branding/bioquest-app-icon.webp?v=20260712-brand-icon-v1");
    mark.innerHTML = `<img src="${source}" alt="生命祕境 BioQuest 圖示">`;
  }

  function feedbackState(result = {}) {
    const accuracy = Number(result.accuracy ?? (Number(result.correct || 0) / Math.max(1, Number(result.total || 0))));
    const hints = Number(result.hint_used ?? result.hints_used ?? 0);
    const retryImproved = Boolean(result.retry_improved || Number(result.retry_exp || 0) > 0);
    if (retryImproved) return "retry_ready";
    if (accuracy >= 1 && hints === 0) return "excellent";
    if (accuracy >= 0.85) return "strong";
    if (accuracy >= 0.65) return "stable";
    if (accuracy < 0.4) return "retry_ready";
    return "needs_review";
  }

  function performanceFromPanel(panel) {
    let correct = null;
    let total = null;
    let accuracy = null;
    let hints = 0;
    panel.querySelectorAll(".score-box").forEach((box) => {
      const label = box.querySelector("span")?.textContent?.trim() || "";
      const value = box.querySelector("strong")?.textContent?.trim() || "";
      if (/答對/.test(label) && /(\d+)\s*\/\s*(\d+)/.test(value)) {
        const match = value.match(/(\d+)\s*\/\s*(\d+)/);
        correct = Number(match[1]);
        total = Number(match[2]);
      }
      if (/正確率/.test(label) && /(\d+(?:\.\d+)?)%/.test(value)) accuracy = Number(value.match(/(\d+(?:\.\d+)?)%/)[1]) / 100;
      if (/提示使用/.test(label)) hints = Number(value.match(/\d+/)?.[0] || 0);
    });
    if (accuracy === null && correct !== null && total) accuracy = correct / total;
    return { accuracy: accuracy ?? 0.7, hint_used: hints, correct, total };
  }

  function feedbackImage(state) {
    const directory = bodyPath("feedbackMentorBase", "../shared-assets/mentor-feedback").replace(/\/$/, "");
    return `${directory}/mentor-feedback-${state}.webp?v=20260712-expression-v2`;
  }

  function unitPositionText() {
    const sequence = document.body?.dataset?.unitSequence || "";
    const title = document.body?.dataset?.unitTitle || "";
    if (!sequence || !title) return "";
    return `第 ${sequence} 站｜${title}`;
  }

  function enhanceUnitPosition(root) {
    const label = unitPositionText();
    if (!label) return;
    const panel = root.querySelector(".panel");
    if (!panel) return;
    let node = panel.querySelector(":scope > .bq-unit-position");
    if (!node) {
      node = document.createElement("p");
      node.className = "bq-unit-position";
      const cover = panel.querySelector(":scope > .bq-login-cover");
      const heading = panel.querySelector(":scope > .hero-title, :scope > h2");
      if (cover) cover.insertAdjacentElement("afterend", node);
      else if (heading) heading.insertAdjacentElement("beforebegin", node);
      else panel.prepend(node);
    }
    setText(node, label);
    setAttribute(node, "aria-label", `課程定位：${label}`);
  }

  function enhanceLogin(root) {
    const panel = root.querySelector(".panel");
    if (!panel) return;
    panel.classList.add("bq-login-panel");
    root.querySelectorAll(".owl-frame, .owl-reminder-card, .mentor-card").forEach((node) => node.classList.add("bq-login-unit-character"));

    if (!panel.querySelector(".bq-login-cover")) {
      const picture = document.createElement("picture");
      picture.className = "bq-login-cover";
      const wide = bodyPath("loginCoverWide", "../shared-assets/login/bioquest-login-cover-wide.webp");
      const mobile = bodyPath("loginCoverMobile", "../shared-assets/login/bioquest-login-cover-mobile.webp");
      picture.innerHTML = `<source media="(max-width: 760px)" srcset="${mobile}"><img src="${wide}" alt="生命祕境 BioQuest 探索入口">`;
      panel.prepend(picture);
    }

    const eyebrow = panel.querySelector(".eyebrow");
    const heading = panel.querySelector("h2");
    setText(eyebrow, "生命祕境 BioQuest");
    setText(heading, "歡迎進入生命祕境");
    const greeting = panel.querySelector(".story-panel");
    setHtml(greeting, "<strong>身份確認</strong><p>輸入學號後確認姓名，再開始本次探索任務。老師測試流程時可使用 guest。</p>");
  }

  function createFeedbackMentor(state) {
    const card = document.createElement("div");
    card.className = "story-panel bq-feedback-mentor";
    card.dataset.bioquestFeedbackMentor = "shared";
    card.innerHTML = `<div class="bq-feedback-mentor__visual"><img alt="阿澤老師任務回饋"></div><div class="bq-feedback-mentor__copy"><span>阿澤老師</span><strong></strong><p></p></div>`;
    updateFeedbackMentor(card, state);
    return card;
  }

  function updateFeedbackMentor(card, state) {
    const safeState = FEEDBACK_STATES.includes(state) ? state : "stable";
    const copy = FEEDBACK_COPY[safeState];
    card.classList.add("bq-feedback-mentor");
    setDataset(card, "bioquestFeedbackState", safeState);
    let visual = card.querySelector(".mentor-avatar, .bq-feedback-mentor__visual");
    if (!visual) {
      visual = document.createElement("div");
      visual.className = "bq-feedback-mentor__visual";
      visual.innerHTML = '<img alt="阿澤老師任務回饋">';
      card.prepend(visual);
    }
    const image = visual.querySelector("img");
    if (image) {
      setAttribute(image, "src", feedbackImage(safeState));
      setAttribute(image, "alt", `阿澤老師：${copy[0]}`);
      setAttribute(image, "loading", "eager");
    }
    let copyBox = card.querySelector(".mentor-copy, .bq-feedback-mentor__copy");
    if (!copyBox) {
      copyBox = document.createElement("div");
      copyBox.className = "bq-feedback-mentor__copy";
      copyBox.innerHTML = "<span>阿澤老師</span><strong></strong><p></p>";
      card.append(copyBox);
    }
    const label = copyBox.querySelector("span");
    const title = copyBox.querySelector("strong");
    const paragraph = copyBox.querySelector("p");
    setText(label, "阿澤老師");
    setText(title, copy[0]);
    setText(paragraph, copy[1]);
  }

  function enhanceReview(root) {
    const panel = root.querySelector(".panel");
    if (!panel) return;
    const explicit = root.querySelector("[data-feedback-state]")?.dataset.feedbackState
      || root.querySelector("[data-feedback-mentor-state]")?.dataset.feedbackMentorState;
    const state = FEEDBACK_STATES.includes(explicit) ? explicit : feedbackState(performanceFromPanel(panel));
    let mentor = root.querySelector(".feedback-mentor-card, .bq-feedback-mentor, .mentor-card");
    if (!mentor) {
      mentor = createFeedbackMentor(state);
      const heading = panel.querySelector("h2");
      if (heading) heading.insertAdjacentElement("afterend", mentor);
      else panel.prepend(mentor);
    } else updateFeedbackMentor(mentor, state);
    root.querySelectorAll(".owl-frame").forEach((owl) => owl.classList.add("bq-review-assistant-secondary"));
  }

  function enhanceReflection(root) {
    const panel = root.querySelector(".panel");
    const heading = panel?.querySelector("h2");
    if (!panel || !heading) return;
    root.querySelectorAll(".mentor-card, .feedback-mentor-card, .bq-feedback-mentor").forEach((mentor) => mentor.classList.add("bq-reflection-old-mentor"));
    root.querySelectorAll(".owl-frame, .owl-reminder-card").forEach((owl) => owl.classList.add("bq-reflection-old-owl"));
    if (!panel.querySelector(".bq-report-assistant")) {
      const reminder = document.createElement("div");
      reminder.className = "bq-report-assistant";
      reminder.innerHTML = `<img src="${bodyPath("reportOwlSrc", "../shared-assets/characters/owl-bioquest-report-reminder.webp")}" alt="貓頭鷹助理回報提醒"><div><span>貓頭鷹助理</span><strong>留下希望老師課堂再解釋的部分</strong><p>空白可以提交但沒有回報 EXP；請用自己的話寫下具體且與本單元相關的疑問。</p></div>`;
      heading.insertAdjacentElement("afterend", reminder);
    }
  }

  function createResultOwl() {
    const src = bodyPath("resultOwlSrc", "../shared-assets/assistants/owl-bioquest-result.webp");
    const frame = document.createElement("div");
    frame.className = "owl-frame bq-character--result";
    frame.dataset.bioquestResultOwl = "shared";
    frame.innerHTML = `<img class="bq-result-hero__image" src="${src}" alt="任務結算貓頭鷹助理">`;
    return frame;
  }

  function enhanceResult(root) {
    const panel = root.querySelector(".panel");
    const heading = panel?.querySelector("h2");
    if (!panel || !heading) return;
    let hero = panel.querySelector(":scope > .bq-result-hero");
    if (hero) return;
    let owl = root.querySelector(".owl-frame");
    if (!owl) owl = createResultOwl();
    const heroWrapper = document.createElement("div");
    heroWrapper.className = "bq-result-hero";
    heroWrapper.dataset.bioquestResultHero = "true";
    owl.classList.remove("bq-review-assistant-secondary", "bq-reflection-old-owl");
    owl.classList.add("bq-character--result");
    owl.querySelector("img")?.setAttribute("loading", "eager");
    heroWrapper.appendChild(owl);
    heading.insertAdjacentElement("afterend", heroWrapper);
  }

  function tagCharacterUse(root, screenName) {
    root.querySelectorAll(".owl-frame").forEach((owl) => {
      if (owl.closest(".bq-result-hero")) return owl.classList.add("bq-character--result");
      if (screenName === "scan") owl.classList.add("bq-character--prep");
      else if (screenName === "reflection") owl.classList.add("bq-character--report");
      else owl.classList.add("bq-character--inline");
    });
  }

  function enhanceAchievements(root) {
    const panels = [...root.querySelectorAll(".panel")];
    const unitPanel = panels.find((panel) => [...panel.querySelectorAll("h2, h3, .eyebrow")].some((heading) => heading.textContent.includes("本單元成就")))
      || panels.find((panel) => panel.querySelector(".badge-grid, .badge-wall") && !panel.matches("[data-bq-badge-overview]"));
    if (!unitPanel) return;
    ensureAchievementTitleAvatar(unitPanel);
    const overviewPanels = panels.filter((panel) => panel.matches("[data-bq-badge-overview]") || [...panel.querySelectorAll("h2, h3, .eyebrow")].some((heading) => heading.textContent.includes("全部任務徽章")));
    let overviewPanel = overviewPanels[0];
    if (!overviewPanel) {
      overviewPanel = document.createElement("div");
      overviewPanel.className = "panel";
    }
    overviewPanels.slice(1).forEach((panel) => panel.remove());
    unitPanel.insertAdjacentElement("afterend", overviewPanel);
    overviewPanel.dataset.bqBadgeOverview = "true";
    overviewPanel.classList.add("bq-all-unit-badge-overview");
    setHtml(overviewPanel, renderWholeBookBadgeOverview());
    unitPanel.querySelectorAll(".badge, .badge-card").forEach((card) => {
      if (card.querySelector("img, .bq-badge-asset-pending")) return;
      const pending = document.createElement("span");
      pending.className = "bq-badge-asset-pending";
      setText(pending, "徽章素材待補");
      card.prepend(pending);
    });
  }

  const TITLE_AVATAR_BASE_PATH = "../shared-assets/title-avatars";

  function titleAvatarGender(student = {}) {
    return /female|girl|女/.test(String(student.profile_gender || student.gender || student.title_avatar_variant || student.profile?.gender || "")) ? "female" : "male";
  }

  function titleProgressLevel(titleId) {
    const levels = global.BioQuestTitleProgress?.levels || [];
    return levels.find((item) => item.id === titleId) || levels[0] || { order: "01", id: "trainee_investigator", title: "見習調查員", need: 0 };
  }

  function titleInfoFromStudent(student = {}) {
    const progress = student.progress || student.student_progress || {};
    const totalExp = Number(progress.total_exp ?? student.total_exp ?? 0) || 0;
    const explicitTitleId = String(progress.current_title_id || student.current_title_id || "").trim();
    const level = explicitTitleId
      ? titleProgressLevel(explicitTitleId)
      : (global.BioQuestTitleProgress?.getTitleForExp?.(totalExp) || titleProgressLevel("trainee_investigator"));
    const title = progress.current_title || student.current_title || level.title || "見習調查員";
    const completed = Number(progress.completed_units ?? progress.completed_attempts ?? student.completed_units ?? student.completed_attempts ?? 0) || 0;
    return { level, title, totalExp, completed };
  }

  function normalizeBriefAvatarPath(rawPath, student = {}) {
    const value = String(rawPath || "").trim();
    if (value) {
      if (/^(https?:|data:|\/|\.\/|\.\.\/)/.test(value)) return value;
      if (value.startsWith("shared-assets/")) return `../${value}`;
      return value;
    }
    const gender = titleAvatarGender(student);
    const titleId = String(student.current_title_id || student.progress?.current_title_id || "trainee_investigator");
    const level = titleProgressLevel(titleId);
    return `${TITLE_AVATAR_BASE_PATH}/title-${level.order}-${level.id}-${gender}.webp`;
  }

  function normalizeTitleAvatarPath(rawPath, student = {}) {
    return normalizeBriefAvatarPath(rawPath, student);
  }

  function createAchievementTitleAvatarCard(student = readStoredStudent()) {
    const info = titleInfoFromStudent(student);
    const avatarPath = normalizeTitleAvatarPath(student.title_avatar_path || student.progress?.title_avatar_path || student.student_progress?.title_avatar_path, {
      ...student,
      current_title_id: student.current_title_id || student.progress?.current_title_id || info.level.id
    });
    const fallbackPath = `${TITLE_AVATAR_BASE_PATH}/title-01-trainee_investigator-${titleAvatarGender(student)}.webp`;
    const card = document.createElement("aside");
    card.className = "bq-title-avatar-card title-avatar-card achievements";
    card.dataset.bqTitleAvatarCard = "true";
    card.dataset.titleAvatarPath = avatarPath;
    setHtml(card, `
      <div class="bq-title-avatar-visual title-avatar-visual">
        <img src="${escapeHtml(avatarPath)}" alt="${escapeHtml(info.title)}稱號角色" loading="eager" onerror="this.onerror=null;this.src='${escapeHtml(fallbackPath)}';">
      </div>
      <div class="bq-title-avatar-copy">
        <span>目前稱號</span>
        <strong>${escapeHtml(info.title)}</strong>
        <p>${escapeHtml(String(info.totalExp))} EXP｜已完成 ${escapeHtml(String(info.completed))} 站</p>
      </div>
    `);
    return card;
  }

  function ensureAchievementTitleAvatar(unitPanel) {
    let card = unitPanel.querySelector(":scope > .bq-title-avatar-card, :scope > .title-avatar-card.achievements");
    const student = readStoredStudent();
    const rendered = createAchievementTitleAvatarCard(student);
    if (!card) {
      card = rendered;
      const heading = unitPanel.querySelector("h2, h3");
      if (heading) heading.insertAdjacentElement("afterend", card);
      else unitPanel.prepend(card);
      return;
    }
    card.classList.add("bq-title-avatar-card", "title-avatar-card", "achievements");
    setHtml(card, rendered.innerHTML);
    card.dataset.bqTitleAvatarCard = "true";
    card.dataset.titleAvatarPath = rendered.dataset.titleAvatarPath;
  }

  function readStoredStudent() {
    try {
      const unitId = document.body?.dataset?.unitId || "";
      if (unitId) {
        const parsedCurrent = JSON.parse(localStorage.getItem(`bioquest_${unitId}_state_v1`) || "null");
        if (parsedCurrent?.student) return parsedCurrent.student;
      }
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !/^bioquest_.*_state_v1$/.test(key)) continue;
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        if (parsed?.student) return parsed.student;
      }
    } catch {}
    return {};
  }

  function briefSceneImagePath(scene, root) {
    const data = scene.dataset || {};
    const rootData = root.querySelector("[data-briefing-scene-image], [data-brief-mentor-background-hook], [data-briefing-scene-hook], [data-asset-hook]")?.dataset || {};
    const existingImage = scene.querySelector("picture img, :scope > img:not(.bq-brief-student-avatar)");
    return data.briefingSceneHook
      || data.assetHook
      || data.briefingSceneImage
      || data.briefMentorBackgroundHook
      || rootData.briefingSceneImage
      || rootData.briefMentorBackgroundHook
      || rootData.briefingSceneHook
      || rootData.assetHook
      || existingImage?.getAttribute("src")
      || "";
  }

  function briefSceneMobilePath(scene) {
    return scene.dataset.mobileHook || scene.dataset.briefingSceneMobile || scene.dataset.briefingSceneMobileHook || "";
  }

  function resolveBriefAvatar(root) {
    const student = readStoredStudent();
    const holder = root.querySelector("[data-title-avatar-path], [data-student-character-hook]");
    const holderPath = holder?.dataset.titleAvatarPath || holder?.dataset.studentCharacterHook || "";
    const image = root.querySelector(".bq-brief-student-avatar, .student-avatar-slot img, .title-avatar-brief img, .brief-title-avatar-card img, .student-title-avatar img");
    const imagePath = image?.getAttribute("src") || "";
    return normalizeBriefAvatarPath(holderPath || imagePath || student.title_avatar_path || student.progress?.title_avatar_path, student);
  }

  function findBriefScene(root) {
    return root.querySelector(".brief-background-figure, .brief-scene-figure, .brief-scene, .microscope-brief-scene, [data-brief-scene]");
  }

  function ensureBriefSceneMedia(scene, imagePath, mobilePath) {
    let picture = scene.querySelector(":scope > .bq-brief-scene-media, :scope > picture");
    let image = picture?.querySelector("img") || scene.querySelector(":scope > img:not(.bq-brief-student-avatar)");
    if (!picture && !image && imagePath) {
      picture = document.createElement("picture");
      picture.className = "bq-brief-scene-media";
      if (mobilePath) {
        const source = document.createElement("source");
        source.media = "(max-width: 680px)";
        source.srcset = mobilePath;
        picture.appendChild(source);
      }
      image = document.createElement("img");
      image.alt = "任務簡報主視覺";
      image.loading = "eager";
      image.src = imagePath;
      picture.appendChild(image);
      scene.insertBefore(picture, scene.firstChild);
    } else if (picture) {
      picture.classList.add("bq-brief-scene-media");
      if (mobilePath && !picture.querySelector("source")) {
        const source = document.createElement("source");
        source.media = "(max-width: 680px)";
        source.srcset = mobilePath;
        picture.insertBefore(source, picture.firstChild);
      }
    }
    if (image) {
      image.classList.add("bq-brief-scene-image");
      if (imagePath && !image.getAttribute("src")) image.src = imagePath;
      image.loading = "eager";
      image.decoding = "async";
    }
  }

  function moveBriefCaptionBelow(scene) {
    const caption = scene.querySelector(":scope > figcaption, :scope > .scene-copy");
    if (!caption) return;
    caption.classList.add("bq-brief-scene-caption");
    if (caption.parentElement === scene) scene.insertAdjacentElement("afterend", caption);
  }

  function enhanceBriefScene(root) {
    const scene = findBriefScene(root);
    if (!scene) return;
    const imagePath = briefSceneImagePath(scene, root);
    const mobilePath = briefSceneMobilePath(scene);
    if (!imagePath && !scene.querySelector("picture img, :scope > img")) return;
    scene.classList.add("bq-brief-scene-stage");
    scene.closest(".brief-visual-row")?.classList.add("bq-brief-visual-row-enhanced");
    scene.closest(".brief-scene-card, .brief-hero")?.classList.add("bq-brief-card-enhanced");
    scene.closest(".microscope-briefing-layout")?.classList.add("bq-brief-card-enhanced");
    ensureBriefSceneMedia(scene, imagePath, mobilePath);
    moveBriefCaptionBelow(scene);

    const avatarPath = resolveBriefAvatar(root);
    let avatar = scene.querySelector(":scope > .bq-brief-student-avatar");
    if (!avatar) {
      avatar = document.createElement("img");
      avatar.className = "bq-brief-student-avatar";
      avatar.alt = "學生稱號角色";
      avatar.loading = "eager";
      avatar.decoding = "async";
      avatar.onerror = () => {
        avatar.onerror = null;
        avatar.src = `${TITLE_AVATAR_BASE_PATH}/title-01-trainee_investigator-male.webp`;
      };
      scene.appendChild(avatar);
    }
    setAttribute(avatar, "src", avatarPath);
    root.querySelectorAll(".student-avatar-slot, .brief-title-avatar-card, .title-avatar-brief").forEach((node) => {
      if (!node.contains(avatar)) node.classList.add("bq-brief-legacy-avatar");
    });
    root.querySelectorAll(".scene-copy, .brief-scene figcaption, .brief-background-figure figcaption").forEach((node) => node.classList.add("bq-brief-scene-caption"));
  }

  function enhance(options = {}) {
    const root = document.querySelector("#screen");
    if (!root) return;
    const screenName = activeScreen();
    const previous = enhancedGenerations.get(root);
    if (!options.force
      && previous?.screenName === screenName
      && previous?.firstElementChild === root.firstElementChild
      && previous?.childElementCount === root.childElementCount) return false;

    setDataset(root, "bioquestScreen", screenName);
    enhanceUnitPosition(root);
    if (screenName === "login") enhanceLogin(root);
    if (screenName === "brief") enhanceBriefScene(root);
    if (screenName === "review") enhanceReview(root);
    if (screenName === "reflection") enhanceReflection(root);
    if (screenName === "result") enhanceResult(root);
    if (screenName === "achievements") enhanceAchievements(root);
    tagCharacterUse(root, screenName);
    enhancedGenerations.set(root, {
      screenName,
      firstElementChild: root.firstElementChild,
      childElementCount: root.childElementCount
    });
    return true;
  }

  function observe() {
    enhanceBrandMark();
    const root = document.querySelector("#screen");
    if (!root) return;
    const options = { childList: true, subtree: true };
    let scheduled = false;
    let enhancing = false;
    let observer;

    function runEnhance() {
      scheduled = false;
      if (enhancing) return;
      enhancing = true;
      observer.disconnect();
      try {
        enhance({ force: true });
      } finally {
        enhancing = false;
        if (document.querySelector("#screen") === root) observer.observe(root, options);
      }
    }

    observer = new MutationObserver(() => {
      if (enhancing || scheduled) return;
      scheduled = true;
      queueMicrotask(runEnhance);
    });
    observer.observe(root, options);
    runEnhance();
  }

  function enableBackendAssetFallback() {
    document.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.webpFallbackTried === "true") return;
      const source = image.getAttribute("src") || "";
      if (!/\.(png|jpe?g)([?#].*)?$/i.test(source)) return;
      image.dataset.webpFallbackTried = "true";
      image.src = source.replace(/\.(png|jpe?g)(?=([?#].*)?$)/i, ".webp");
    }, true);
  }

  global.BioQuestCharacterLayout = Object.freeze({ enhance, feedbackState });
  global.BioQuestBadgeOverview = Object.freeze({
    version: BADGE_OVERVIEW_VERSION,
    renderHtml: renderWholeBookBadgeOverview
  });
  global.BioQuestLoginUX = Object.freeze({
    begin: beginLoginBusy,
    end: restoreLoginBusy,
    paint: waitForLoginPaint
  });
  enableBackendAssetFallback();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})(typeof window !== "undefined" ? window : globalThis);
