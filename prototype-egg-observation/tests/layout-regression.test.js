#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-egg-observation")
  : sourceRoot;
const VERSION = "20260729-egg-observation-final-preflight-v1";
const QUESTION_VERSION = "20260718-egg-observation-v1";
const Q = (n) => `egg_observation_q${String(n).padStart(2, "0")}`;
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const modes = ["guest", "pending", "verified"];
const q04Answer = ["prepare_tray_cleaning_wash_hands", "observe_external_shell", "carefully_open_and_observe_cross_section", "record_structures_locations_functions", "clean_shell_liquid_wash_hands"];
const q05Answer = { outer_hard_shell: "eggshell", translucent_region: "albumen", yellow_round_region: "yolk", blunt_end_air_space: "air_cell" };
const q06Answer = { eggshell: "protects_inside", albumen: "water_and_cushion", yolk: "nutrient_supply", air_cell: "air_space" };
const q13Answer = { sperm_egg_zygote: "u29_sexual_reproduction", shell_albumen_yolk_aircell: "u30_egg_observation", stamen_pistil_labeling: "u31_flower_observation", potato_tuber_new_plant: "u28_asexual_reproduction" };

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
let failure = null;

function ok(data) {
  return { ok: true, json: async () => data };
}

async function installBackendMock(page, mode) {
  await page.addInitScript(({ mode, questionVersion }) => {
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
                unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2},{\"unit_id\":\"egg_observation\",\"earned_count\":4}]"
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

async function completeFlow(page, mode) {
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S70102");
    await page.locator("#loginBtn").click();
  }
  await page.locator(".identity-confirm").waitFor();
  await forceScroll(page);
  await page.locator('[data-next="scan"]').click();
  await assertTop(page, `${mode} brief to scan`);
  assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
  await forceScroll(page);
  await page.locator('[data-next="checkpoint1"]').click();
  await assertTop(page, `${mode} scan to checkpoint1`);
  await answerChoice(page, Q(1), "safe_raw_egg_observation");
  await answerChoice(page, Q(2), "shell_visible_externally");
  await answerChoice(page, Q(3), "shell_protection_gas_exchange");
  await page.evaluate(({ qid, answer }) => {
    window.__egg_observationTest.state().answers[`${qid}_sequence`] = answer;
  }, { qid: Q(4), answer: q04Answer });
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint1"]').click();
  await assertTop(page, `${mode} checkpoint1 to checkpoint2`);
  await page.locator(".egg-cross-section-figure img").waitFor();
  await page.waitForFunction(() => {
    const img = document.querySelector(".egg-cross-section-figure img");
    return Boolean(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
  });
  const crossSection = await page.locator(".egg-cross-section-figure img").evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    currentSrc: img.currentSrc,
    alt: img.alt
  }));
  assert(crossSection.currentSrc.includes("egg-observation-cross-section-hotspot-base"), "q05 should use approved cross-section assets");
  assert.equal(crossSection.alt, "未標註的雞蛋剖面觀察圖，呈現外層硬質邊界、透明或半透明區、黃色圓形區與鈍端空間等可觀察位置");
  assert.equal(await page.locator(".egg-hotspot").count(), 4, "q05 should show four neutral A-D hotspots");
  await answerMapping(page, Q(5), q05Answer);
  await answerMapping(page, Q(6), q06Answer);
  await answerChoice(page, Q(7), "yolk_nutrient_not_embryo");
  await answerChoice(page, Q(8), "air_cell_blunt_end_space");
  await answerChoice(page, Q(9), "chalaza_anchors_yolk");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint2"]').click();
  await assertTop(page, `${mode} checkpoint2 to checkpoint3`);
  await answerChoice(page, Q(10), "germinal_disc_on_yolk_surface");
  await answerChoice(page, Q(11), "egg_not_always_developing_embryo");
  await answerChoice(page, Q(12), "evidence_then_structure_inference");
  await answerMapping(page, Q(13), q13Answer);
  await answerChoice(page, Q(14), "egg_cross_section_observation_belongs_u30");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint3"]').click();
  await assertTop(page, `${mode} checkpoint3 to review`);
  assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "review mentor should be exactly one shared mentor");
  await forceScroll(page);
  await page.locator('[data-next="reflection"]').click();
  await assertTop(page, `${mode} review to reflection`);
  assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
  await page.locator("#submitMission").click();
  await page.locator(".result-panel").waitFor();
  await assertTop(page, `${mode} reflection to result`);
}

async function assertSubmittedRetry(page, mode) {
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} result should expose relogin action`);
  const resultText = await page.locator(".result-stack").textContent();
  assert(!resultText.includes("圖像準備中"), "result must not show stale pending image text");
  assert(!resultText.includes("正式徽章素材待接"), "result must not show stale badge hook text");
  assert.equal(await page.locator(".result-stack .badge-visual img").count(), 4, `${mode} result should render only four ready badge images`);
  assert(await page.locator(".candidate-badge-list").count() >= 1, `${mode} should separate controlled-pending earned candidates`);
  assert.equal(await page.evaluate(() => window.__egg_observationTest.canUseNav("login")), true, `${mode} submitted login should be allowed`);
  assert.equal(await page.evaluate(() => window.__egg_observationTest.canUseNav("checkpoint1")), false, `${mode} submitted checkpoint should stay locked`);

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

  const attemptBefore = await page.evaluate(() => window.__egg_observationTest.state().attempt_id);
  await page.locator('[data-relogin]').first().click();
  await page.locator("#loginBtn").waitFor();
  const resetState = await page.evaluate(() => window.__egg_observationTest.state());
  assert.equal(resetState.student, null, `${mode} reset should clear current student`);
  assert.equal(resetState.attempt_id, "", `${mode} reset should clear current attempt`);
  assert.equal(resetState.submitted, false, `${mode} reset should clear submitted flag`);
  if (mode === "guest") {
    assert.deepEqual(await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__), [], "guest backend actions should remain zero");
    await page.locator("#guestBtn").click();
    await page.locator(".identity-confirm").waitFor();
    const nextAttempt = await page.evaluate(() => window.__egg_observationTest.state().attempt_id);
    assert.notEqual(nextAttempt, attemptBefore, "guest relogin should create a new local attempt");
    assert.deepEqual(await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__), [], "guest relogin should not call backend");
  } else {
    const snapshot = await page.evaluate(() => window.__egg_observationTest.loadVerifiedSnapshot());
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
  for (const mode of modes) {
    for (const viewport of viewports) {
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
      await installBackendMock(page, mode);
      await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${VERSION}`);
      await completeFlow(page, mode);
      await assertSubmittedRetry(page, mode);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${mode} horizontal overflow`);
      assert.deepEqual(failedImages, [], `${mode} image requests should not fail`);
      assert.deepEqual(consoleErrors, [], `${mode} console/page errors during full flow`);
      await page.close();
    }
  }
} catch (error) {
  failure = error;
} finally {
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1000))
  ]);
}
if (failure) {
  console.error(failure);
  process.exit(1);
}
console.log("egg observation full-flow layout regression passed");
process.exit(0);
