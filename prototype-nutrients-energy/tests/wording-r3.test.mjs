#!/usr/bin/env node
// ROADMAP R3 第 11 站題目用語修正（2026-11-01）：
// - 第 11 站後台以選項代號比對 → 選擇、複選、配對答案與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、配對欄位、圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - 同一關卡同一張圖不重複；QUESTION_VERSION 不變
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function constValue(name, open = "[", close = "\n];", scope = "") {
  const start = source.indexOf(`const ${name} = ${open}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(close, start);
  const body = source.slice(start + `const ${name} = `.length, end + close.length - 1);
  return Function("assets", `"use strict"; return ${body};`)(scope);
}
const assets = constValue("assets", "{", "\n};");

const QV = "20260721-nutrients-energy-q11-inactive-v1";
const backendChoice = {
  q04: "regulation_not_energy", q06: "mixed_nutrients", q07: "build_repair", q08: "needed_in_moderation", q09: "provides_energy",
  q10: "add_variety", q12: "transport_regulate", q13: "variety_moderation", q14: "food_contains_nutrients"
};
const backendSet = { q01: ["carb", "protein", "lipid", "vitamin", "mineral", "water"], q03: ["carb", "lipid", "protein"] };
const backendMapping = {
  q02: { carb: "common_energy", protein: "build_repair", lipid: "store_energy", vitamin_mineral: "regulate", water: "transport" },
  q05: { rice: "carb", bread: "carb", egg: "protein", tofu: "protein", oil: "lipid", nuts: "lipid" }
};

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  nutrients_energy: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes(`question_version: "${QV}"`));
  for (const [qid, answer] of Object.entries(backendChoice)) assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  for (const [qid, answer] of Object.entries(backendSet)) assert.ok(block.includes(`${qid}: { type: "set", answer: ${JSON.stringify(answer).replace(/,/g, ", ")}`), `${qid} 後台複選答案不符`);
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台配對答案不符`);
  }
}
assert.ok(source.includes(`const QUESTION_VERSION = "${QV}"`), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|未標註|干擾|脈絡|線索|較支持|較合理|最合理|最可能|較可能|最適合|最合適|最符合|較符合|檢核|DOM|題目目的|圖卡|指定/;
const questions = constValue("questions", "[", "\n];", assets);
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

const multi = constValue("multiSelectQuestions", "{", "\n};", assets);
for (const [qid, answer] of Object.entries(backendSet)) {
  assert.deepEqual(multi[qid].answers, answer, `${qid} 複選答案不可改`);
  for (const text of [multi[qid].prompt, multi[qid].hint, multi[qid].caption || "", multi[qid].imageAlt || "", ...multi[qid].options.map((o) => o.text)]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}
const classify = constValue("classifyQuestions", "{", "\n};", assets);
for (const [qid, map] of Object.entries(backendMapping)) {
  assert.deepEqual(Object.fromEntries(classify[qid].items.map((item) => [item.id, item.answer])), map, `${qid} 配對答案不可改`);
  const labels = classify[qid].options.map((o) => o.label);
  assert.equal(new Set(labels).size, labels.length, `${qid} 選項名稱不可重複`);
  for (const text of [classify[qid].prompt, classify[qid].hint, classify[qid].caption, classify[qid].imageAlt, ...labels, ...classify[qid].items.map((i) => i.label)]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}

// 同一關卡同一張圖不重複
const sectionMap = constValue("sectionMap", "{", "\n};");
const imageOf = (qid) => multi[qid]?.image || classify[qid]?.image || ({ label: assets.nutritionLabelBoard, balanced: assets.balancedMealComparison })[questions.find((q) => q.id === qid)?.visual] || "";
for (const [section, qids] of Object.entries(sectionMap)) {
  const images = qids.map(imageOf).filter(Boolean);
  assert.equal(new Set(images).size, images.length, `${section} 有重複的圖：${images.join(", ")}`);
}

const screens = source.slice(source.indexOf("function renderQuestionImage("), source.indexOf("function evaluateReflectionQuality("))
  + source.slice(source.indexOf("function misconceptionText("), source.indexOf("function activeRawAnswers("));
assert.ok(!/資料卡|掃描|未標註|判讀|較合理|檢核|證據|DOM|題目目的|圖卡|整理食物資料/.test(screens), "簡報、準備頁、關卡或回饋畫面仍有內部用語");
// 準備頁不直接寫出 q03 答案
const scan = source.slice(source.indexOf("function renderScan("), source.indexOf("function renderCheckpoint1("));
assert.ok(!scan.includes("醣類、脂質與蛋白質可提供能量"), "準備頁不可直接寫出 q03 答案");
assert.ok(!/是食物；.*才是養分/.test(scan), "準備頁不可直接寫出 q14 答案");

console.log("nutrients_energy wording r3 test passed");
