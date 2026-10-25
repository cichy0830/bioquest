#!/usr/bin/env node
// ROADMAP R3 第 2 站題目用語修正（2026-10-26）：
// - 選擇題正解文字與後台 10_canonical_registry.gs 一字不差（後台以正解文字比對），且正解在選項中
// - 分類／排序題項目代號（id）與後台答案一致
// - 學生看得到的文字不含內部用語
// - 正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function constArray(name) {
  const start = source.indexOf(`const ${name} = [`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf("\n];", start);
  return Function(`"use strict"; return ${source.slice(start + `const ${name} = `.length, end + 2)};`)();
}

// 後台正解（scientific_method，question_version 20260720-scientific-method-canonical-v1）
const backendChoice = {
  q03: "吐司發霉是否和環境溫度有關？",
  q04: "吐司放在低溫處較室溫處不易發霉",
  q06: "水分",
  q07: "豆苗生長高度",
  q08: "減少其他因素干擾，讓溫度影響較容易判斷",
  q09: "兩組需要設計成主要只差在操作變因，才較能比較",
  q10: "室溫組發霉比例明顯高於低溫組",
  q11: "低溫處的吐司較室溫處不易發霉",
  q12: "在此實驗條件下，吐司放在低溫處較室溫處不易發霉",
  q13: "檢查假說與實驗設計，必要時修正後再驗證",
  q14: "確認結果是否穩定可靠"
};
const localToQ = {
  testable_question: "q03", hypothesis: "q04", mung_water: "q06", seedling_height: "q07", control_reason: "q08",
  two_groups: "q09", table_reading: "q10", chart_trend: "q11", evidence_conclusion: "q12", mismatch_revision: "q13", repeatable: "q14"
};

// 若有 workspace，直接對照後台檔案，確保上面的清單本身沒抄錯
const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const block = registry.slice(registry.indexOf("  scientific_method: {"), registry.indexOf("  lab_intro: {"));
  for (const [qid, answer] of Object.entries(backendChoice)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台正解應為「${answer}」`);
  }
}

const choices = ["checkpoint1Choices", "checkpoint2Choices", "checkpoint3Choices", "checkpoint4Choices"].flatMap(constArray);
assert.equal(choices.length, 11);
const internalTerms = /資料卡|觀察紀錄|證據範圍|判讀條件|候選|儀表板|掃描|canonical|題前卡/;
for (const item of choices) {
  const qid = localToQ[item.id];
  assert.ok(qid, `未知題目 ${item.id}`);
  assert.equal(item.answer, backendChoice[qid], `${qid} 正解文字不可改`);
  assert.equal(item.options.filter((option) => option === item.answer).length, 1, `${qid} 正解應恰好出現一次`);
  assert.equal(new Set(item.options).size, 4, `${qid} 選項不可重複`);
  const longestWrong = Math.max(...item.options.filter((o) => o !== item.answer).map((o) => [...o].length));
  assert.ok([...item.answer].length - longestWrong <= 5, `${qid} 正解比誘答長太多：${item.answer}`);
  for (const text of [item.prompt, item.hint, ...item.options]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}

// 分類／排序：代號與後台答案一致（文字可改）
const sequence = constArray("sequenceSteps").sort((a, b) => a.order - b.order).map((s) => s.id);
assert.deepEqual(sequence, ["observe", "question", "research", "hypothesis", "experiment", "analyze", "conclusion"]);
assert.deepEqual(Object.fromEntries(constArray("observationItems").map((i) => [i.id, i.answer])), { room_95: "observation", fridge_no_mold: "observation", cold_inhibits: "inference", spots_more: "observation" });
assert.deepEqual(Object.fromEntries(constArray("variableItems").map((i) => [i.id, i.answer])), { temperature: "manipulated", mold_ratio: "responding", toast_size: "controlled", days: "controlled", bag_type: "controlled" });
const variableTitles = constArray("variableCategories").map((c) => c.title).join("");
for (const term of ["操作變因", "應變變因", "控制變因"]) assert.ok(variableTitles.includes(term), `變因分類欄要用課本名稱：${term}`);

// 學生看得到的關卡標題、準備頁、說明不含內部用語
for (const phrase of ["證據儀表板", "趨勢掃描", "變因偵查室", "整理證據工具", "調查站掃描提醒", "角色形象已接入", "提示只會提醒", "觀察紀錄與推論說明"]) {
  assert.ok(!source.includes(phrase), `不應再出現：${phrase}`);
}

console.log("scientific method wording r3 test passed");
