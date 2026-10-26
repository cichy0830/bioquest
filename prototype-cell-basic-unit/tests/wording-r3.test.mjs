#!/usr/bin/env node
// ROADMAP R3 第 5 站題目用語修正（2026-10-26）：
// - 第 5 站後台以選項代號（id）比對 → 選擇題正解 id、複選／分類／配對／排序代號與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項不含內部用語
// - 正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - BASIC_UNIT_VERSION（question_version）不變
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
  return Function(`"use strict"; return ${source.slice(start + `const ${name} = `.length, end + close.length - 1)};`)();
}

// 後台正解（cell_basic_unit，question_version 20260712-basic-unit-sheet-login-v4）
const backendChoice = { q01: "basic", q02: "plant_cells", q06: "single_life", q07: "some_single", q09: "message", q10: "gas", q12: "cheek_cells", q14: "cell_function" };
const backendSet = ["human", "onion", "yeast", "paramecium"];
const backendClassify = { paramecium: "single", yeast: "single", amoeba: "single", human: "multi", onion: "multi", butterfly: "multi" };
const backendMatch = { flat: "cover", long: "message", disc: "gas", fiber: "contract" };
const backendSequence = ["organism", "tissue", "cell"];

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  cell_basic_unit: {");
  const block = registry.slice(start, registry.indexOf("\n  },", start));
  assert.ok(block.includes('question_version: "20260712-basic-unit-sheet-login-v4"'));
  for (const [qid, answer] of Object.entries(backendChoice)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台正解應為 ${answer}`);
  }
  const list = (arr) => JSON.stringify(arr).replace(/","/g, '", "');
  const map = (obj) => Object.entries(obj).map(([k, v]) => `${k}: "${v}"`).join(", ");
  assert.ok(block.includes(`q03: { type: "set", answer: ${list(backendSet)}`), "q03 後台答案不符");
  assert.ok(block.includes(`q04: { type: "mapping", answer: { ${map(backendClassify)} }`), "q04 後台答案不符");
  assert.ok(block.includes(`q08: { type: "mapping", answer: { ${map(backendMatch)} }`), "q08 後台答案不符");
  assert.ok(block.includes(`q13: { type: "sequence", answer: ${list(backendSequence)}`), "q13 後台答案不符");
}

assert.ok(source.includes('const BASIC_UNIT_VERSION = "20260712-basic-unit-sheet-login-v4"'), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|canonical|修正較合理/;
const questions = constValue("unitQuestions");
assert.equal(questions.length, 8);
for (const q of questions) {
  assert.equal(q.answer, backendChoice[q.id], `${q.id} 正解代號不可改`);
  const ids = q.options.map((o) => o.id);
  assert.equal(ids.filter((id) => id === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
  assert.equal(new Set(ids).size, 4, `${q.id} 選項代號不可重複`);
  assert.equal(new Set(q.options.map((o) => o.text)).size, 4, `${q.id} 選項文字不可重複`);
  const answerText = q.options.find((o) => o.id === q.answer).text;
  const longestWrong = Math.max(...q.options.filter((o) => o.id !== q.answer).map((o) => [...o.text].length));
  assert.ok([...answerText].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${answerText}`);
  for (const text of [q.prompt, q.hint, ...q.options.map((o) => o.text)]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}

assert.deepEqual(constValue("multiCellItems").filter((i) => i.answer).map((i) => i.id), backendSet, "q03 複選代號不可改");
assert.deepEqual(Object.fromEntries(constValue("classifyItems").map((i) => [i.id, i.answer])), backendClassify, "q04 分類代號不可改");
assert.deepEqual(Object.fromEntries(constValue("matchItems").map((i) => [i.id, i.answer])), backendMatch, "q08 配對代號不可改");
assert.deepEqual(constValue("sequenceSteps").map((s) => s.id).sort(), [...backendSequence].sort(), "q13 排序代號不可改");
assert.ok(source.includes('=== "organism|tissue|cell"'), "q13 本機判分順序不可改");

for (const phrase of [
  "生命積木掃描", "進入生命積木掃描", "微觀掃描提醒", "進關卡前先整理概念", "任務掃描結果",
  "顯微證據與層級判斷", "進入顯微證據判讀", "顯微觀察證據判斷", "顯微鏡影像可作為細胞證據",
  "選完後會直接顯示已選答案", "手機拖曳不穩時", "哪個修正較合理", "最合理的判斷方向"
]) {
  assert.ok(!source.includes(phrase), `不應再出現：${phrase}`);
}

console.log("cell basic unit wording r3 test passed");
