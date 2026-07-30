const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "..");
const artifactDir = path.join(__dirname, "artifacts", "cell-structure-achievement-avatar-v1");

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "");
    const filePath = path.resolve(workspaceRoot, cleanPath || "index.html");
    if (!filePath.startsWith(workspaceRoot)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".webp": "image/webp",
        ".png": "image/png"
      };
      res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/prototype-cell-structure/index.html?v=20260731-cell-structure-submitted-retry-ia-v1`
      });
    });
  });
}

function stateFor(student) {
  return {
    screen: "achievements",
    student,
    attempt_type: "first",
    started_at: "2026-07-15T00:00:00.000Z",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements", "rules"],
    answers: {
      checkpoint1: {},
      checkpoint1Hints: {},
      checkpoint2: {},
      checkpoint2Hints: {},
      checkpoint3: {},
      checkpoint3Hints: {},
      checkpoint4: {},
      checkpoint4Hints: {},
      reviewNotes: {},
      reflection: {}
    },
    optionOrders: {},
    result: null,
    submitted_at: null,
    activeDiagramType: "animal",
    activeStructure: "",
    structureTargetResults: {},
    structureTransitionNotice: "",
    lockNotice: ""
  };
}

function attemptsFor(studentId, exp) {
  return [{
    student: { student_id: studentId },
    total_exp: exp,
    badges: ["細胞工廠入門徽章"]
  }];
}

async function openAchievements(browser, url, viewport, student, exp, label) {
  const context = await browser.newContext({ viewport });
  const errors = [];
  context.on("page", (page) => {
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
  });
  await context.addInitScript(({ state, attempts }) => {
    try {
      if (location.protocol !== "http:") return;
      localStorage.setItem("bioquest_cell_structure_state_v1", JSON.stringify(state));
      localStorage.setItem("bioquest_attempts_v1", JSON.stringify(attempts));
    } catch {}
  }, { state: stateFor(student), attempts: attemptsFor(student.student_id, exp) });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector(".title-avatar-card.achievements");
  await page.locator(".title-avatar-card.achievements").scrollIntoViewIfNeeded();
  const metrics = await page.locator(".title-avatar-card.achievements").evaluate((card) => {
    const visual = card.querySelector(".title-avatar-visual");
    const image = visual.querySelector("img");
    const textBlock = visual.nextElementSibling;
    const cardBox = card.getBoundingClientRect();
    const visualBox = visual.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const textBox = textBlock.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    return {
      cardWidth: cardBox.width,
      visualWidth: visualBox.width,
      visualHeight: visualBox.height,
      imageWidth: imageBox.width,
      imageHeight: imageBox.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      objectFit: getComputedStyle(image).objectFit,
      objectPosition: getComputedStyle(image).objectPosition,
      visualOverflow: getComputedStyle(visual).overflow,
      cardOverflow: getComputedStyle(card).overflow,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      imageInsideVisual: imageBox.top >= visualBox.top - 1 && imageBox.bottom <= visualBox.bottom + 1 && imageBox.left >= visualBox.left - 1 && imageBox.right <= visualBox.right + 1,
      textClear: textBox.top >= visualBox.top ? textBox.top - visualBox.bottom >= -1 : visualBox.left - textBox.right >= -1,
      src: image.getAttribute("src"),
      complete: image.complete
    };
  });
  assert.ok(metrics.naturalWidth > 0 && metrics.naturalHeight > 0, `${label} avatar must load`);
  assert.equal(metrics.objectFit, "contain", `${label} avatar must use contain`);
  assert.ok(/center|50%/.test(metrics.objectPosition), `${label} avatar should stay horizontally centered`);
  assert.notEqual(metrics.visualOverflow, "hidden", `${label} visual must not crop by overflow hidden`);
  assert.notEqual(metrics.cardOverflow, "hidden", `${label} card must not crop avatar`);
  assert.ok(metrics.imageInsideVisual, `${label} image element must stay inside visual area: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.visualHeight >= 220, `${label} visual needs enough height for full body`);
  assert.ok(metrics.visualHeight / metrics.visualWidth >= 1.35, `${label} visual should be portrait-oriented`);
  assert.equal(metrics.horizontalOverflow, 0, `${label} must not cause horizontal overflow`);
  assert.ok(metrics.textClear >= -1, `${label} avatar must not overlap text`);
  assert.deepEqual(errors, []);
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}-${label}.png`) });
  await context.close();
  return metrics;
}

(async () => {
  const serverInfo = await startServer();
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const maleStudent = {
      student_id: "guest",
      class_name: "測試",
      seat_no: "00",
      student_name: "老師測試帳號",
      profile_gender: "male",
      is_guest: true
    };
    const femaleStudent = {
      student_id: "S79997",
      class_name: "七年級",
      seat_no: "12",
      student_name: "測試學生",
      profile_gender: "female",
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "../shared-assets/title-avatars/title-02-life_observer-female.webp",
      is_guest: false
    };
    await openAchievements(browser, serverInfo.url, { width: 390, height: 844 }, maleStudent, 0, "mobile-male-trainee");
    await openAchievements(browser, serverInfo.url, { width: 390, height: 844 }, femaleStudent, 500, "mobile-female-life-observer");
    await openAchievements(browser, serverInfo.url, { width: 1440, height: 900 }, maleStudent, 0, "desktop-male-trainee");
    await openAchievements(browser, serverInfo.url, { width: 1440, height: 900 }, femaleStudent, 500, "desktop-female-life-observer");
  } finally {
    await browser.close();
    serverInfo.server.close();
  }
  console.log(`cell_structure achievement avatar regression passed; artifacts: ${artifactDir}`);
})();
