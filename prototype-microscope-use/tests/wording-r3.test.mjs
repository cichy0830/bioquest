#!/usr/bin/env node
// ROADMAP R3 第 4 站題目用語修正（2026-10-26）：
// - 選擇、複選、配對題正解文字與後台 10_canonical_registry.gs 一字不差（後台以正解文字比對），且正解在選項中
// - 排序題項目代號（id）與後台答案一致
// - 學生看得到的文字不含內部用語
// - 正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
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

// 後台正解（microscope_use，question_version 20260720-microscope-use-canonical-v1）
const backendChoice = {
  q03: "細調節輪",
  q04: "調整光源、反光鏡或光圈",
  q06: "低倍視野較大、較亮，通常較容易先找到標本",
  q07: "輕微轉動細調節輪",
  q08: "一手握鏡臂，一手托鏡座",
  q10: "400x",
  q11: "總倍率應為目鏡倍率乘以物鏡倍率",
  q12: "向左",
  q13: "向右",
  q14: "視野範圍變小、亮度常變暗",
  q15: "高倍能看細節，但視野較小且較暗，找標本時不一定方便"
};
const backendSet = { q09: ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵"] };
const backendParts = { eyepiece: "上方觀察處", objective: "靠近玻片的放大鏡頭", stage: "承放玻片的位置", coarse: "側邊大幅調焦", fine: "側邊微調焦距", light: "載物臺下方調整進光" };
const backendFunctions = { viewing_path: "目鏡", first_magnify: "物鏡", slide_support: "載物臺", large_focus: "粗調節輪", tiny_focus: "細調節輪", brightness_control: "光圈" };
const backendSequence = ["low_power", "place_slide", "adjust_light", "coarse_focus", "fine_focus", "high_power"];
const localToQ = {
  fine_focus: "q03", too_dark: "q04", high_power_first: "q06", high_power_focus: "q07", carry_scope: "q08",
  magnification_400: "q10", magnification_add: "q11", slide_right: "q12", center_right: "q13",
  high_power_change: "q14", high_power_better: "q15"
};

// 若有 workspace，直接對照後台檔案，確保上面的清單本身沒抄錯
const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const block = registry.slice(registry.indexOf("  microscope_use: {"), registry.indexOf("  cell_structure: {"));
  assert.ok(block.includes('question_version: "20260720-microscope-use-canonical-v1"'));
  for (const [qid, answer] of Object.entries(backendChoice)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台正解應為「${answer}」`);
  }
  assert.ok(block.includes(`q09: { type: "set", answer: ${JSON.stringify(backendSet.q09).replace(/","/g, '", "')}`), "q09 後台正解不符");
  const mapText = (obj) => Object.entries(obj).map(([k, v]) => `${k}: "${v}"`).join(", ");
  assert.ok(block.includes(`q01: { type: "mapping", answer: { ${mapText(backendParts)} }`), "q01 後台配對答案不符");
  assert.ok(block.includes(`q02: { type: "mapping", answer: { ${mapText(backendFunctions)} }`), "q02 後台配對答案不符");
  assert.ok(block.includes(`q05: { type: "sequence", answer: ${JSON.stringify(backendSequence).replace(/","/g, '", "')}`), "q05 後台排序答案不符");
}

assert.ok(source.includes('const QUESTION_VERSION = "20260720-microscope-use-canonical-v1"'), "QUESTION_VERSION 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|儀表板|掃描|校準|canonical|題前卡|訓練站/;
const choices = ["checkpoint1Choices", "checkpoint2Choices", "checkpoint3Choices"].flatMap((name) => constValue(name));
assert.equal(choices.length, 11);
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

// 複選題 q09
const storage = constValue("storageQuestion", "{", "\n};");
assert.deepEqual(storage.answer, backendSet.q09, "q09 複選正解文字不可改");
for (const answer of storage.answer) assert.ok(storage.options.includes(answer), `q09 正解「${answer}」不在選項中`);

// 配對題 q01（點圖）、q02（下拉）
const parts = constValue("partItems");
assert.deepEqual(Object.fromEntries(parts.map((i) => [i.id, i.answer])), backendParts);
const partOptions = constValue("partPositionOptions", "[", "];");
for (const value of Object.values(backendParts)) assert.ok(partOptions.includes(value), `q01「${value}」不在選項中`);
const functions = constValue("functionItems");
assert.deepEqual(Object.fromEntries(functions.map((i) => [i.id, i.answer])), backendFunctions);
const functionOptions = constValue("functionOptions", "[", "];");
for (const value of Object.values(backendFunctions)) assert.ok(functionOptions.includes(value), `q02「${value}」不在選項中`);

// 排序題 q05：代號與後台答案一致（文字可改）
assert.deepEqual(constValue("sequenceSteps").sort((a, b) => a.order - b.order).map((s) => s.id), backendSequence);

// 學生看得到的關卡標題、準備頁、說明不含內部用語，也不再直接寫出 q12／q14 的答案
for (const phrase of [
  "部位與功能掃描", "倍率與視野校準", "觀察安全確認", "校準微觀視野", "顯微掃描提醒", "進入部位掃描", "顯微觀察訓練站",
  "提示只會引導", "提示只提供操作邏輯", "先校準概念",
  "玻片標本往左移，視野中的影像會往右", "視野較暗、範圍較窄", "一定向上", "用力轉粗調節輪"
]) {
  assert.ok(!source.includes(phrase), `不應再出現：${phrase}`);
}

console.log("microscope use wording r3 test passed");
