
/* ===== 虛擬實驗台 ===== */
const LAB_SAMPLES = [
  { id: "A", label: "甲", look: "白色、混濁", base: "#efe9dc", identity: "麵粉水", starch: true, glucose: false, reveal: "麵粉的主要成分是澱粉，所以碘液變成藍黑色。" },
  { id: "B", label: "乙", look: "透明、無色", base: "#e3f1f7", identity: "葡萄糖水", starch: false, glucose: true, reveal: "看起來和清水一模一樣，卻含有葡萄糖。只看外觀是判斷不出來的。" },
  { id: "C", label: "丙", look: "淡黃色、有油光", base: "#f0d77e", identity: "沙拉油", starch: false, glucose: false, reveal: "兩種檢驗都沒有反應，但沙拉油含有大量的脂質。沒有變色，只代表沒有驗出澱粉和葡萄糖。" },
  { id: "D", label: "丁", look: "清水（對照組）", base: "#e3f1f7", identity: "清水", control: true, starch: false, glucose: false, reveal: "清水是對照組，讓你知道「沒有反應」時試劑是什麼顏色。" }
];
const LAB_COLORS = {
  iodinePositive: { color: "#1d2142", text: "藍黑色" },
  iodineNegative: { color: "#b8792f", text: "黃褐色（碘液原本的顏色）" },
  benedictBlue: { color: "#3a7fd5", text: "藍色" },
  benedictPositive: { color: "#dc5a20", text: "橙紅色" }
};
function labSample(id) { return LAB_SAMPLES.find((sample) => sample.id === id); }
function labResult(sampleId, test) {
  const sample = labSample(sampleId);
  if (test === "iodine") return sample.starch ? LAB_COLORS.iodinePositive : LAB_COLORS.iodineNegative;
  if (test === "benedictCold") return LAB_COLORS.benedictBlue;
  if (test === "benedictHot") return sample.glucose ? LAB_COLORS.benedictPositive : LAB_COLORS.benedictBlue;
  return { color: sample.base, text: sample.look };
}
function labState() {
  state.lab ||= {};
  const lab = state.lab;
  lab.iodine ||= {}; lab.benedict ||= {}; lab.judge ||= {};
  return lab;
}
function labIodineDone() { const lab = labState(); return LAB_SAMPLES.every((sample) => lab.iodine[sample.id]); }
function labBenedictAdded() { const lab = labState(); return LAB_SAMPLES.every((sample) => lab.benedict[sample.id]); }
function labTestsDone() { return labIodineDone() && labBenedictAdded() && Boolean(labState().heated); }
function labJudgeTargets() { return LAB_SAMPLES.filter((sample) => !sample.control); }
function labJudgeCorrect() {
  const lab = labState();
  return labJudgeTargets().every((sample) => lab.judge[sample.id]?.starch === (sample.starch ? "yes" : "no") && lab.judge[sample.id]?.glucose === (sample.glucose ? "yes" : "no"));
}
function labComplete() { const lab = labState(); return labTestsDone() && Boolean(lab.judgedOk); }

function tubeSvg(color, opts = {}) {
  const level = opts.level ?? 0.55;
  const top = 18 + (1 - level) * 96;
  const id = `clip_${Math.random().toString(36).slice(2, 8)}`;
  return `<svg class="lab-tube-svg${opts.mini ? " mini" : ""}" viewBox="0 0 44 140" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="M8 10 H36 V112 a14 14 0 0 1 -28 0 Z"/></clipPath></defs>
    <path d="M8 10 H36 V112 a14 14 0 0 1 -28 0 Z" fill="rgba(255,255,255,.55)"/>
    <g clip-path="url(#${id})"><rect class="lab-liquid" x="0" y="${top}" width="44" height="140" style="fill:${color}"/>${opts.oil ? `<rect x="0" y="${top}" width="44" height="7" fill="rgba(255,236,150,.85)"/>` : ""}</g>
    <path d="M8 10 H36 V112 a14 14 0 0 1 -28 0 Z" fill="none" stroke="#5b7f86" stroke-width="2.4"/>
    <path d="M4 10 H40" stroke="#5b7f86" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 22 V104" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function labTubeCell(sample, test) {
  const lab = labState();
  let color = sample.base; let caption = sample.look; let action = ""; let done = false;
  if (test === "look") {
    const picked = lab.prediction === sample.id;
    return `<button class="lab-tube${picked ? " picked" : ""}" data-lab-predict="${sample.id}" aria-pressed="${picked}">${tubeSvg(sample.base, { oil: sample.id === "C" })}<span class="lab-tube-label">${sample.label}</span><small>${sample.look}</small></button>`;
  }
  if (test === "iodine") {
    done = Boolean(lab.iodine[sample.id]);
    if (done) { const r = labResult(sample.id, "iodine"); color = r.color; caption = r.text.replace("（碘液原本的顏色）", ""); }
    action = done ? "" : `<button class="lab-action" data-lab-iodine="${sample.id}">滴入碘液</button>`;
  }
  if (test === "benedict") {
    done = Boolean(lab.benedict[sample.id]);
    if (done) { const r = labResult(sample.id, lab.heated ? "benedictHot" : "benedictCold"); color = r.color; caption = lab.heated ? `加熱後：${r.text}` : `剛加入：${r.text}`; }
    action = done ? "" : `<button class="lab-action" data-lab-benedict="${sample.id}">加入本氏液</button>`;
  }
  return `<div class="lab-tube${done ? " done" : ""}" data-lab-tube="${test}-${sample.id}"><div class="lab-dropper" aria-hidden="true"></div>${tubeSvg(color, { oil: sample.id === "C" && !done })}<span class="lab-tube-label">${sample.label}${sample.control ? "<em>對照</em>" : ""}</span><small>${caption}</small>${action}</div>`;
}

function labRecordTable() {
  const lab = labState();
  const cell = (sampleId, test, ok) => ok ? `<span class="lab-chip" style="--chip:${labResult(sampleId, test).color}">${labResult(sampleId, test).text.replace("（碘液原本的顏色）", "")}</span>` : `<span class="muted">—</span>`;
  return `<div class="lab-record" role="table" aria-label="實驗紀錄表">
    <div class="lab-record-row head" role="row"><span role="columnheader">試管</span><span role="columnheader">滴入碘液</span><span role="columnheader">本氏液（剛加入）</span><span role="columnheader">本氏液（隔水加熱後）</span></div>
    ${LAB_SAMPLES.map((sample) => `<div class="lab-record-row" role="row"><span role="cell"><strong>${sample.label}</strong>${sample.control ? "（清水）" : ""}</span><span role="cell">${cell(sample.id, "iodine", lab.iodine[sample.id])}</span><span role="cell">${cell(sample.id, "benedictCold", lab.benedict[sample.id])}</span><span role="cell">${cell(sample.id, "benedictHot", lab.benedict[sample.id] && lab.heated)}</span></div>`).join("")}
  </div>`;
}

function labJudgeBlock() {
  const lab = labState();
  const seg = (sampleId, key, value, label) => { const on = lab.judge[sampleId]?.[key] === value; return `<button class="lab-seg${on ? " on" : ""}" data-lab-judge="${sampleId}" data-key="${key}" data-value="${value}" aria-pressed="${on}">${label}</button>`; };
  const mark = (sample) => {
    if (!lab.judgeChecked) return "";
    const ok = lab.judge[sample.id]?.starch === (sample.starch ? "yes" : "no") && lab.judge[sample.id]?.glucose === (sample.glucose ? "yes" : "no");
    return ok ? `<span class="pill good">與紀錄相符</span>` : `<span class="pill warn">再看一次紀錄表</span>`;
  };
  return `<div class="lab-judge">${labJudgeTargets().map((sample) => `<div class="lab-judge-row"><strong>${sample.label}</strong>
      <div><span>澱粉</span>${seg(sample.id, "starch", "yes", "有驗出")}${seg(sample.id, "starch", "no", "沒驗出")}</div>
      <div><span>葡萄糖</span>${seg(sample.id, "glucose", "yes", "有驗出")}${seg(sample.id, "glucose", "no", "沒驗出")}</div>${mark(sample)}</div>`).join("")}</div>`;
}

function labRevealBlock() {
  const lab = labState();
  const guess = lab.prediction === "none" ? "看不出來" : labSample(lab.prediction)?.label;
  const guessNote = lab.prediction === "A"
    ? "你一開始就猜對了，而且現在有實驗證據支持。"
    : `你一開始猜「${guess || "—"}」，實驗證據顯示含澱粉的是甲。外觀只能猜，檢驗才是證據。`;
  return `<div class="lab-reveal"><strong>揭曉：四支試管裝的是什麼？</strong>
    <div class="lab-reveal-grid">${LAB_SAMPLES.map((sample) => `<div class="lab-reveal-card">${tubeSvg(sample.base, { mini: true, oil: sample.id === "C" })}<div><b>${sample.label}｜${sample.identity}</b><p>${sample.reveal}</p></div></div>`).join("")}</div>
    <p class="lab-guess-note">${guessNote}</p></div>`;
}

function renderLab() {
  const lab = labState();
  const step1 = Boolean(lab.prediction);
  const step2 = step1 && labIodineDone();
  const step3 = step2 && labBenedictAdded();
  const tests = labTestsDone();
  const section = (n, title, open, body, doneFlag) => `<section class="lab-step${open ? "" : " locked"}${doneFlag ? " complete" : ""}"><header><span class="lab-step-no">${doneFlag ? "✓" : n}</span><h3>${title}</h3></header>${open ? body : `<p class="muted">完成上一步後開啟。</p>`}</section>`;

  const predictBody = `<p>桌上有四支試管，丁是清水，甲、乙、丙是看不出成分的食物樣品。<strong>只看外觀，你覺得哪一支含有澱粉？</strong></p>
    <div class="lab-rack">${LAB_SAMPLES.filter((s) => !s.control).map((sample) => labTubeCell(sample, "look")).join("")}<button class="lab-tube lab-none${lab.prediction === "none" ? " picked" : ""}" data-lab-predict="none" aria-pressed="${lab.prediction === "none"}"><span class="lab-q">?</span><small>看不出來</small></button></div>`;

  const iodineBody = `<p>在每一支試管滴入碘液，觀察顏色變化。（碘液本身是黃褐色）</p><div class="lab-rack">${LAB_SAMPLES.map((sample) => labTubeCell(sample, "iodine")).join("")}</div>`;

  const benedictBody = `<p>另取一份樣品，在每一支試管加入本氏液。</p><div class="lab-rack">${LAB_SAMPLES.map((sample) => labTubeCell(sample, "benedict")).join("")}</div>
    ${labBenedictAdded() && !lab.heated ? `<div class="lab-heat-panel"><p><strong>剛加入本氏液，四支都是藍色。</strong>接下來要把試管放進熱水中隔水加熱。</p>
      <div class="lab-safety"><button class="lab-goggles${lab.goggles ? " on" : ""}" data-lab-goggles aria-pressed="${Boolean(lab.goggles)}"><span aria-hidden="true">🥽</span>${lab.goggles ? "已戴上護目鏡" : "戴上護目鏡"}</button><span class="muted">加熱時試管口不要朝向自己或別人。</span></div>
      <button class="primary" data-lab-heat ${lab.goggles ? "" : "disabled"}>放入熱水中隔水加熱</button></div>` : ""}
    <div class="lab-bath${lab.heating ? " heating" : ""}" aria-hidden="true"><span></span><span></span><span></span><span></span></div>`;

  const recordBody = `${labRecordTable()}<p class="muted">紀錄表會隨著你的操作自動填入。</p>`;

  const judgeBody = `<p>根據紀錄表，判斷甲、乙、丙各有沒有驗出澱粉和葡萄糖。（不計分，可以修改）</p>${labJudgeBlock()}
    <div class="actions"><button class="secondary" data-lab-check>核對我的判斷</button></div>${lab.judgedOk ? labRevealBlock() : ""}`;

  return `<div class="wide-layout"><div class="panel lab-panel"><p class="eyebrow">實驗台</p><h2>親手檢驗四支未知樣品</h2>
    <div class="story-panel highlight"><strong>任務</strong><p>用碘液和本氏液檢驗四支試管，把結果當作證據。這一頁不計分，等一下的題目會用到你在這裡看到的結果。</p></div>
    ${section(1, "先猜猜看", true, predictBody, step1)}
    ${section(2, "碘液檢驗", step1, iodineBody, step2)}
    ${section(3, "本氏液檢驗", step2, benedictBody, tests)}
    ${section(4, "實驗紀錄表", step2, recordBody, tests)}
    ${section(5, "根據紀錄判斷", tests, judgeBody, Boolean(lab.judgedOk))}
    <div class="actions"><button class="primary" id="labNext" ${labComplete() ? "" : "disabled"}>${labComplete() ? "開始作答" : "完成實驗與判斷後開始作答"}</button></div>
  </div></div>`;
}

function animateTube(cellKey, color, then) {
  const cell = document.querySelector(`[data-lab-tube="${cellKey}"]`);
  if (!cell) return then();
  cell.classList.add("dropping");
  setTimeout(() => {
    const liquid = cell.querySelector(".lab-liquid");
    if (liquid) liquid.style.fill = color;
    setTimeout(then, 750);
  }, 450);
}

function attachLab() {
  const lab = labState();
  document.querySelectorAll("[data-lab-predict]").forEach((button) => button.addEventListener("click", () => {
    lab.prediction = button.dataset.labPredict; saveState(); render();
  }));
  document.querySelectorAll("[data-lab-iodine]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.labIodine; button.disabled = true;
    animateTube(`iodine-${id}`, labResult(id, "iodine").color, () => { lab.iodine[id] = true; saveState(); render(); });
  }));
  document.querySelectorAll("[data-lab-benedict]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.labBenedict; button.disabled = true;
    animateTube(`benedict-${id}`, LAB_COLORS.benedictBlue.color, () => { lab.benedict[id] = true; saveState(); render(); });
  }));
  const goggles = document.querySelector("[data-lab-goggles]");
  if (goggles) goggles.addEventListener("click", () => { lab.goggles = !lab.goggles; saveState(); render(); });
  const heat = document.querySelector("[data-lab-heat]");
  if (heat) heat.addEventListener("click", () => {
    heat.disabled = true;
    document.querySelector(".lab-bath")?.classList.add("heating");
    LAB_SAMPLES.forEach((sample) => {
      const liquid = document.querySelector(`[data-lab-tube="benedict-${sample.id}"] .lab-liquid`);
      if (liquid) { liquid.classList.add("slow"); liquid.style.fill = labResult(sample.id, "benedictHot").color; }
    });
    setTimeout(() => { lab.heated = true; saveState(); render(); }, 2600);
  });
  document.querySelectorAll("[data-lab-judge]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.labJudge;
    lab.judge[id] ||= {}; lab.judge[id][button.dataset.key] = button.dataset.value;
    lab.judgeChecked = false; saveState(); render();
  }));
  const check = document.querySelector("[data-lab-check]");
  if (check) check.addEventListener("click", () => {
    lab.judgeChecked = true; lab.judgedOk = labJudgeCorrect(); saveState(); render();
  });
  const next = document.querySelector("#labNext");
  if (next) next.addEventListener("click", () => { if (!labComplete()) return; unlock("checkpoint1"); setScreen("checkpoint1"); });
}

function renderLabEvidence(question) {
  if (!question?.lab) return "";
  const sample = labSample(question.lab.sample);
  const names = { iodine: "滴入碘液", benedictCold: "本氏液剛加入", benedictHot: "本氏液隔水加熱後" };
  return `<section class="lab-evidence" aria-label="你的實驗紀錄"><strong>你的實驗紀錄｜${sample.label}試管${sample.control ? "（清水）" : ""}</strong><div class="lab-evidence-row">${question.lab.show.map((test) => { const r = labResult(sample.id, test); return `<div class="lab-evidence-item">${tubeSvg(r.color, { mini: true })}<span>${names[test]}<b>${r.text.replace("（碘液原本的顏色）", "")}</b></span></div>`; }).join("")}</div></section>`;
}
