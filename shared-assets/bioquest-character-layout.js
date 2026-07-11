(function initBioQuestCharacterLayout(global) {
  function activeScreen() {
    return document.querySelector("[data-nav].active")?.dataset.nav || "";
  }

  function createFeedbackMentor(root, panel) {
    const src = document.body.dataset.feedbackMentorSrc || "";
    if (!src) return null;
    const card = document.createElement("div");
    card.className = "story-panel bq-feedback-mentor";
    card.dataset.bioquestFeedbackMentor = "fallback";
    card.innerHTML = `<div class="bq-feedback-mentor__visual"><img src="${src}" alt="阿澤老師概念回饋"></div><div class="bq-feedback-mentor__copy"><span>阿澤老師</span><strong>任務概念回饋</strong><p>請先整理目前穩定的概念與仍需釐清的判斷線索，再留下想帶到課堂討論的問題。</p></div>`;
    const heading = panel.querySelector("h2");
    if (heading) heading.insertAdjacentElement("afterend", card);
    else panel.prepend(card);
    return card;
  }

  function enhanceReview(root) {
    if (root.dataset.bioquestCharacterScreen === "review") return;
    const panel = root.querySelector(".panel");
    if (!panel) return;
    const mentor = root.querySelector(".feedback-mentor-card, .mentor-card") || createFeedbackMentor(root, panel);
    if (mentor) {
      mentor.classList.add("bq-feedback-mentor");
      mentor.dataset.bioquestFeedbackMentor = mentor.dataset.bioquestFeedbackMentor || "existing";
      mentor.querySelector("img")?.setAttribute("loading", "eager");
    }
    root.querySelectorAll(".owl-frame").forEach((owl) => owl.classList.add("bq-review-assistant-secondary"));
    root.dataset.bioquestCharacterScreen = "review";
  }

  function createResultOwl() {
    const src = document.body.dataset.resultOwlSrc || "";
    if (!src) return null;
    const frame = document.createElement("div");
    frame.className = "owl-frame";
    frame.dataset.bioquestResultOwl = "fallback";
    frame.innerHTML = `<img class="bq-result-hero__image" src="${src}" alt="任務結算貓頭鷹助理">`;
    return frame;
  }

  function enhanceResult(root) {
    if (root.dataset.bioquestCharacterScreen === "result") return;
    const panel = root.querySelector(".panel");
    const heading = panel?.querySelector("h2");
    if (!panel || !heading) return;
    let owl = root.querySelector(".owl-frame");
    if (!owl) owl = createResultOwl();
    if (!owl) return;
    const hero = document.createElement("div");
    hero.className = "bq-result-hero";
    hero.dataset.bioquestResultHero = "true";
    owl.classList.remove("bq-review-assistant-secondary");
    owl.querySelector("img")?.setAttribute("loading", "eager");
    hero.appendChild(owl);
    heading.insertAdjacentElement("afterend", hero);
    root.dataset.bioquestCharacterScreen = "result";
  }

  function enhance() {
    const root = document.querySelector("#screen");
    if (!root) return;
    const screenName = activeScreen();
    if (screenName === "review") enhanceReview(root);
    if (screenName === "result") enhanceResult(root);
  }

  function observe() {
    const root = document.querySelector("#screen");
    if (!root) return;
    new MutationObserver(enhance).observe(root, { childList: true });
    enhance();
  }

  global.BioQuestCharacterLayout = Object.freeze({ enhance });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})(typeof window !== "undefined" ? window : globalThis);
