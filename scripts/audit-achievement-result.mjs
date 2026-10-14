#!/usr/bin/env node
// 跨站成就一致性 2a（結算頁）：把 simulate-achievement-progress.mjs 模擬出的後台回應
// （登入、startAttempt、submitAttempt）注入各站，實際作答到提交，檢查結算頁與提交後成就頁
// 顯示的本次 EXP、正式認列、EXP 明細、答對數、本次徽章、累積 EXP／稱號／頭像是否和後台一致。
// Apps Script 請求全部由 Playwright 攔截，不連正式後台。
//
// 作答一律全對、不用提示：結算頁應顯示「後台」的數字（模擬學生有錯題與提示），
// 若前端沿用本機計算值，就會和後台不一致而被抓到。
//
// 用法：
//   BIOQUEST_WORKSPACE=../bioquest-workspace node scripts/audit-achievement-result.mjs [--units=enzymes,photosynthesis,human_nutrition] [--shots=dir]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import { runSimulation, DEFAULT_UNITS, RETRY_EXP_SCENARIO, prototypeDirFor } from "./simulate-achievement-progress.mjs";
import { startServer, avatarFile, VIEWPORTS } from "./audit-achievement-injection.mjs";

// ---------- 各站作答流程（全對、無提示），取自各站 tests/qa-regression.test.js ----------
const DRIVERS = {
  async enzymes(page) {
    const choice = { q01: "promote_reaction", q02: "not_consumed", q04: "not_match", q05: "optimal_temperature", q06: "not_always_hotter", q07: "acidic", q08: "activity_lower", q10: "digest_specific", q11: "protease", q12: "not_only_breakdown", q13: "not_energy", q14: "different_conditions" };
    const click = (qid) => page.locator(`[data-choice="${qid}"][data-value="${choice[qid]}"]`).click();
    await page.locator("#briefNext").click();
    await page.locator("#scanNext").click();
    for (const qid of ["q01", "q02"]) await click(qid);
    for (const [item, value] of Object.entries({ amylase: "starch", protease: "protein", lipase: "lipid" })) await page.locator(`select[data-classify-question="q03"][data-classify-item="${item}"]`).selectOption(value);
    await click("q04");
    await page.locator("#checkSection").click();
    for (const qid of ["q05", "q06", "q07", "q08"]) await click(qid);
    await page.locator("#checkSection").click();
    for (const qid of ["q10", "q11", "q12", "q13", "q14"]) await click(qid);
    await page.locator("#checkSection").click();
    await page.locator("#reviewNext").click();
    await page.locator("#submitMission").click();
  },
  async photosynthesis(page) {
    const choice = { q01: "photosynthesis", q03: "chloroplast", q04: "energy_not_reactant", q06: "oxygen", q07: "green_cells", q08: "soil_water_minerals_food_made", q10: "light_starch", q11: "strong_light_more_bubbles", q13: "plants_respire_too", q14: "oxygen_product" };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    const map = (qid, answers) => Promise.all(Object.entries(answers).map(([item, value]) => page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value)));
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const qid of ["q01", "q03", "q04"]) await click(qid);
    await map("q02", { carbon_dioxide: "reactant", water: "reactant_and_product", light: "energy", glucose: "product", oxygen: "product" });
    await page.locator('[data-section-next="checkpoint1"]').click();
    await map("q05", { stomata: "gas_exchange", vein: "transport", chloroplast_in_leaf: "site" });
    for (const qid of ["q06", "q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const qid of ["q10", "q11", "q13", "q14"]) await click(qid);
    for (const id of ["light_time", "plant_type_size", "water_amount", "temperature"]) await page.locator(`[data-toggle-set="q12"][data-value="${id}"]`).click();
    await page.locator('[data-confirm-set="q12"]').click();
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async human_nutrition(page) {
    const choice = { q03: "glands", q05: "digestion", q07: "bile", q08: "protein", q09: "small_intestine", q10: "absorb", q11: "absorb_transport", q13: "small_intestine", q14: "different" };
    const maps = {
      q01: { mouth: "tract", esophagus: "tract", stomach: "tract", small_intestine: "tract", large_intestine: "tract", salivary_gland: "gland", gastric_gland: "gland", intestinal_gland: "gland", liver: "gland", pancreas: "gland" },
      q04: { mouth: "chew", esophagus: "push", stomach: "mix", small_intestine: "absorb_nutrients", large_intestine: "absorb_water" },
      q06: { amylase: "starch", protease: "protein", lipase: "lipid" },
      q12: { starch_break: "digestion", enter_wall: "absorption", protein_break: "digestion", enter_blood: "absorption" },
    };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    // 每次 change 都會重繪，逐一選取
    const map = async (qid) => { for (const [item, value] of Object.entries(maps[qid])) await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value); };
    // 排序題：用「上移」按鈕把每個位置換成正確項目（每次點擊都會重繪）
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    await map("q01");
    await sequence("q02", ["mouth", "esophagus", "stomach", "small_intestine", "large_intestine", "anus"]);
    await click("q03");
    await map("q04");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    await click("q05");
    await map("q06");
    for (const qid of ["q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    for (const qid of ["q09", "q10", "q11"]) await click(qid);
    await map("q12");
    for (const qid of ["q13", "q14"]) await click(qid);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
  async plant_transport_structures(page) {
    const choice = { q01: "transport_structure", q02: "root_hair_absorption", q03: "continuous_vascular_bundle_system", q04: "vascular_bundle", q06: "xylem", q07: "phloem", q08: "veins_contain_vascular_bundle", q10: "transpiration_linked_to_upward_transport", q11: "material_transport", q13: "roots_water_minerals_leaves_nutrients_phloem", q14: "xylem_water_minerals_phloem_nutrients" };
    const click = (qid) => page.locator(`[data-answer="${qid}"][data-value="${choice[qid]}"]`).click();
    const sequence = async (qid, order) => {
      for (let i = 0; i < order.length; i += 1) {
        for (;;) {
          const now = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((els) => els.map((el) => el.dataset.sequenceItem));
          if (now.indexOf(order[i]) <= i) break;
          await page.locator(`[data-move="${qid}"][data-item="${order[i]}"][data-dir="-1"]`).click();
        }
      }
    };
    await page.locator('[data-next="scan"]').click();
    await page.locator('[data-next="checkpoint1"]').click();
    for (const qid of ["q01", "q02", "q03", "q04"]) await click(qid);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint2']");
    for (const [item, value] of Object.entries({ xylem: "water_and_minerals", phloem: "photosynthetic_nutrients" })) await page.locator(`select[data-map-question="q05"][data-map-item="${item}"]`).selectOption(value);
    for (const qid of ["q06", "q07", "q08"]) await click(qid);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
    await sequence("q09", ["soil_contact", "root_hair_absorption", "xylem_upward_transport", "water_reaches_leaf", "transpiration_from_stoma"]);
    for (const qid of ["q10", "q11", "q13", "q14"]) await click(qid);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").click();
  },
};

// ---------- 各站結算頁讀值：統一成 { attemptExp, creditedExp, ledger, correct, total } ----------
// 讀不到的欄位留 null（代表該站結算頁沒有顯示，不算錯）。
const READERS = {
  enzymes: () => {
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const ledger = text.match(/完成 (\d+)｜直接答對 (\d+)｜提示後修正 (\d+)｜回報 (\d+)｜精熟 (\d+)｜再挑戰 (\d+)/);
    return {
      attemptExp: num(/本次取得 ?(\d+) EXP/),
      creditedExp: num(/本單元正式認列 ?(\d+) EXP/),
      ledger: ledger ? { completion: +ledger[1], direct: +ledger[2], revision: +ledger[3], reflection: +ledger[4], mastery: +ledger[5], retry: +ledger[6] } : null,
      ledgerTotal: null,
      correct: num(/答對 ?(\d+)\/\d+/),
      total: num(/答對 ?\d+\/(\d+)/),
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
    };
  },
  photosynthesis: () => {
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: rows["總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
    };
  },
  human_nutrition: () => {
    // 結算頁版面與第 14 站相同（ledger-grid）；本次徽章沒有 data-badge-id，改用徽章名稱對回 id
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__human_nutritionTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: rows["總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
  plant_transport_structures: () => {
    // 結算頁 ledger-grid；明細最後兩列是「正式認列總計」「正式認列／累積增量」，標示為正式認列，不當作本次總計比對
    const text = document.querySelector("#screen").textContent.replace(/\s+/g, " ");
    const num = (re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
    const rows = Object.fromEntries([...document.querySelectorAll("#screen .ledger-grid article")].map((a) => [a.querySelector("span").textContent.trim(), Number(a.querySelector("strong").textContent)]));
    const byName = Object.fromEntries((window.__plant_transport_structuresTest?.badges || []).map((b) => [b.name, b.id]));
    const cards = [...document.querySelectorAll("#screen .badge-wall .badge.earned")];
    return {
      attemptExp: num(/本次取得：(\d+)/),
      creditedExp: num(/本單元正式認列：(\d+) EXP/),
      ledger: { completion: rows["完成任務"], direct: rows["直接答對"], revision: rows["提示後修正"], reflection: rows["回報 EXP"], mastery: rows["精熟 EXP"], retry: rows["再挑戰補分"] },
      ledgerTotal: null,
      officialTotal: rows["正式認列總計"] ?? null,
      correct: null,
      total: null,
      verifiedNotice: /後台已回傳正式認列資料/.test(text),
      badges: cards.map((el) => byName[el.querySelector("strong")?.textContent.trim()] || `?${el.querySelector("strong")?.textContent.trim()}`),
      badgeImagesBroken: cards.filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => byName[el.querySelector("strong")?.textContent.trim()] || "?"),
    };
  },
};

export const RESULT_UNITS = Object.keys(DRIVERS);

function expectedFromSubmit(res) {
  const v = res.verified_attempt;
  return {
    attemptExp: Math.min(500, v.attempt_total_exp),
    creditedExp: res.unit_credited_exp,
    ledger: { completion: v.completion_exp, direct: v.concept_exp, revision: v.revision_exp, reflection: v.question_exp, mastery: v.mastery_exp, retry: v.retry_exp },
    correct: v.correct,
    total: v.total_questions,
    badges: v.badges || [],
  };
}

const LEDGER_LABELS = { completion: "完成", direct: "直接答對", revision: "提示後修正", reflection: "回報", mastery: "精熟", retry: "再挑戰補分" };

async function auditStep(browser, baseUrl, step, viewport, shotsDir, mutateSubmit) {
  const where = `${step.unit_id}#${step.scenario}${step.step}@${viewport.width}`;
  const failures = [];
  const notes = [];
  const fail = (message) => failures.push({ where, message });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const imageErrors = [];
  const actions = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => { if (msg.type() === "error" && !/Failed to load resource/.test(msg.text())) pageErrors.push(`console: ${msg.text()}`); });
  page.on("response", (res) => { if (res.request().resourceType() === "image" && res.status() >= 400) imageErrors.push(new URL(res.url()).pathname); });
  page.on("dialog", (dialog) => dialog.accept());
  const submitBody = mutateSubmit(structuredClone(step.submit_response));
  await page.route("**/macros/s/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let action = url.searchParams.get("action") || "";
    if (!action) { try { action = JSON.parse(request.postData() || "{}").action || ""; } catch { action = ""; } }
    actions.push(action);
    const body = action === "getStudentAndAttemptStatus" ? step.login_response_before
      : action === "startAttempt" ? step.start_response
        : action === "submitAttempt" ? submitBody
          : action === "hintEvent" ? { ok: true }
            : { ok: false, error: "blocked_in_audit" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  try {
    await page.goto(`${baseUrl}/${prototypeDirFor(step.unit_id)}/index.html`, { waitUntil: "domcontentloaded" });
    const input = page.locator("#studentIdInput, #studentId").first();
    await input.waitFor({ timeout: 8000 });
    await input.fill(step.login_response_before.student.student_id);
    await page.locator("#loginButton, #loginBtn").first().click();
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief", null, { timeout: 8000 });
    await DRIVERS[step.unit_id](page);
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result", null, { timeout: 10000 });
    if (!actions.includes("submitAttempt")) fail("提交時沒有呼叫後台 submitAttempt");
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("#screen img")) img.loading = "eager";
      await Promise.all([...document.querySelectorAll("#screen img")].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); }))));
    });
    // 部分站用 smooth 捲動回頁首：最多等 2.5 秒讓捲動停下再量
    await page.waitForFunction(() => Math.round(scrollY + (document.querySelector("#screen")?.scrollTop || 0)) <= 2, null, { timeout: 2500 }).catch(() => {});
    const shown = await page.evaluate(READERS[step.unit_id]);
    const dom = await page.evaluate(() => ({
      badges: [...document.querySelectorAll("#screen [data-result-earned-badges] [data-badge-id]")].map((el) => el.dataset.badgeId),
      badgeImagesBroken: [...document.querySelectorAll("#screen [data-result-earned-badges] [data-badge-id]")].filter((el) => { const img = el.querySelector("img"); return !img || !(img.complete && img.naturalWidth > 0); }).map((el) => el.dataset.badgeId),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollY: Math.round(scrollY + (document.querySelector("#screen")?.scrollTop || 0)),
    }));
    // 沒有 data-badge-id 的站由 READERS 自行回報本次徽章
    if (shown.badges) { dom.badges = shown.badges; dom.badgeImagesBroken = shown.badgeImagesBroken || []; }
    // 預期值一律取模擬後台的原始回應（mutateSubmit 只竄改注入頁面的資料，供自我驗證）
    const want = expectedFromSubmit(step.submit_response);
    if (!shown.verifiedNotice) fail("結算頁沒有顯示「後台已回傳正式認列資料」");
    if (shown.attemptExp !== want.attemptExp) fail(`本次取得顯示 ${shown.attemptExp ?? "（無）"} EXP，後台 attempt_total_exp=${want.attemptExp}`);
    if (shown.creditedExp !== want.creditedExp) fail(`本單元正式認列顯示 ${shown.creditedExp ?? "（無）"} EXP，後台 unit_credited_exp=${want.creditedExp}`);
    if (!shown.ledger) fail("結算頁沒有 EXP 明細");
    else for (const key of Object.keys(want.ledger)) {
      if (shown.ledger[key] !== want.ledger[key]) fail(`EXP 明細「${LEDGER_LABELS[key]}」顯示 ${shown.ledger[key] ?? "（無）"}，後台 ${want.ledger[key]}`);
    }
    if (shown.ledgerTotal != null && shown.ledgerTotal !== want.attemptExp) {
      notes.push({ where, message: `EXP 明細「總計」顯示 ${shown.ledgerTotal}（= 本單元正式認列），但各項加總是本次 ${want.attemptExp}；退步再挑戰時兩者不同，容易誤讀` });
    }
    if (shown.officialTotal != null && shown.officialTotal !== want.creditedExp) fail(`EXP 明細「正式認列總計」顯示 ${shown.officialTotal}，後台 unit_credited_exp=${want.creditedExp}`);
    if (shown.correct != null && shown.correct !== want.correct) fail(`答對顯示 ${shown.correct}，後台 correct=${want.correct}`);
    if (shown.total != null && shown.total !== want.total) fail(`題數顯示 ${shown.total}，後台 total_questions=${want.total}`);
    const missing = want.badges.filter((b) => !dom.badges.includes(b));
    const extra = dom.badges.filter((b) => !want.badges.includes(b));
    if (missing.length) fail(`本次徽章少顯示 ${missing.length} 枚：${missing.join(", ")}`);
    if (extra.length) fail(`本次徽章多顯示 ${extra.length} 枚（後台沒給）：${extra.join(", ")}`);
    if (dom.badgeImagesBroken.length) fail(`本次徽章圖片未載入：${dom.badgeImagesBroken.join(", ")}`);
    if (dom.overflow) fail("結算頁有橫向捲動");
    if (dom.scrollY > 2) fail(`結算頁沒有回到頁首（捲動 ${dom.scrollY}px）`);
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${where.replace(/[#@]/g, "-")}-result.png`), fullPage: true });

    // 提交後成就頁：累積 EXP、完成站數、稱號、頭像、本站總覽格
    const nav = page.locator("[data-nav='achievements']");
    if (await nav.isDisabled()) fail("提交後成就頁仍鎖住");
    else {
      await nav.click();
      await page.waitForSelector("[data-bq-badge-overview]", { timeout: 8000 });
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll("#screen img")) img.loading = "eager";
        await Promise.all([...document.querySelectorAll("#screen img")].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); }))));
      });
      const ach = await page.evaluate((unitId) => {
        const screen = document.querySelector("#screen");
        const avatar = screen.querySelector(".bq-title-avatar-card img, .title-avatar-card.achievements img");
        const box = screen.querySelector(`.bq-unit-badge-summary[data-unit-id="${unitId}"]`);
        return {
          text: screen.textContent.replace(/\s+/g, " "),
          avatarSrc: avatar ? (avatar.currentSrc || avatar.src) : "",
          boxCount: box?.querySelector(".bq-unit-badge-summary__head span")?.textContent.trim() || "",
          boxThumbs: box ? box.querySelectorAll("img.bq-unit-badge-thumb").length : -1,
          boxLoaded: box ? [...box.querySelectorAll("img.bq-unit-badge-thumb")].filter((img) => !img.hidden && img.naturalWidth > 0).length : -1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      }, step.unit_id);
      const sp = step.submit_response.student_progress;
      if (!ach.text.includes(`${sp.total_exp} EXP`)) fail(`提交後成就頁沒有顯示累積 ${sp.total_exp} EXP`);
      if (!ach.text.includes(`已完成 ${sp.completed_unit_count} 站`)) fail(`提交後成就頁沒有顯示「已完成 ${sp.completed_unit_count} 站」`);
      if (!ach.text.includes(sp.current_title)) fail(`提交後成就頁沒有顯示稱號「${sp.current_title}」`);
      const wantAvatar = avatarFile(sp.title_avatar_path);
      if (avatarFile(ach.avatarSrc) !== wantAvatar) fail(`提交後稱號頭像=${avatarFile(ach.avatarSrc) || "（無）"}，後台 ${wantAvatar}`);
      const unit = JSON.parse(sp.unit_badge_summary_json || "[]").find((u) => u.unit_id === step.unit_id);
      if (!unit) fail("後台 unit_badge_summary_json 沒有本站");
      else {
        if (!ach.boxCount.startsWith(`${unit.earned_count}/`)) fail(`提交後總覽本站顯示 ${ach.boxCount || "（無）"}，後台 earned_count=${unit.earned_count}`);
        if (ach.boxThumbs !== unit.earned_count) fail(`提交後總覽本站縮圖 ${ach.boxThumbs} 張，後台 earned_count=${unit.earned_count}（可顯示圖片 ${unit.earned_badges.length} 枚）`);
        else if (ach.boxLoaded !== ach.boxThumbs) fail(`提交後總覽本站有 ${ach.boxThumbs - ach.boxLoaded} 張縮圖未載入`);
      }
      if (ach.overflow) fail("提交後成就頁有橫向捲動");
      if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${where.replace(/[#@]/g, "-")}-achievements.png`), fullPage: true });
    }
    if (pageErrors.length) fail(`頁面錯誤：${pageErrors.slice(0, 3).join(" / ")}`);
    if (imageErrors.length) fail(`圖片 404：${[...new Set(imageErrors)].slice(0, 4).join(", ")}`);
    const unexpected = actions.filter((a) => !["getStudentAndAttemptStatus", "startAttempt", "submitAttempt", "hintEvent"].includes(a));
    if (unexpected.length) fail(`呼叫了預期外的後台動作：${[...new Set(unexpected)].join(", ")}`);
  } catch (error) {
    const screen = await page.evaluate(() => document.querySelector("#screen")?.dataset.bioquestScreen || "").catch(() => "");
    fail(`流程中斷（畫面 ${screen || "?"}）：${error.message.split("\n")[0]}`);
  } finally {
    await context.close();
  }
  return { failures, notes };
}

// scenarios：main = 一般三次情境（首次有錯與提示、再挑戰全對、再挑戰退步），retry = 再挑戰有 retry_exp。
export async function runResultAudit({ units = RESULT_UNITS, viewports = VIEWPORTS, retryViewports = [VIEWPORTS[0]], scenarios = ["main", "retry"], shotsDir = "", mutateSubmit = (r) => r } = {}) {
  const unknown = units.filter((u) => !DRIVERS[u]);
  if (unknown.length) throw new Error(`這些站還沒有作答流程：${unknown.join(", ")}`);
  const plans = [];
  if (scenarios.includes("main")) {
    // 模擬第 1–15 站（加上要檢查的後續站）完整累積，取目標站的步驟（登入前已有前面各站的進度）
    const sim = runSimulation({ units: [...DEFAULT_UNITS, ...units.filter((u) => !DEFAULT_UNITS.includes(u))] });
    if (sim.skipped) return sim;
    for (const s of sim.steps.filter((x) => units.includes(x.unit_id))) plans.push({ step: { ...s, scenario: "" }, viewports });
  }
  if (scenarios.includes("retry")) {
    const sim = runSimulation({ units, scenario: RETRY_EXP_SCENARIO });
    if (sim.skipped) return sim;
    for (const s of sim.steps) plans.push({ step: { ...s, scenario: "r" }, viewports: retryViewports });
  }
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  const { server, port } = await startServer();
  const browser = await playwright.chromium.launch({ headless: true, ...(process.env.BIOQUEST_CHROME_PATH ? { executablePath: process.env.BIOQUEST_CHROME_PATH } : {}) });
  const failures = [];
  const notes = [];
  const checked = [];
  try {
    for (const { step, viewports: vps } of plans) {
      for (const viewport of vps) {
        const out = await auditStep(browser, `http://127.0.0.1:${port}`, step, viewport, shotsDir, mutateSubmit);
        failures.push(...out.failures);
        notes.push(...out.notes);
        checked.push({ where: `${step.unit_id}#${step.scenario}${step.step}@${viewport.width}`, label: step.label, retry_exp: step.submit_response.verified_attempt.retry_exp });
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { skipped: false, units, checked, failures, notes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
  const result = await runResultAudit({ units: args.units ? args.units.split(",") : RESULT_UNITS, shotsDir: args.shots || "" });
  if (result.skipped) { console.log(`略過：${result.reason}`); process.exit(0); }
  console.log(`檢查 ${result.checked.length} 次提交（站 × 情境 × 視窗）`);
  result.checked.forEach((c) => console.log(`  ${c.where}  ${c.label}  retry_exp=${c.retry_exp}`));
  result.notes.forEach((n) => console.log(`備註 [${n.where}] ${n.message}`));
  if (!result.failures.length) { console.log("結算頁與提交後成就頁顯示和後台模擬全部一致"); process.exit(0); }
  console.log(`\n不一致 ${result.failures.length} 項：`);
  result.failures.forEach((f) => console.log(`- [${f.where}] ${f.message}`));
  process.exit(1);
}
