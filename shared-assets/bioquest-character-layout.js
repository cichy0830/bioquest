(function initBioQuestCharacterLayout(global) {
  const FEEDBACK_STATES = ["excellent", "strong", "stable", "needs_review", "retry_ready"];
  const FEEDBACK_COPY = {
    excellent: ["零提示精熟", "你已能穩定掌握本單元重點，接下來可以練習把判斷證據清楚說給同學聽。"],
    strong: ["概念掌握良好", "大部分判斷已經穩定，請把少數仍想確認的線索帶到課堂討論。"],
    stable: ["基礎概念穩定", "你已完成任務，接下來請整理最有把握的證據與仍會混淆的情境。"],
    needs_review: ["建議回看概念", "有幾個概念需要再釐清，請閱讀下方建議，再用自己的話留下問題。"],
    retry_ready: ["整理後再挑戰", "先保留這次找到的線索，重新整理後再登入挑戰，會更容易看見自己的進步。"]
  };

  function activeScreen() {
    return document.querySelector("[data-nav].active")?.dataset.nav || "";
  }

  function bodyPath(name, fallback) {
    return document.body?.dataset?.[name] || fallback;
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
    return `${directory}/mentor-feedback-${state}.webp`;
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
    if (eyebrow) eyebrow.textContent = "生命祕境 BioQuest";
    if (heading) heading.textContent = "歡迎進入生命祕境";
    const greeting = panel.querySelector(".story-panel");
    if (greeting) greeting.innerHTML = "<strong>身份確認</strong><p>輸入學號後確認姓名，再開始本次探索任務。老師測試流程時可使用 guest。</p>";
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
    card.dataset.bioquestFeedbackState = safeState;
    let visual = card.querySelector(".mentor-avatar, .bq-feedback-mentor__visual");
    if (!visual) {
      visual = document.createElement("div");
      visual.className = "bq-feedback-mentor__visual";
      visual.innerHTML = '<img alt="阿澤老師任務回饋">';
      card.prepend(visual);
    }
    const image = visual.querySelector("img");
    if (image) {
      image.src = feedbackImage(safeState);
      image.alt = `阿澤老師：${copy[0]}`;
      image.loading = "eager";
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
    if (label) label.textContent = "阿澤老師";
    if (title) title.textContent = copy[0];
    if (paragraph) paragraph.textContent = copy[1];
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
      reminder.innerHTML = `<img src="${bodyPath("reportOwlSrc", "../shared-assets/assistants/owl-bioquest-report-reminder.webp")}" alt="貓頭鷹助理回報提醒"><div><span>貓頭鷹助理</span><strong>留下希望老師課堂再解釋的部分</strong><p>空白可以提交但沒有回報 EXP；請用自己的話寫下具體且與本單元相關的疑問。</p></div>`;
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
    const unitPanel = panels.find((panel) => [...panel.querySelectorAll("h2, h3, .eyebrow")].some((heading) => heading.textContent.includes("本單元成就")));
    if (!unitPanel) return;
    unitPanel.querySelectorAll(".badge, .badge-card").forEach((card) => {
      if (card.querySelector("img, .bq-badge-asset-pending")) return;
      const pending = document.createElement("span");
      pending.className = "bq-badge-asset-pending";
      pending.textContent = "徽章素材待補";
      card.prepend(pending);
    });
  }

  function enhance() {
    const root = document.querySelector("#screen");
    if (!root) return;
    const screenName = activeScreen();
    root.dataset.bioquestScreen = screenName;
    if (screenName === "login") enhanceLogin(root);
    if (screenName === "review") enhanceReview(root);
    if (screenName === "reflection") enhanceReflection(root);
    if (screenName === "result") enhanceResult(root);
    if (screenName === "achievements") enhanceAchievements(root);
    tagCharacterUse(root, screenName);
  }

  function observe() {
    const root = document.querySelector("#screen");
    if (!root) return;
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        enhance();
      });
    }).observe(root, { childList: true, subtree: true });
    enhance();
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
  enableBackendAssetFallback();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})(typeof window !== "undefined" ? window : globalThis);
