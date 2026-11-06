#!/usr/bin/env node
// ROADMAP R3 第 15 站題目用語修正（2026-11-06）：
// - 第 15 站後台以選項代號比對 → 選擇、配對、排序答案與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、配對欄位與題目標籤不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - 題目上方的標籤不可直接寫出本題答案；準備頁複習卡只放前面站學過的內容（佇列 W19 老師原則 A＋C）
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const grab = (name, close) => {
  const start = source.indexOf(`const ${name} = `);
  const end = source.indexOf(close, start);
  return source.slice(start + `const ${name} = `.length, end + close.length - 1);
};
const sequenceSteps = Function(`"use strict"; return ${grab("sequenceSteps", "\n];")};`)();
const correctSequence = Function(`"use strict"; return ${grab("correctSequence", "];")};`)();
const questions = Function("sequenceSteps", "correctSequence", `"use strict"; return ${grab("questions", "\n];")};`)(sequenceSteps, correctSequence);

const QV = "20260723-human-nutrition-digestive-classification-v2";
const backendChoice = { q03: "glands", q05: "digestion", q07: "bile", q08: "protein", q09: "small_intestine", q10: "absorb", q11: "absorb_transport", q13: "small_intestine", q14: "different" };
const backendMapping = {
  q01: { mouth: "tract", esophagus: "tract", stomach: "tract", small_intestine: "tract", large_intestine: "tract", salivary_gland: "gland", gastric_gland: "gland", intestinal_gland: "gland", liver: "gland", pancreas: "gland" },
  q04: { mouth: "chew", esophagus: "push", stomach: "mix", small_intestine: "absorb_nutrients", large_intestine: "absorb_water" },
  q06: { amylase: "starch", protease: "protein", lipase: "lipid" },
  q12: { starch_break: "digestion", enter_wall: "absorption", protein_break: "digestion", enter_blood: "absorption" }
};
const backendSequence = { q02: ["mouth", "esophagus", "stomach", "small_intestine", "large_intestine", "anus"] };

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const blockStart = registry.indexOf("  human_nutrition: {");
  const block = registry.slice(blockStart, registry.indexOf("\n    reflection:", blockStart));
  assert.ok(block.includes(`question_version: "${QV}"`));
  for (const [qid, answer] of Object.entries(backendChoice)) assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台配對答案不符`);
  }
  for (const [qid, list] of Object.entries(backendSequence)) assert.ok(block.includes(`${qid}: { type: "sequence", answer: [${list.map((v) => `"${v}"`).join(", ")}]`), `${qid} 後台排序答案不符`);
}
assert.ok(source.includes(`const QUESTION_VERSION = "${QV}"`), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|線索|較合理|最合理|最可能|較可能|較適合|最符合|較符合|檢核|概念邊界|支援構造/;
assert.deepEqual(questions.map((q) => q.id), ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09", "q10", "q11", "q12", "q13", "q14"]);
for (const q of questions) {
  for (const text of [q.prompt, q.hint]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
  if (q.type === "choice") {
    assert.equal(q.answer, backendChoice[q.id], `${q.id} 正解代號不可改`);
    const ids = q.options.map((o) => o.id);
    assert.equal(new Set(ids).size, 4, `${q.id} 選項代號不可重複`);
    assert.equal(ids.filter((id) => id === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
    const texts = q.options.map((o) => o.text);
    assert.equal(new Set(texts).size, 4, `${q.id} 選項文字不可重複`);
    const answerText = q.options.find((o) => o.id === q.answer).text;
    const longestWrong = Math.max(...q.options.filter((o) => o.id !== q.answer).map((o) => [...o.text].length));
    assert.ok([...answerText].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${answerText}`);
    for (const text of texts) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
  } else if (q.type === "mapping") {
    assert.deepEqual(q.answer, backendMapping[q.id], `${q.id} 配對答案不可改`);
    for (const text of [...q.items.map((i) => i.label), ...q.choices.map((c) => c.text)]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
  } else if (q.type === "sequence") {
    assert.deepEqual(q.answer, backendSequence[q.id], `${q.id} 排序答案不可改`);
  }
}

const slice = (a, b) => source.slice(source.indexOf(a), source.indexOf(b));
// 題目上方的標籤不可等於本題答案（例：q07 原本標「膽汁不是酵素」、q11 標「吸收與血液運送」）
const labels = slice("function conceptLabel(", "function renderQuestionEvidence(");
assert.ok(!/膽汁不是酵素|小腸吸收|吸收與血液運送|"消化作用"/.test(labels), "題目標籤不可直接寫出答案");
const screens = slice("function renderBrief(", "function renderQuestionControl(") + slice("function renderReview(", "function renderResult(");
assert.ok(!/資料卡|掃描|判讀|較合理|檢核|證據|線索|概念邊界|作答紀錄|支援構造|迷思標籤/.test(screens), "簡報、準備頁、關卡或回饋畫面仍有內部用語");
// 準備頁：複習卡只放前面站學過的內容，不直接寫出 q02／q03／q05／q09／q11 的答案
const scan = slice("function renderScan(", "function renderCheckpoint(");
assert.ok(/第 11 站/.test(scan) && /第 13 站/.test(scan), "複習卡應註明是前面哪一站學過的");
assert.ok(!/小腸是主要吸收|口腔、食道、胃、小腸、大腸與肛門|消化是分解|血液可將養分運送/.test(scan), "準備頁不可直接寫出本站答案");
assert.ok(!/digestive-legend/.test(source), "消化系統圖不可再用不存在的顏色圖例");

console.log("human nutrition wording r3 test passed");
