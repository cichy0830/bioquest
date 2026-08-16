#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-genetics-chromosome-gene")
  : sourceRoot;
const VERSION = "20260816-genetics-chromosome-gene-functional-build-v1";
const QUESTION_VERSION = "20260725-genetics-chromosome-gene-v1.1";
const Q = (n) => `genetics_chromosome_gene_q${String(n).padStart(2, "0")}`;
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const modes = ["guest", "pending", "verified"];
const answers = {
  q02: {
    pea_flower_color: "observable_trait",
    plant_fruit_shape: "observable_trait",
    sun_red_skin_today: "acquired_or_short_term_state",
    running_speed_after_practice: "learned_or_training_result"
  },
  q04: ["cell", "nucleus", "chromosome", "dna", "gene"],
  q05: {
    chromosome: "carries_genetic_information_in_nucleus",
    dna: "genetic_information_material",
    gene: "dna_segment_related_to_trait",
    trait: "observable_or_describable_feature"
  },
  q13: {
    flower_anther_stigma_ovary_ovule: "u31_flower_observation",
    chromosome_dna_gene_trait_basic: "u32_genetics_chromosome_gene",
    human_trait_anonymous_model: "u33_human_genetics",
    abo_blood_type_possibility: "u34_abo_blood_type"
  }
};

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
        return { ok: true, json: async () => ({
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
        }) };
      }
      if (action === "startAttempt") {
        startCount += 1;
        return { ok: true, json: async () => ({
          ok: true,
          verification_mode: "server_verified",
          attempt_id: `${mode}_attempt_${startCount}`,
          attempt_session_id: `${mode}_session_${startCount}`,
          attempt_session_token: `${mode}_token_${startCount}`,
          previous_attempt_id: startCount > 1 ? `${mode}_attempt_${startCount - 1}` : "",
          question_version: questionVersion
        }) };
      }
      if (action === "submitAttempt") {
        const local = body.client_summary || {};
        if (mode === "verified") {
          return { ok: true, json: async () => ({
            ok: true,
            verification_status: "server_verified",
            attempt_result: {
              verification_status: "server_verified",
              concept_exp: 111,
              question_exp: 22,
              attempt_total_exp: 333,
              earned_badges_json: JSON.stringify(["genetics_chromosome_gene_entry", "gene_location_identifier"])
            },
            verified_attempt: { ...local, verification_status: "server_verified", earned_badges_json: JSON.stringify(["genetics_chromosome_gene_entry", "gene_location_identifier"]) },
            student_progress: {
              total_exp: 4213,
              current_title_id: "micro_explorer",
              current_title: "微觀探索者",
              title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp",
              completed_unit_count: 9,
              unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2},{\"unit_id\":\"genetics_chromosome_gene\",\"earned_count\":1}]"
            }
          }) };
        }
        return { ok: true, json: async () => ({ ok: true, verification_status: "pending_backend" }) };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, questionVersion: QUESTION_VERSION });
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

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  await page.locator(`select[data-map-question="${qid}"]`).first().waitFor();
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function assertNeutralScene(page, prefix, { student = false } = {}) {
  const scene = page.locator(`.u32-${prefix}-scene`);
  await scene.waitFor();
  assert.equal(await scene.count(), 1, `${prefix} scene should be exactly one`);
  assert.equal(await scene.locator(".u32-scene-neutral").count(), 1, `${prefix} neutral scene should render`);
  assert.equal(await scene.locator(".u32-scene-azhe").count(), 0, `${prefix} pending Azhe must not render`);
  assert.equal(await scene.locator(".u32-scene-owl").count(), 0, `${prefix} pending owl must not render`);
  assert.equal(await scene.locator(".bq-brief-student-avatar").count(), student ? 1 : 0, `${prefix} student avatar count`);
}

async function completeFlow(page, mode) {
  await page.locator(".bq-login-cover img").waitFor();
  const coverSrc = await page.locator(".bq-login-cover img").evaluate((img) => img.currentSrc);
  assert(coverSrc.includes("shared-assets/login/bioquest-login-cover"), "login should use shared BioQuest cover");
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S70102");
    await page.locator("#loginBtn").click();
  }
  await page.locator(".identity-confirm").waitFor();
  await assertNeutralScene(page, "brief", { student: true });
  await forceScroll(page);
  await page.locator('[data-next="scan"]').click();
  await assertTop(page, `${mode} brief to scan`);
  await assertNeutralScene(page, "scan");
  await forceScroll(page);
  await page.locator('[data-next="checkpoint1"]').click();
  await assertTop(page, `${mode} scan to checkpoint1`);

  await answerChoice(page, Q(1), "parent_to_offspring_trait_similarity");
  await answerMapping(page, Q(2), answers.q02);
  await answerChoice(page, Q(3), "environment_can_affect_trait_expression_not_gene_change");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint1"]').click();
  await assertTop(page, `${mode} checkpoint1 to checkpoint2`);

  await page.evaluate(({ qid, answer }) => {
    window.__genetics_chromosome_geneTest.state().answers[`${qid}_sequence`] = answer;
  }, { qid: Q(4), answer: answers.q04 });
  await answerMapping(page, Q(5), answers.q05);
  await page.locator(".gene-location-figure img").waitFor();
  const q06Image = await page.locator(".gene-location-figure img").evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    currentSrc: img.currentSrc,
    alt: img.alt
  }));
  assert(q06Image.naturalWidth > 0, "q06 image should load");
  assert(q06Image.currentSrc.includes("u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base"), "q06 should use approved v4 asset");
  assert(q06Image.currentSrc.includes(`v=${VERSION}`), "q06 image should carry runtime cache");
  assert(q06Image.alt.includes("未標註的遺傳訊息位置示意圖"));
  assert.equal(await page.locator(".target-list span").count(), 4, "q06 should provide equivalent target list");
  await answerChoice(page, Q(6), "gene_is_dna_segment");
  await answerChoice(page, Q(7), "chromosome_mainly_in_nucleus");
  await answerChoice(page, Q(8), "genes_are_segments_on_dna");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint2"]').click();
  await assertTop(page, `${mode} checkpoint2 to checkpoint3`);

  await answerChoice(page, Q(9), "offspring_trait_matches_parent_pattern");
  await answerChoice(page, Q(10), "this_unit_stops_before_probability_calculation");
  await answerChoice(page, Q(11), "trait_can_be_related_to_genes_and_environment");
  await answerChoice(page, Q(12), "use_anonymous_trait_model_without_private_data");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint3"]').click();
  await assertTop(page, `${mode} checkpoint3 to checkpoint4`);

  await answerMapping(page, Q(13), answers.q13);
  await answerChoice(page, Q(14), "chromosome_gene_trait_basic_belongs_u32");
  await forceScroll(page);
  await page.locator('[data-section-next="checkpoint4"]').click();
  await assertTop(page, `${mode} checkpoint4 to review`);
  assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "review mentor should be exactly one shared mentor");
  await forceScroll(page);
  await page.locator('[data-next="reflection"]').click();
  await assertTop(page, `${mode} review to reflection`);
  await page.locator("#studentQuestion").fill("我想確認染色體、DNA 和基因的層級關係，為什麼基因是 DNA 上的一段？");
  await page.locator("#submitMission").click();
  await page.locator(".result-panel").waitFor();
  await assertTop(page, `${mode} reflection to result`);
  await assertNeutralScene(page, "result");
}

async function assertSubmittedRetry(page, mode) {
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} result should expose relogin action`);
  assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, `${mode} pending badges must not render images`);
  assert.equal(await page.locator(".candidate-badge-list").count(), 1, `${mode} earned pending badges should be text-only candidates`);
  const resultText = await page.locator(".result-stack").textContent();
  for (const text of ["正式徽章素材待接", "徽章素材待接", "缺圖", "圖像準備中", "亮"]) {
    assert(!resultText.includes(text), `result must not show ${text}`);
  }
  assert.equal(await page.evaluate(() => window.__genetics_chromosome_geneTest.canUseNav("login")), true, `${mode} submitted login should be allowed`);
  assert.equal(await page.evaluate(() => window.__genetics_chromosome_geneTest.canUseNav("checkpoint1")), false, `${mode} submitted checkpoint should stay locked`);

  await forceScroll(page);
  await page.locator('[data-next="achievements"]').click();
  await assertTop(page, `${mode} result to achievements`);
  assert.equal(await page.locator('.title-avatar-card.achievements').count(), 1, "title avatar card should be exactly one");
  assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
  assert.equal(await page.locator('.badge-wall').count(), 0, "achievements should not render unit badge wall");
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} achievements should expose relogin action`);

  await forceScroll(page);
  await page.locator('[data-nav="rules"]').click();
  await assertTop(page, `${mode} achievements to rules`);
  assert.equal(await page.locator('[data-relogin]').count(), 1, `${mode} rules should expose relogin action`);
  await page.locator('[data-next="result"]').click();
  await page.locator(".result-panel").waitFor();

  const attemptBefore = await page.evaluate(() => window.__genetics_chromosome_geneTest.state().attempt_id);
  await page.locator('[data-relogin]').first().click();
  await page.locator("#loginBtn").waitFor();
  const resetState = await page.evaluate(() => window.__genetics_chromosome_geneTest.state());
  assert.equal(resetState.student, null, `${mode} reset should clear current student`);
  assert.equal(resetState.attempt_id, "", `${mode} reset should clear current attempt`);
  assert.equal(resetState.submitted, false, `${mode} reset should clear submitted flag`);
  if (mode === "guest") {
    assert.deepEqual(await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__), [], "guest backend actions should remain zero");
    await page.locator("#guestBtn").click();
    await page.locator(".identity-confirm").waitFor();
    const nextAttempt = await page.evaluate(() => window.__genetics_chromosome_geneTest.state().attempt_id);
    assert.notEqual(nextAttempt, attemptBefore, "guest relogin should create a new local attempt");
  } else {
    const snapshot = await page.evaluate(() => window.__genetics_chromosome_geneTest.loadVerifiedSnapshot());
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
console.log("genetics chromosome gene full-flow layout regression passed");
