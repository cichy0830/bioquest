#!/usr/bin/env node
// ROADMAP R3 第 13 站題目用語修正（2026-11-02）：
// - 第 13 站後台以選項代號比對 → 選擇、配對答案與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、配對欄位、表格與圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - 準備頁與題目附註不直接寫出答案；QUESTION_VERSION 不變
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

const QV = "20260720-enzymes-user-review-v2";
const backendChoice = {
  q01: "promote_reaction", q02: "not_consumed", q04: "not_match", q05: "optimal_temperature", q06: "not_always_hotter",
  q07: "acidic", q08: "activity_lower", q10: "digest_specific", q11: "protease", q12: "not_only_breakdown", q13: "not_energy", q14: "different_conditions"
};
const backendMapping = { q03: { amylase: "starch", protease: "protein", lipase: "lipid" } };

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  enzymes: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes(`question_version: "${QV}"`));
  for (const [qid, answer] of Object.entries(backendChoice)) assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台配對答案不符`);
  }
}
assert.ok(source.includes(`const QUESTION_VERSION = "${QV}"`), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|未標註|線索|較合理|最合理|最可能|較可能|較適合|最符合|較符合|檢核|受質|概念邊界|作用對象/;
const questions = constValue("questions");
assert.deepEqual(questions.map((q) => q.id), Object.keys(backendChoice));
for (const q of questions) {
  assert.equal(q.answer, backendChoice[q.id], `${q.id} 正解代號不可改`);
  const ids = q.options.map((o) => o.id);
  assert.equal(new Set(ids).size, 4, `${q.id} 選項代號不可重複`);
  assert.equal(ids.filter((id) => id === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
  const texts = q.options.map((o) => o.text);
  assert.equal(new Set(texts).size, 4, `${q.id} 選項文字不可重複`);
  const answerText = q.options.find((o) => o.id === q.answer).text;
  const longestWrong = Math.max(...q.options.filter((o) => o.id !== q.answer).map((o) => [...o.text].length));
  assert.ok([...answerText].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${answerText}`);
  for (const text of [q.prompt, q.hint, ...texts]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}
const classify = constValue("classifyQuestions", "{", "\n};");
for (const [qid, map] of Object.entries(backendMapping)) {
  assert.deepEqual(Object.fromEntries(classify[qid].items.map((item) => [item.id, item.answer])), map, `${qid} 配對答案不可改`);
  for (const text of [classify[qid].prompt, classify[qid].hint, ...classify[qid].options.map((o) => o.label), ...classify[qid].items.map((i) => i.label)]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}

const screens = source.slice(source.indexOf("function selectedClass("), source.indexOf("function isCorrect("))
  + source.slice(source.indexOf("function misconceptionText("), source.indexOf("function renderReflection("));
assert.ok(!/資料卡|掃描|判讀|較合理|檢核|證據|線索|概念邊界/.test(screens), "簡報、準備頁、關卡或回饋畫面仍有內部用語");
// q13 題目附註原本直接寫出答案 → 移除
assert.ok(!/qid === "q13"/.test(source), "q13 不可再附提示答案的說明");
// 準備頁不直接寫出 q01／q02／q04／q06 答案
const scan = source.slice(source.indexOf("function renderScan("), source.indexOf("function renderCheckpoint1("));
assert.ok(!/不被消耗|不是能量|不是越高|適合的作用對象/.test(scan), "準備頁不可直接寫出答案");

console.log("enzymes wording r3 test passed");
