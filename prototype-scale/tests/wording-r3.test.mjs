#!/usr/bin/env node
// ROADMAP R3 第 10 站題目用語修正（2026-10-31）：
// - 第 10 站後台以選項代號比對 → 正解代號、排序與配對答案與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、配對欄位不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - QUESTION_VERSION 不變
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
  const body = source.slice(start + `const ${name} = `.length, end + close.length - 1);
  return Function(`"use strict"; return ${body};`)();
}

// 後台正解（scale，question_version 20260711-scale-security-v1）
const backend = {
  q03: "mm_um", q04: "a_larger", q06: "compound", q07: "fit_purpose", q08: "microscope_cells", q09: "one_hundred_um",
  q10: "image_only", q11: "use_scale_bar", q12: "two_mm", q13: "check_evidence", q14: "unit_relations"
};
const backendMapping = {
  q02: { door: "m", tree: "m", rice: "mm", cell: "um" },
  q05: { classroom: "tape", leaf: "magnifier", onion: "compound", height: "height_rule" }
};
const sequence = ["backpack", "leaf", "ant", "rice", "cell"];

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  scale: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes('question_version: "20260711-scale-security-v1"'));
  assert.ok(block.includes(`q01: { type: "sequence", answer: ${JSON.stringify(sequence).replace(/,/g, ", ")}`), "q01 後台排序答案不符");
  for (const [qid, answer] of Object.entries(backend)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  }
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台配對答案不符`);
  }
}

assert.ok(source.includes('const QUESTION_VERSION = "20260711-scale-security-v1"'), "question_version 不可改");
assert.ok(source.includes(`const correctSequence = ${JSON.stringify(sequence).replace(/,/g, ", ")};`), "排序答案不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|未標註|干擾|脈絡|較支持|較合理|最合理|最可能|最適合|最合適|最符合|較符合|檢核|修正合理|哪個比較正確|題卡|指定|大小軸|目標細胞/;
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
  for (const text of [q.prompt, q.hint, ...texts]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}
const steps = constValue("sequenceSteps");
assert.deepEqual(steps.map((s) => s.id).sort(), [...sequence].sort(), "排序卡代號不可改");
for (const step of steps) assert.ok(!internalTerms.test(step.label), `排序卡含內部用語：${step.label}`);

const classify = constValue("classifyQuestions", "{", "\n};");
for (const [qid, map] of Object.entries(backendMapping)) {
  assert.deepEqual(Object.fromEntries(classify[qid].items.map((item) => [item.id, item.answer])), map, `${qid} 配對答案不可改`);
  const labels = classify[qid].options.map((o) => o.label);
  assert.equal(new Set(labels).size, labels.length, `${qid} 選項名稱不可重複`);
  for (const text of [classify[qid].prompt, classify[qid].hint, ...labels, ...classify[qid].items.map((i) => i.label)]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}
// q05 兩個量長度的工具名稱不可互相包含（原本「捲尺或皮尺」「身高尺或皮尺」都有皮尺）
const q05Labels = classify.q05.options.map((o) => o.label);
for (const a of q05Labels) for (const b of q05Labels) if (a !== b) assert.ok(!a.includes(b), `q05 工具名稱重疊：${a}／${b}`);

const screens = source.slice(source.indexOf("function renderQuestionImage("), source.indexOf("function isCorrect(qid)"))
  + source.slice(source.indexOf("function misconceptionText("), source.indexOf("function buildBackendPayload("));
assert.ok(!/資料卡|掃描|未標註|判讀|較合理|檢核|證據|題卡|目標細胞/.test(screens), "簡報、準備頁、關卡、回饋或回報畫面仍有內部用語");

console.log("scale wording r3 test passed");
