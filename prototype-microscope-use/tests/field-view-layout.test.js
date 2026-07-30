const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BQ_TEST_ROOT ? path.resolve(process.env.BQ_TEST_ROOT) : path.resolve(__dirname, "..");
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=20260730-microscope-use-submitted-retry-ia-v1`;

async function fieldState(page) {
  return page.evaluate(() => {
    const frame = document.querySelector(".field-demo");
    const image = document.querySelector(".field-view-image");
    const readout = document.querySelector(".direction-readout");
    const frameBox = frame.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    return {
      view: frame.dataset.fieldView,
      src: new URL(image.currentSrc || image.src).pathname.split("/").pop(),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      objectFit: style.objectFit,
      frame: { width: frameBox.width, height: frameBox.height },
      image: { left: imageBox.left, top: imageBox.top, right: imageBox.right, bottom: imageBox.bottom },
      bounds: { left: frameBox.left, top: frameBox.top, right: frameBox.right, bottom: frameBox.bottom },
      readout: readout.textContent.replace(/\s+/g, " ").trim(),
      pageWidth: document.documentElement.scrollWidth
    };
  });
}

function assertContained(state, viewport) {
  assert.equal(state.complete, true);
  assert.ok(state.naturalWidth > 0 && state.naturalHeight > 0, "approved field image must load");
  assert.equal(state.objectFit, "contain");
  assert.ok(state.image.left >= state.bounds.left - 1 && state.image.right <= state.bounds.right + 1);
  assert.ok(state.image.top >= state.bounds.top - 1 && state.image.bottom <= state.bounds.bottom + 1);
  assert.ok(Math.abs(state.frame.width - state.frame.height) <= 1, "field frame must retain a stable square ratio");
  assert.ok(state.pageWidth <= viewport.width + 1, "field demo must not create horizontal overflow");
}

async function setSlider(page, value) {
  await page.locator("#fieldShiftSlider").evaluate((slider, nextValue) => {
    slider.value = String(nextValue);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await page.waitForFunction((expected) => document.querySelector("#fieldShiftSlider")?.value === String(expected), value);
  const expectedAsset = value < 0
    ? "img-microscope-paramecium-view-right.webp"
    : value > 0
      ? "img-microscope-paramecium-view-left.webp"
      : "img-microscope-paramecium-view-center.webp";
  await waitForFieldImage(page, expectedAsset);
  return fieldState(page);
}

async function waitForFieldImage(page, expectedAsset) {
  try {
    await page.waitForFunction((asset) => {
      const image = document.querySelector(".field-view-image");
      return image?.complete && image.naturalWidth > 0 && image.src.includes(asset);
    }, expectedAsset, { timeout: 8000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const image = document.querySelector(".field-view-image");
      return image ? {
        src: image.src,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        hidden: image.hidden,
        frameClass: image.parentElement?.className || ""
      } : { missing: true };
    });
    throw new Error(`field image failed to load: ${expectedAsset} ${JSON.stringify(diagnostic)} (${error.message})`);
  }
}

async function checkViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#guestButton").click();
  await page.locator("#briefNext").waitFor({ state: "visible" });
  await page.evaluate(() => setScreen("checkpoint3"));
  await page.locator(".field-view-image").waitFor({ state: "visible" });
  await waitForFieldImage(page, "img-microscope-paramecium-view-center.webp");

  const center = await fieldState(page);
  assert.equal(center.view, "center");
  assert.equal(center.src, "img-microscope-paramecium-view-center.webp");
  assert.match(center.readout, /玻片：置中/);
  assert.match(center.readout, /視野影像：置中/);
  assertContained(center, viewport);

  const slideLeft = await setSlider(page, -1);
  assert.equal(slideLeft.view, "right");
  assert.equal(slideLeft.src, "img-microscope-paramecium-view-right.webp");
  assert.match(slideLeft.readout, /玻片：向左/);
  assert.match(slideLeft.readout, /視野影像：向右/);
  assertContained(slideLeft, viewport);

  const slideRight = await setSlider(page, 1);
  assert.equal(slideRight.view, "left");
  assert.equal(slideRight.src, "img-microscope-paramecium-view-left.webp");
  assert.match(slideRight.readout, /玻片：向右/);
  assert.match(slideRight.readout, /視野影像：向左/);
  assertContained(slideRight, viewport);

  for (const state of [slideLeft, slideRight]) {
    assert.ok(Math.abs(state.frame.width - center.frame.width) <= 1, "slider image switch must not change frame width");
    assert.ok(Math.abs(state.frame.height - center.frame.height) <= 1, "slider image switch must not change frame height");
  }
  assert.deepEqual(errors, []);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  try {
    await checkViewport(browser, { width: 1440, height: 900 });
    await checkViewport(browser, { width: 390, height: 844 });
  } finally {
    await browser.close();
  }
  console.log("prototype-microscope-use field view layout regression passed");
})();
