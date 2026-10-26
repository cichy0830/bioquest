#!/usr/bin/env node
// ROADMAP R3 第 3 站題目用語修正（2026-10-26）：
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

// 後台正解（lab_intro，question_version 20260720-lab-intro-canonical-v1）
const backendChoice = {
  q02: "量筒",
  q03: "試管",
  q04: "滴管",
  q06: "不擅自打開，先依教師指示確認",
  q07: "試管口不要朝向自己或他人",
  q09: "依教師指示倒入指定廢液容器或處理位置",
  q10: "實驗室可能有火源、玻璃與藥品，跑動會增加碰撞與翻倒風險",
  q11: "燒杯刻度多用於粗略估計，較準確量體積應選合適的量測器材",
  q13: "如實記錄結果與可能異常，再和老師討論"
};
const backendSet = {
  q05: ["載玻片", "蓋玻片", "滴管", "鑷子"],
  q12: ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"]
};
const backendMapping = { cylinder: "量取液體體積", beaker: "盛裝、混合或加熱液體", test_tube: "少量反應或觀察", dropper: "少量滴加液體", forceps: "夾取小物", slide: "承載觀察標本" };
const backendSequence = ["stop", "warn", "tell_teacher", "tool_cleanup"];
const localToQ = {
  measure_20ml: "q02", small_reaction: "q03", water_drop: "q04", unknown_bottle: "q06", heat_direction: "q07",
  waste_liquid: "q09", running_lab: "q10", beaker_precision: "q11", honest_record: "q13"
};

// 若有 workspace，直接對照後台檔案，確保上面的清單本身沒抄錯
const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const block = registry.slice(registry.indexOf("  lab_intro: {"), registry.indexOf("  microscope_use: {"));
  for (const [qid, answer] of Object.entries(backendChoice)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台正解應為「${answer}」`);
  }
  for (const [qid, answer] of Object.entries(backendSet)) {
    assert.ok(block.includes(`${qid}: { type: "set", answer: ${JSON.stringify(answer).replace(/","/g, '", "')}`), `${qid} 後台正解應為 ${answer.join("、")}`);
  }
  const mappingText = Object.entries(backendMapping).map(([k, v]) => `${k}: "${v}"`).join(", ");
  assert.ok(block.includes(`q01: { type: "mapping", answer: { ${mappingText} }`), "q01 後台配對答案不符");
  assert.ok(block.includes(`q08: { type: "sequence", answer: ${JSON.stringify(backendSequence).replace(/","/g, '", "')}`), "q08 後台排序答案不符");
}

const internalTerms = /資料卡|觀察紀錄|證據|判讀條件|候選|儀表板|掃描|canonical|題前卡|訓練站|風險線索/;
const choices = ["checkpoint1Choices", "checkpoint2Choices", "checkpoint3Choices"].flatMap((name) => constValue(name));
assert.equal(choices.length, 9);
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

// 複選題：正解文字與後台一致、都在選項中
for (const [name, qid] of [["slideToolsQuestion", "q05"], ["chemicalRulesQuestion", "q12"]]) {
  const item = constValue(name, "{", "\n};");
  assert.deepEqual(item.answer, backendSet[qid], `${qid} 複選正解文字不可改`);
  for (const answer of item.answer) assert.ok(item.options.includes(answer), `${qid} 正解「${answer}」不在選項中`);
  for (const text of [item.prompt, item.hint, ...item.options]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}

// 配對題：每個器材的正解用途與後台一致，且在下拉選項中
const apparatus = constValue("apparatusItems");
assert.deepEqual(Object.fromEntries(apparatus.map((i) => [i.id, i.answer])), backendMapping);
const apparatusOptions = constValue("apparatusOptions", "[", "];");
for (const value of Object.values(backendMapping)) assert.ok(apparatusOptions.includes(value), `q01 用途「${value}」不在選項中`);

// 排序題：代號與後台答案一致（文字可改）
assert.deepEqual(constValue("sequenceSteps").sort((a, b) => a.order - b.order).map((s) => s.id), backendSequence);

// 學生看得到的關卡標題、準備頁、說明不含內部用語
for (const phrase of ["器材準備台", "安全風險掃描", "收拾與紀錄檢查", "安全態度確認", "角色形象已接入", "提示只會引導", "提示只提供風險處理方向", "不會直接公布器材或安全答案", "安全訓練站已開啟"]) {
  assert.ok(!source.includes(phrase), `不應再出現：${phrase}`);
}

console.log("lab entry wording r3 test passed");
