#!/usr/bin/env node
// ROADMAP R3 第 7 站題目用語修正（2026-10-28）：
// - 第 7 站後台以選項代號比對 → 正解代號、排序代號、分類代號與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - QUESTION_VERSION 不變
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function constValue(name, open = "[", close = "\n];") {
  const start = source.indexOf(`const ${name} = ${open}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(close, start);
  const body = source.slice(start + `const ${name} = `.length, end + close.length - 1)
    .replace(/assets\.scopeViews\.\w+|assets\.\w+/g, '""');
  return Function(`"use strict"; return ${body};`)();
}

// 後台正解（cell_observation，question_version 20260716-cell-observation-canonical-v1）
const backend = {
  q01: ["water", "sample", "cover", "paper"],
  q02: "angle", q03: "wide_view", q04: "fine_focus", q05: "onion", q06: "wall", q07: "mouth",
  q08: "animal_nucleus", q09: "stoma", q10: "guard", q11: "contrast", q12: "contrast_fix", q13: "bubble",
  q14: { grid_wall: "plant", irregular_no_wall: "animal", guard_stoma: "plant", mouth_sample: "animal" }
};

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  cell_observation: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes('question_version: "20260716-cell-observation-canonical-v1"'));
  for (const [qid, answer] of Object.entries(backend)) {
    let expected;
    if (Array.isArray(answer)) expected = `${qid}: { type: "sequence", answer: [${answer.map((a) => `"${a}"`).join(", ")}]`;
    else if (typeof answer === "object") expected = `${qid}: { type: "mapping", answer: { ${Object.entries(answer).map(([k, v]) => `${k}: "${v}"`).join(", ")} }`;
    else expected = `${qid}: { type: "choice", answer: "${answer}"`;
    assert.ok(block.includes(expected), `${qid} 後台答案不符`);
  }
}

assert.ok(source.includes('const QUESTION_VERSION = "20260716-cell-observation-canonical-v1"'), "question_version 不可改");

const steps = constValue("sequenceSteps");
assert.deepEqual(steps.map((s) => s.id).sort(), [...backend.q01].sort(), "q01 排序代號不可改");
assert.deepEqual(constValue("correctSequence"), backend.q01, "q01 正確順序不可改");

const classify = constValue("classifyItems");
assert.deepEqual(Object.fromEntries(classify.map((i) => [i.id, i.answer])), backend.q14, "q14 分類代號不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|未標註|干擾|脈絡|較支持|較合理|最合理|最可能|較可能|最適合|較符合|水封片|檢核/;
const questions = constValue("questions");
assert.deepEqual(questions.map((q) => q.id), ["q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09", "q10", "q11", "q12", "q13"]);
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
  for (const text of [q.prompt, q.hint, q.imageAlt || "", ...texts]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}
for (const s of steps) assert.ok(!internalTerms.test(s.label), `排序卡含內部用語：${s.label}`);
for (const i of classify) assert.ok(!internalTerms.test(i.label), `分類卡含內部用語：${i.label}`);

// 題目圖說、關卡名、準備頁
const screens = source.slice(source.indexOf("function renderBrief()"), source.indexOf("function isCorrect(qid)"));
assert.ok(!/掃描|未標註|干擾|脈絡|較支持|較合理|水封片|檢核|圖像證據/.test(screens), "簡報、準備頁或關卡畫面仍有內部用語");
assert.ok(!source.includes("<h2>任務掃描結果</h2>"), "回饋頁標題不應再寫「掃描」");
assert.ok(!index.includes(">判讀<"), "步驟列不應再顯示「判讀」");

console.log("cell observation wording r3 test passed");
