#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-asexual-reproduction")
  : sourceRoot;
const CACHE_VERSION = "20260813-asexual-reproduction-mapping-v1";
const QUESTION_VERSION = "20260718-asexual-reproduction-v1";
const Q = (n) => `asexual_reproduction_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function forceScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 640);
    document.documentElement.scrollTop = 640;
    document.body.scrollTop = 640;
    const stage = document.querySelector(".main-stage");
    if (stage) stage.scrollTop = 640;
  });
}

async function expectAtTop(page, label) {
  await page.waitForTimeout(80);
  const scrolls = await page.evaluate(() => ({
    windowY: window.scrollY,
    documentY: document.documentElement.scrollTop,
    bodyY: document.body.scrollTop,
    stageY: document.querySelector(".main-stage")?.scrollTop || 0
  }));
  for (const [key, value] of Object.entries(scrolls)) {
    assert(value <= 2, `${label} should reset ${key} to top, got ${value}`);
  }
}

async function clickAndExpectTop(page, selector, screenName) {
  await forceScroll(page);
  await page.locator(selector).click();
  await page.waitForFunction((target) => document.querySelector("#screen")?.dataset.bioquestScreen === target, screenName);
  await expectAtTop(page, `${screenName} transition`);
}

async function expectEvidenceFigure(page, evidenceId, forbiddenTerms) {
  const locator = page.locator(`[data-evidence-id="${evidenceId}"]`);
  await locator.waitFor();
  await locator.scrollIntoViewIfNeeded();
  await page.waitForFunction((id) => {
    const image = document.querySelector(`[data-evidence-id="${id}"] img[data-evidence-image]`);
    return Boolean(image && image.naturalWidth > 0 && image.naturalHeight > 0);
  }, evidenceId);
  const info = await locator.evaluate((element) => {
    const image = element.querySelector("img[data-evidence-image]");
    const frame = element.querySelector(".u28-evidence-frame");
    const overlay = element.querySelector(".u28-evidence-overlay");
    const table = element.querySelector(".u28-evidence-table");
    const cards = element.querySelector(".u28-evidence-cards");
    const frameRect = frame?.getBoundingClientRect();
    return {
      imageCount: element.querySelectorAll("img[data-evidence-image]").length,
      currentSrc: image?.currentSrc || image?.src || "",
      naturalWidth: image?.naturalWidth || 0,
      naturalHeight: image?.naturalHeight || 0,
      alt: image?.getAttribute("alt") || "",
      figcaption: element.querySelector("figcaption")?.textContent || "",
      note: element.querySelector(".u28-evidence-note")?.textContent || "",
      overlayText: overlay?.textContent || "",
      tableVisible: table ? getComputedStyle(table).display !== "none" : false,
      cardsVisible: cards ? getComputedStyle(cards).display !== "none" : false,
      frameWidth: frameRect?.width || 0,
      viewportWidth: innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  assert.equal(info.imageCount, 1, `${evidenceId} should render exactly one evidence image`);
  assert(info.currentSrc.includes("?v="), `${evidenceId} image should include cache bust`);
  assert(info.naturalWidth > 0 && info.naturalHeight > 0, `${evidenceId} image should load`);
  assert(info.frameWidth <= info.viewportWidth + 1, `${evidenceId} should not overflow viewport`);
  assert(info.scrollWidth <= info.viewportWidth + 1, `${evidenceId} should not cause page horizontal overflow`);
  for (const forbidden of forbiddenTerms) {
    const visibleBoundaryText = `${info.alt} ${info.figcaption} ${info.note}`;
    assert(!visibleBoundaryText.includes(forbidden), `${evidenceId} caption/alt should not leak ${forbidden}`);
  }
  if (evidenceId === "q12-cutting-materials") {
    assert(info.overlayText.includes("繁殖材料來源"), "q12 data overlay should render comparison columns");
    assert(info.overlayText.includes("新株 C"), "q12 data overlay should render all formal rows");
    if (info.viewportWidth <= 520) {
      assert.equal(info.cardsVisible, true, "q12 mobile should use stacked cards");
      assert.equal(info.tableVisible, false, "q12 mobile should hide dense table");
    } else {
      assert.equal(info.tableVisible, true, "q12 desktop should show data table overlay");
    }
  }
}

async function installBackendStub(page, mode) {
  await page.addInitScript(({ mode, QUESTION_VERSION }) => {
    window.__backendActions = [];
    window.fetch = async (url, init = {}) => {
      const action = init.body ? JSON.parse(init.body).action : new URL(url).searchParams.get("action");
      window.__backendActions.push(action);
      if (action === "getStudentAndAttemptStatus") {
        return { ok: true, json: async () => ({
          ok: true,
          student: {
            student_id: "S99999",
            student_name: mode === "pending" ? "待確認學生" : "已驗證學生",
            class_name: "701",
            seat_no: "99",
            profile_gender: "male"
          },
          student_progress: {
            total_exp: 1500,
            current_title_id: "ecology_recorder",
            current_title: "生態記錄員",
            title_avatar_path: "../shared-assets/title-avatars/title-03-ecology_recorder-male.webp",
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      if (action === "startAttempt") {
        return { ok: true, json: async () => ({
          ok: true,
          verification_mode: "server_verified",
          question_version: QUESTION_VERSION,
          attempt_id: `u28_${mode}_attempt`,
          attempt_session_token: `u28_${mode}_token`,
          attempt_session_id: `u28_${mode}_session`,
          previous_attempt_id: ""
        }) };
      }
      if (action === "hintEvent") return { ok: true, json: async () => ({ ok: true }) };
      if (action === "submitAttempt" && mode === "verified") {
        return { ok: true, json: async () => ({
          ok: true,
          verified_attempt: {
            verification_status: "server_verified",
            correct_count: 14,
            total_questions: 14,
            accuracy: 1,
            hint_used_count: 0,
            completion_exp: 100,
            direct_exp: 220,
            revision_exp: 0,
            reflection_exp: 0,
            mastery_exp: 140,
            retry_exp: 0,
            attempt_exp: 460,
            unit_credited_exp: 460,
            credited_delta: 460,
            earned_badges: ["asexual_reproduction_entry"]
          },
          student_progress: {
            total_exp: 1960,
            current_title_id: "ecology_recorder",
            current_title: "生態記錄員",
            title_avatar_path: "../shared-assets/title-avatars/title-03-ecology_recorder-male.webp",
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, QUESTION_VERSION });
}

async function completeQuestions(page) {
  assert(await page.locator(".scene-copy").textContent().then((text) => text.includes("你好")), "brief should show identity confirmation");
  await clickAndExpectTop(page, '[data-next="scan"]', "scan");
  await page.locator(".prep-owl-hero").waitFor();
  assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
  await clickAndExpectTop(page, '[data-next="checkpoint1"]', "checkpoint1");
  await answerChoice(page, Q(1), "asexual_no_sperm_egg_fusion");
  await answerChoice(page, Q(2), "single_parent_part_forms_new_individual");
  await answerChoice(page, Q(3), "offspring_usually_genetically_similar");
  await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', "checkpoint2");
  const q04Labels = await page.locator(`[data-question-id="${Q(4)}"] .mapping-row span`).allTextContents();
  assert.notDeepEqual(q04Labels.slice(0, 2), ["單細胞生物一分為二形成新個體", "水螅身體側邊長出小芽"], "q04 should not keep canonical grouped order");
  await answerMapping(page, Q(4), { amoeba_split: "binary_fission", hydra_bud: "budding", body_fragment: "fragmentation", mold_spore: "spore_reproduction", potato_tuber: "vegetative_propagation" });
  await expectEvidenceFigure(page, "q05-hydra-budding", ["出芽生殖", "小芽長大成新個體", "親代身體側邊出現小突起", "答案是出芽", "不是斷裂生殖"]);
  await answerChoice(page, Q(5), "budding_from_parent_body");
  await page.evaluate((qid) => {
    window.__asexual_reproductionTest.state().answers[`${qid}_sequence`] = ["parent_plant_forms_tuber_with_bud", "bud_on_tuber_begins_growth", "new_shoots_and_roots_grow", "new_potato_plant_forms"];
  }, Q(6));
  await answerChoice(page, Q(7), "spores_develop_into_new_individuals");
  await answerChoice(page, Q(8), "plant_tissue_culture_many_similar_plants");
  await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', "checkpoint3");
  await expectEvidenceFigure(page, "q12-cutting-materials", ["同一親代", "後代相似", "遺傳特徵大致相同", "無性生殖後代通常相似", "正解是 A", "不用精卵結合"]);
  await answerChoice(page, Q(9), "runner_fast_similar_plants");
  await answerChoice(page, Q(10), "similar_offspring_fast_but_risky");
  await answerMapping(page, Q(11), { yeast_budding: "asexual_core", potato_tuber: "asexual_core", body_fragment: "asexual_core", sperm_egg_fusion: "not_this_unit_core" });
  await answerChoice(page, Q(12), "cutting_offspring_similar_to_parent");
  await answerMapping(page, Q(13), { chromosome_copy_distribution: "u27_cell_division", potato_tuber_new_plant: "u28_asexual_reproduction", hydra_budding: "u28_asexual_reproduction", sperm_egg_fusion: "u29_sexual_reproduction" });
  await answerChoice(page, Q(14), "budding_belongs_asexual_reproduction");
  await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', "review");
  assert.equal(await page.locator(".bq-feedback-mentor img").count(), 1, "shared review mentor should be exactly one");
  assert.equal(await page.locator(".mentor-card:not(.bq-feedback-mentor)").count(), 0, "local review mentor should be removed");
  await clickAndExpectTop(page, '[data-next="reflection"]', "reflection");
  assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
  await forceScroll(page);
  await page.locator("#submitMission").click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
  await expectAtTop(page, "result transition");
}

async function runScenario(viewport, mode) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const failedImages = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(request.url())) failedImages.push(request.url());
  });
  page.on("dialog", (dialog) => dialog.accept());
  await installBackendStub(page, mode);
  await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${CACHE_VERSION}`);
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S99999");
    await page.locator("#loginBtn").click();
  }
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
  await expectAtTop(page, `${mode} login`);
  await completeQuestions(page);
  const result = await page.evaluate(() => window.__asexual_reproductionTest.state().result);
  assert(result, "result should exist after submit");
  assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin button missing");
  assert.equal(await page.locator(".badge-wall .badge").count(), result.earned_badges.length, "result should show only earned badges");
  assert.equal(await page.locator(".badge-wall img").count(), 0, "U28 controlled-pending result badges should not request missing images");
  assert.equal(await page.locator(".bq-badge-asset-pending").count(), result.earned_badges.length, "U28 earned pending badges should render one controlled placeholder each");
  await clickAndExpectTop(page, '[data-next="achievements"]', "achievements");
  await page.locator(".achievements-stack").waitFor();
  assert.equal(await page.locator(".bq-title-avatar-card").count(), 1, "title avatar card should be exactly one");
  assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
  assert.equal(await page.locator(".achievements-stack [data-relogin]").count(), 1, "achievements relogin button missing");
  assert.equal(await page.locator(".badge-wall").count(), 0, "achievements should not repeat the unit badge wall");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
  await clickAndExpectTop(page, '[data-nav="rules"]', "rules");
  assert.equal(await page.locator("[data-relogin]").count(), 1, "rules relogin button missing");
  assert(await page.locator('[data-next="result"]').count(), "submitted rules should return to result");
  await page.locator("[data-relogin]").click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "login");
  const resetState = await page.evaluate(() => ({
    student: window.__asexual_reproductionTest.state().student,
    attemptId: window.__asexual_reproductionTest.state().attempt_id,
    submitted: window.__asexual_reproductionTest.state().submitted,
    attemptsCount: window.__asexual_reproductionTest.loadAttempts().length,
    verifiedSnapshot: window.__asexual_reproductionTest.loadVerifiedSnapshot()
  }));
  assert.equal(resetState.student, null, "relogin reset should clear current student");
  assert.equal(resetState.attemptId, "", "relogin reset should clear current attempt");
  assert.equal(resetState.submitted, false, "relogin reset should clear submitted lock");
  assert(resetState.attemptsCount >= 1, "relogin reset should preserve local attempt history");
  if (mode === "verified") assert.equal(resetState.verifiedSnapshot?.total_exp, 1960, "verified snapshot should survive relogin reset");
  if (mode !== "guest") {
    await page.locator("#studentId").fill("S99999");
    await page.locator("#loginBtn").click();
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    const reloginState = await page.evaluate(() => window.__asexual_reproductionTest.state());
    assert(reloginState.attempt_id.includes(`u28_${mode}_attempt`), "formal relogin should start a fresh backend attempt");
    assert.equal(reloginState.attempt_session_token, `u28_${mode}_token`, "formal relogin should receive a backend token");
  } else {
    await page.locator("#guestBtn").click();
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    const reloginState = await page.evaluate(() => window.__asexual_reproductionTest.state());
    assert(reloginState.attempt_id.startsWith("asexual_reproduction_guest_attempt_"), "guest relogin should start a fresh local attempt");
    assert.equal(reloginState.verification_mode, "local_guest", "guest relogin should stay local");
  }
  const backendActions = await page.evaluate(() => window.__backendActions || []);
  if (mode === "guest") {
    assert.deepEqual(backendActions, [], "guest flow and relogin should not call backend");
  } else {
    assert(backendActions.filter((action) => action === "getStudentAndAttemptStatus").length >= 2, "formal relogin should call getStudentAndAttemptStatus again");
    assert(backendActions.filter((action) => action === "startAttempt").length >= 2, "formal relogin should call startAttempt again");
    assert(backendActions.includes("submitAttempt"), "formal flow should submit to backend");
  }
  assert.deepEqual(failedImages, [], "image requests should not fail");
  assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
  await page.close();
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const mode of ["guest", "pending", "verified"]) {
      await runScenario(viewport, mode);
    }
  }
} finally {
  await browser.close();
}
console.log("asexual reproduction full-flow layout regression passed");
