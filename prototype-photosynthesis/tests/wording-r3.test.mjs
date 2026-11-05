#!/usr/bin/env node
// ROADMAP R3 第 14 站題目用語修正（2026-11-05）：
// - 第 14 站後台以選項代號比對 → 選擇、配對、複選答案與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、配對欄位、表格與圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - 準備頁複習卡只放前面站學過的內容（佇列 W19 老師原則 A＋C），不直接寫出本站答案；QUESTION_VERSION 不變
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const start = source.indexOf("const questions = [");
const end = source.indexOf("\n];", start);
const questions = Function(`"use strict"; return ${source.slice(start + "const questions = ".length, end + 2)};`)();

const QV = "20260721-photosynthesis-q09-inactive-v1";
const backendChoice = {
  q01: "photosynthesis", q03: "chloroplast", q04: "energy_not_reactant", q06: "oxygen", q07: "green_cells",
  q08: "soil_water_minerals_food_made", q10: "light_starch", q11: "strong_light_more_bubbles", q13: "plants_respire_too", q14: "oxygen_product"
};
const backendMapping = {
  q02: { carbon_dioxide: "reactant", water: "reactant_and_product", light: "energy", glucose: "product", oxygen: "product" },
  q05: { stomata: "gas_exchange", vein: "transport", chloroplast_in_leaf: "site" }
};
const backendSet = { q12: ["light_time", "plant_type_size", "water_amount", "temperature"] };

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const blockStart = registry.indexOf("  photosynthesis: {");
  const block = registry.slice(blockStart, registry.indexOf("\n    reflection:", blockStart));
  assert.ok(block.includes(`question_version: "${QV}"`));
  for (const [qid, answer] of Object.entries(backendChoice)) assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台配對答案不符`);
  }
  for (const [qid, list] of Object.entries(backendSet)) assert.ok(block.includes(`${qid}: { type: "set", answer: [${list.map((v) => `"${v}"`).join(", ")}]`), `${qid} 後台複選答案不符`);
}
assert.ok(source.includes(`const QUESTION_VERSION = "${QV}"`), "question_version 不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|線索|較合理|最合理|最可能|較可能|較適合|最符合|較符合|檢核|概念邊界/;
assert.deepEqual(questions.map((q) => q.id), ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14"]);
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
  } else if (q.type === "set") {
    assert.deepEqual(q.answer, backendSet[q.id], `${q.id} 複選答案不可改`);
    assert.ok(q.options.some((o) => o.id === "co2_supply") && q.options.some((o) => o.id === "container_color"));
    for (const text of q.options.map((o) => o.text)) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
  }
}

const slice = (a, b) => source.slice(source.indexOf(a), source.indexOf(b));
const screens = slice("function renderBrief(", "function renderQuestionControl(") + slice("function renderReview(", "function renderResult(");
assert.ok(!/資料卡|掃描|判讀|較合理|檢核|證據|線索|概念邊界|作答紀錄/.test(screens), "簡報、準備頁、關卡或回饋畫面仍有內部用語");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(!/data-nav="checkpoint3"[^>]*>證據</.test(html), "步驟列不可再用「證據」");
// 準備頁：複習卡只放前面站學過的內容，不直接寫出 q02／q04／q07 的答案
const scan = slice("function renderScan(", "function renderCheckpoint(");
assert.ok(/第 6 站/.test(scan) && /第 12 站/.test(scan), "複習卡應註明是前面哪一站學過的");
assert.ok(!/光提供能量|不是物質原料|也會在過程中生成|含葉綠體的綠色細胞/.test(scan), "準備頁不可直接寫出本站答案");

console.log("photosynthesis wording r3 test passed");
