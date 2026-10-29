#!/usr/bin/env node
// ROADMAP R3 第 8 站題目用語修正（2026-10-29）：
// - 第 8 站後台以選項代號比對 → 正解代號與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - QUESTION_VERSION 不變；q07 仍停用
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function constValue(name, open = "[", close = "\n];") {
  const start = source.indexOf(`const ${name} = ${open}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(close, start);
  const body = source.slice(start + `const ${name} = `.length, end + close.length - 1).replace(/assets\.(\w+)/g, '"$1"');
  return Function(`"use strict"; return ${body};`)();
}

// 後台正解（cell_transport，question_version 20260721-cell-transport-q07-inactive-v1）
const backend = {
  q01: "diffusion", q02: "no_membrane_needed", q03: "to_sugar", q04: "selective", q05: "outside_in", q06: "regulate",
  q08: "water_direction", q09: "shrink", q10: "swell", q11: "wall_support", q12: "plasmolysis", q13: "solute", q14: "selective"
};

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  cell_transport: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes('question_version: "20260721-cell-transport-q07-inactive-v1"'));
  for (const [qid, answer] of Object.entries(backend)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  }
}

assert.ok(source.includes('const QUESTION_VERSION = "20260721-cell-transport-q07-inactive-v1"'), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|未標註|干擾|脈絡|較支持|較合理|最合理|最可能|較可能|最適合|較符合|檢核|追蹤物質|淨移動/;
const questions = constValue("questions");
assert.deepEqual(questions.map((q) => q.id), Object.keys(backend));
for (const q of questions) {
  assert.equal(q.answer, backend[q.id], `${q.id} 正解代號不可改`);
  const ids = q.options.map((o) => o.id);
  assert.equal(new Set(ids).size, 4, `${q.id} 選項代號不可重複`);
  assert.equal(ids.filter((id) => id === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
  const texts = q.options.map((o) => o.text);
  assert.equal(new Set(texts).size, 4, `${q.id} 選項文字不可重複`);
  const answerText = q.options.find((o) => o.id === q.answer).text;
  const longestWrong = Math.max(...q.options.filter((o) => o.id !== q.answer).map((o) => [...o.text].length));
  assert.ok([...answerText].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${answerText}`);
  for (const text of [q.prompt, q.hint, q.imageAlt || "", q.imageEvidence || "", ...texts]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}
// 同一關卡內同一張圖只放一次
for (const section of ["checkpoint1", "checkpoint2", "checkpoint3"]) {
  const imgs = questions.filter((q) => q.section === section && q.image).map((q) => q.image);
  assert.equal(new Set(imgs).size, imgs.length, `${section} 同一張圖重複出現`);
}

const screens = source.slice(source.indexOf("function renderBrief()"), source.indexOf("function selectedClass("))
  + source.slice(source.indexOf("function renderQuestionImage("), source.indexOf("function isCorrect(qid)"));
assert.ok(!/掃描|未標註|判讀|較合理|檢核|追蹤物質|證據/.test(screens), "簡報、準備頁或關卡畫面仍有內部用語");
assert.ok(!source.includes("<h2>任務掃描結果</h2>"), "回饋頁標題不應再寫「掃描」");

console.log("cell transport wording r3 test passed");
