#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-flower-observation")
  : sourceRoot;
const VERSION = "20260730-flower-observation-approved-visuals-v1";
const QUESTION_VERSION = "20260725-flower-observation-v1.1";
const Q = (n) => `flower_observation_q${String(n).padStart(2, "0")}`;
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const modes = ["guest", "pending", "verified"];
const q04Answer = { anther_target: "anther", filament_target: "filament", stigma_target: "stigma", ovary_target: "ovary" };
const q05Answer = { anther: "produces_pollen", stigma: "receives_pollen", ovary: "contains_ovules_can_become_fruit", petal: "may_attract_pollinators" };
const q09Answer = ["anther_produces_pollen", "pollen_reaches_stigma", "sperm_cell_joins_egg_in_ovule", "ovary_and_ovule_develop_into_fruit_and_seed"];
const q13Answer = { egg_shell_albumen_yolk_air_cell: "u30_egg_observation", anther_stigma_ovary_ovule: "u31_flower_observation", chromosome_gene_trait: "u32_genetics_chromosome_gene", sperm_egg_zygote: "u29_sexual_reproduction" };

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
let failure = null;

async function installBackendMock(page, mode) {
  await page.addInitScript(({ mode, questionVersion }) => {
    window.confirm = () => true;
    let startCount = 0;
    window.__BIOQUEST_BACKEND_ACTIONS__ = [];
    window.fetch = async (url, init = {}) => {
      const body = init.body ? JSON.parse(init.body) : null;
      const action = body?.action || new URL(url).searchParams.get("action");
      window.__BIOQUEST_BACKEND_ACTIONS__.push({ action, body });
      if (action === "getStudentAndAttemptStatus") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            student: {
              student_id: "S70102",
              class_name: "701",
              seat_no: "02",
              student_name: "正式學生",
              profile_gender: "male",
              progress: {
                total_exp: 3880,
                current_title_id: "concept_solver",
                current_title: "概念解謎者",
                title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
                completed_unit_count: 8,
                unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2}]"
              }
            },
            progress: {
              total_exp: 3880,
              current_title_id: "concept_solver",
              current_title: "概念解謎者",
              title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
              completed_unit_count: 8,
              unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2}]"
            }
          })
        };
      }
      if (action === "startAttempt") {
        startCount += 1;
        return {
          ok: true,
          json: async () => ({
            ok: true,
            verification_mode: "server_verified",
            attempt_id: `${mode}_attempt_${startCount}`,
            attempt_session_id: `${mode}_session_${startCount}`,
            attempt_session_token: `${mode}_token_${startCount}`,
            previous_attempt_id: startCount > 1 ? `${mode}_attempt_${startCount - 1}` : "",
            question_version: questionVersion
          })
        };
      }
      if (action === "submitAttempt") {
        const local = body.client_summary || {};
        if (mode === "verified") {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              verification_status: "server_verified",
              verified_attempt: { ...local, verification_status: "server_verified", credited_delta: local.unit_credited_exp },
              student_progress: {
                total_exp: 3880 + Number(local.unit_credited_exp || 0),
                current_title_id: "micro_explorer",
                current_title: "微觀探索者",
                title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp",
                completed_unit_count: 9,
                unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2},{\"unit_id\":\"flower_observation\",\"earned_count\":16}]"
              }
            })
          };
        }
        return { ok: true, json: async () => ({ ok: true, verification_status: "pending_backend" }) };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, questionVersion: QUESTION_VERSION });
}

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  await page.locator(`select[data-map-question="${qid}"]`).first().waitFor();
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function forceScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 520);
    document.documentElement.scrollTop = 520;
    document.body.scrollTop = 520;
    const stage = document.querySelector(".main-stage");
    if (stage) stage.scrollTop = 520;
  });
}

async function assertTop(page, label) {
  await page.waitForTimeout(80);
  const positions = await page.evaluate(() => ({
    windowY: window.scrollY,
    documentTop: document.documentElement.scrollTop,
    bodyTop: document.body.scrollTop,
    stageTop: document.querySelector(".main-stage")?.scrollTop || 0
  }));
  assert(positions.windowY <= 1, `${label}: window should reset to top`);
  assert(positions.documentTop <= 1, `${label}: document should reset to top`);
  assert(positions.bodyTop <= 1, `${label}: body should reset to top`);
  assert(positions.stageTop <= 1, `${label}: main stage should reset to top`);
}

async function assertScene(page, prefix, { student = false, owl = false } = {}) {
  const scene = page.locator(`.u31-${prefix}-scene`);
  await scene.waitFor();
  assert.equal(await scene.count(), 1, `${prefix} scene should be exactly one`);
  const background = await scene.locator(".u31-scene-media img").evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    currentSrc: img.currentSrc
  }));
  assert(background.naturalWidth > 0, `${prefix} background should load`);
  assert(background.currentSrc.includes(`v=${VERSION}`), `${prefix} background should carry runtime cache`);
  const azhe = await scene.locator(".u31-scene-azhe").evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    currentSrc: img.currentSrc
  }));
  assert(azhe.naturalWidth > 0, `${prefix} Azhe cutout should load`);
  assert(azhe.currentSrc.includes(`v=${VERSION}`), `${prefix} Azhe cutout should carry runtime cache`);
  assert.equal(await scene.locator(".bq-brief-student-avatar").count(), student ? 1 : 0, `${prefix} student avatar count`);
  assert.equal(await scene.locator(".u31-scene-owl").count(), owl ? 1 : 0, `${prefix} owl count`);
  if (owl) {
    const owlImage = await scene.locator(".u31-scene-owl").evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      currentSrc: img.currentSrc
    }));
    assert(owlImage.naturalWidth > 0, `${prefix} owl should load`);
    assert(owlImage.currentSrc.includes(`v=${VERSION}`), `${prefix} owl should carry runtime cache`);
  }
}

async function completeFlow(page, mode) {
  await assertScene(page, "login");
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S70102");
    await page.locator("#loginBtn").click();
  }
  await page.locator(".identity-confirm").waitFor();
  await assertScene(page, "brief", { student: true });
  await forceScroll(page);
  await page.locator('[data-next="scan"]').click();
  await assertTop(page, `${mode} brief to scan`);
  assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
  await assertScene(page, "scan", { owl: true });
  await forceScroll(page);
  await page.locator('[data-next="checkpoint1"]').click();
  await assertTop(page, `${mode} scan to checkpoint1`);

  await answerChoice(page, Q(1), "safe_flower_observation");
  await answerChoice(page, Q(2), "sepal_outer_protection");
  await answerChoice(page, Q(3), "petal_attraction_not_seed");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint1"]').click();
  await assertTop(page, `${mode} checkpoint1 to checkpoint2`);

  await page.locator(".flower-structure-figure img").waitFor();
  await page.waitForFunction(() => {
    const img = document.querySelector(".flower-structure-figure img");
    return Boolean(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
  });
  const q04Image = await page.locator(".flower-structure-figure img").evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    currentSrc: img.currentSrc,
    alt: img.alt
  }));
  assert(q04Image.currentSrc.includes("flower-observation-q04-flower-structure-base"), "q04 should use approved flower structure assets");
  assert(q04Image.currentSrc.includes(`v=${VERSION}`), "q04 image should carry runtime cache");
  assert.equal(q04Image.alt, "未標註的花部構造觀察圖，呈現花中央與周圍可觀察構造的位置關係");
  assert.equal(await page.locator(".flower-hotspot").count(), 4, "q04 should show four target markers");
  assert.equal(await page.locator(".target-list span").count(), 4, "q04 should provide equivalent target list");
  await answerMapping(page, Q(4), q04Answer);
  await answerMapping(page, Q(5), q05Answer);
  await answerChoice(page, Q(6), "stamen_anther_filament_pollen");
  await answerChoice(page, Q(7), "pistil_stigma_style_ovary_ovule");
  await answerChoice(page, Q(8), "pollination_not_fertilization");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint2"]').click();
  await assertTop(page, `${mode} checkpoint2 to checkpoint3`);

  await page.evaluate(({ qid, answer }) => {
    window.__flower_observationTest.state().answers[`${qid}_sequence`] = answer;
  }, { qid: Q(9), answer: q09Answer });
  await answerChoice(page, Q(10), "ovary_fruit_ovule_seed");
  await answerChoice(page, Q(11), "flower_form_pollination_evidence");
  await answerChoice(page, Q(12), "flower_evidence_then_function_inference");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint3"]').click();
  await assertTop(page, `${mode} checkpoint3 to checkpoint4`);

  await answerMapping(page, Q(13), q13Answer);
  await answerChoice(page, Q(14), "flower_observation_belongs_u31");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint4"]').click();
  await assertTop(page, `${mode} checkpoint4 to review`);
  assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "review mentor should be exactly one shared mentor");
  await forceScroll(page);
  await page.locator('[data-next="reflection"]').click();
  await assertTop(page, `${mode} review to reflection`);
  assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
  await page.locator("#studentQuestion").fill("我想確認授粉和受精的差別，觀察花時該看哪些花部線索？");
  await page.locator("#submitMission").click();
  await page.locator(".result-panel").waitFor();
  await assertTop(page, `${mode} reflection to result`);
  await assertScene(page, "result", { owl: true });
}

async function assertSubmittedRetry(page, mode) {
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} result should expose relogin action`);
  const resultText = await page.locator(".result-stack").textContent();
  for (const text of ["正式徽章素材待接", "徽章素材待接", "缺圖", "圖像準備中", "亮"]) {
    assert(!resultText.includes(text), `result must not show ${text}`);
  }
  assert.equal(await page.locator(".result-stack .badge-state").count(), 0, `${mode} result should not render legacy badge-state markers`);
  assert.equal(await page.locator(".result-stack .badge-visual img").count(), 14, `${mode} U31 result should show only the approved badge images earned in this attempt`);
  assert.equal(await page.locator(".candidate-badge-list").count(), 0, `${mode} should not show controlled-pending candidates after approval`);
  assert.equal(await page.evaluate(() => window.__flower_observationTest.canUseNav("login")), true, `${mode} submitted login should be allowed`);
  assert.equal(await page.evaluate(() => window.__flower_observationTest.canUseNav("checkpoint1")), false, `${mode} submitted checkpoint should stay locked`);

  await forceScroll(page);
  await page.locator('[data-next="achievements"]').click();
  await assertTop(page, `${mode} result to achievements`);
  assert.equal(await page.locator('.title-avatar-card.achievements').count(), 1, "title avatar card should be exactly one");
  assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
  assert.equal(await page.locator('.badge-wall').count(), 0, "achievements should not render local unit badge wall");
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} achievements should expose relogin action`);

  await forceScroll(page);
  await page.locator('[data-nav="rules"]').click();
  await assertTop(page, `${mode} achievements to rules`);
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} rules should expose relogin action`);
  await page.locator('[data-next="result"]').click();
  await page.locator(".result-panel").waitFor();

  const attemptBefore = await page.evaluate(() => window.__flower_observationTest.state().attempt_id);
  await page.locator('[data-relogin]').first().click();
  await page.locator("#loginBtn").waitFor();
  const resetState = await page.evaluate(() => window.__flower_observationTest.state());
  assert.equal(resetState.student, null, `${mode} reset should clear current student`);
  assert.equal(resetState.attempt_id, "", `${mode} reset should clear current attempt`);
  assert.equal(resetState.submitted, false, `${mode} reset should clear submitted flag`);
  if (mode === "guest") {
    assert.deepEqual(await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__), [], "guest backend actions should remain zero");
    await page.locator("#guestBtn").click();
    await page.locator(".identity-confirm").waitFor();
    const nextAttempt = await page.evaluate(() => window.__flower_observationTest.state().attempt_id);
    assert.notEqual(nextAttempt, attemptBefore, "guest relogin should create a new local attempt");
    assert.deepEqual(await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__), [], "guest relogin should not call backend");
  } else {
    const snapshot = await page.evaluate(() => window.__flower_observationTest.loadVerifiedSnapshot());
    assert.equal(snapshot.student_id, "S70102", `${mode} reset should preserve verified snapshot`);
    await page.locator("#studentId").fill("S70102");
    await page.locator("#loginBtn").click();
    await page.locator(".identity-confirm").waitFor();
    const actions = await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__.map((item) => item.action));
    assert.equal(actions.filter((action) => action === "getStudentAndAttemptStatus").length, 2, `${mode} relogin should re-read backend student`);
    assert.equal(actions.filter((action) => action === "startAttempt").length, 2, `${mode} relogin should start a new attempt`);
    assert.equal(actions.filter((action) => action === "submitAttempt").length, 1, `${mode} reset itself should not submit`);
  }
}

try {
  for (const viewport of viewports) {
    for (const mode of modes) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      const pageErrors = [];
      const imageErrors = [];
      page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("response", (response) => {
        const type = response.request().resourceType();
        if (type === "image" && response.status() >= 400) imageErrors.push(`${response.status()} ${response.url()}`);
      });
      await installBackendMock(page, mode);
      await page.goto(pathToFileURL(path.join(root, "index.html")).href);
      await completeFlow(page, mode);
      await assertSubmittedRetry(page, mode);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 1, `${mode} ${viewport.width} should not overflow horizontally`);
      assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width} console errors`);
      assert.deepEqual(pageErrors, [], `${mode} ${viewport.width} page errors`);
      assert.deepEqual(imageErrors, [], `${mode} ${viewport.width} image errors`);
      await page.close();
    }
  }
} catch (error) {
  failure = error;
} finally {
  await browser.close();
}

if (failure) throw failure;
console.log("flower observation full-flow layout regression passed");
