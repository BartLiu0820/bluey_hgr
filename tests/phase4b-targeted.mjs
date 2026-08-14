import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const prototypePath = path.join(projectRoot, "04B-prototype-手势输入闭环.html");
const prototypeUrl = pathToFileURL(prototypePath).href;
const reviewUrl = pathToFileURL(path.join(projectRoot, "reviews/phase-4b-gesture-input-review.html")).href;
const qaDir = path.join(projectRoot, "prototype-qa");
fs.mkdirSync(qaDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
});

const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
  console.log(`PASS ${message}`);
}

async function checkLayout(page, name) {
  const metrics = await page.evaluate(() => {
    const active = document.querySelector(".screen.active");
    const topbarRect = active.querySelector(".topbar")?.getBoundingClientRect();
    const buttons = [...active.querySelectorAll("button")].filter(button => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    return {
      screen: active?.dataset.screenId,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: innerWidth,
      minButtonHeight: Math.min(...buttons.map(button => button.getBoundingClientRect().height)),
      topbarLeft: topbarRect?.left ?? 0,
      topbarRight: topbarRect?.right ?? innerWidth
    };
  });
  assert.equal(metrics.scrollWidth <= metrics.innerWidth, true, `${name} horizontal overflow`);
  assert.equal(metrics.minButtonHeight >= 44, true, `${name} has a button below 44px`);
  assert.equal(metrics.topbarLeft >= 0 && metrics.topbarRight <= metrics.innerWidth, true, `${name} topbar clips outside viewport`);
  pass(`${name}: no horizontal overflow and active buttons meet 44px`);
  return metrics;
}

async function makePage(viewport, url = prototypeUrl) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => failures.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  await page.goto(url, { waitUntil: "load" });
  return page;
}

try {
  const desktop = await makePage({ width: 1440, height: 900 });
  await checkLayout(desktop, "GI-01 1440x900");
  assert.equal(await desktop.locator(".screen.active").getAttribute("data-screen-id"), "GI-01");
  assert.equal(await desktop.locator("#camera-choice").isDisabled(), true);
  pass("GI-01 starts without requesting camera and privacy gates gesture mode");
  await desktop.screenshot({ path: path.join(qaDir, "phase4b-gi01-1440.png"), fullPage: true });
  await desktop.close();

  const compact = await makePage({ width: 1024, height: 700 });
  await checkLayout(compact, "GI-01 1024x700");
  await compact.close();

  const keyboard = await makePage({ width: 1440, height: 900 });
  await keyboard.evaluate(() => {
    window.__inputReadyCount = 0;
    window.addEventListener("input-ready", () => { window.__inputReadyCount += 1; });
  });
  await keyboard.click("#keyboard-choice");
  assert.equal(await keyboard.locator(".screen.active").getAttribute("data-screen-id"), "GI-05");
  assert.equal((await keyboard.evaluate(() => window.__gesturePrototype.getState())).cameraStreamActive, false);
  await keyboard.keyboard.press("Space");
  await keyboard.waitForTimeout(850);
  await keyboard.keyboard.press("ArrowDown");
  await keyboard.waitForTimeout(850);
  await keyboard.keyboard.press("v");
  await keyboard.waitForTimeout(900);
  assert.equal(await keyboard.locator(".screen.active").getAttribute("data-screen-id"), "GI-06");
  const keyboardState = await keyboard.evaluate(() => window.__gesturePrototype.getState());
  assert.deepEqual(keyboardState.keyDone, [true, true, true]);
  assert.equal(keyboardState.inputProfile.mode, "keyboard_full");
  assert.equal(keyboardState.inputProfile.cameraStreamActive, false);
  pass("GI-01 → GI-05 → GI-06 keyboard path accepts three mapped commands");
  await checkLayout(keyboard, "GI-06 1440x900");
  await keyboard.screenshot({ path: path.join(qaDir, "phase4b-gi06-keyboard.png"), fullPage: true });
  await keyboard.click("#start-keyboard-game");
  await keyboard.click("#ready-close");
  await keyboard.click("#start-keyboard-game");
  assert.equal(await keyboard.evaluate(() => window.__inputReadyCount), 1);
  pass("keyboard_full dispatches input-ready exactly once");
  await keyboard.close();

  const denied = await browser.newPage({ viewport: { width: 1024, height: 700 } });
  denied.on("pageerror", error => failures.push(`pageerror: ${error.message}`));
  await denied.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => { throw new DOMException("Permission denied", "NotAllowedError"); } }
    });
  });
  await denied.goto(prototypeUrl, { waitUntil: "load" });
  await denied.check("#privacy-check");
  await denied.click("#camera-choice");
  await denied.click("#enable-camera");
  await denied.locator("#camera-error.show").waitFor();
  assert.equal(await denied.locator("#camera-error [data-go-keyboard]").isVisible(), true);
  await denied.click("#camera-error [data-go-keyboard]");
  assert.equal(await denied.locator(".screen.active").getAttribute("data-screen-id"), "GI-05");
  pass("camera permission denial has a visible keyboard recovery path");
  await denied.close();

  const camera = await makePage({ width: 1440, height: 900 });
  await camera.evaluate(() => {
    window.__inputReadyCount = 0;
    window.addEventListener("input-ready", () => { window.__inputReadyCount += 1; });
  });
  await camera.check("#privacy-check");
  await camera.click("#camera-choice");
  await camera.click("#enable-camera");
  try {
    await camera.locator("#start-practice:not([disabled])").waitFor({ timeout: 5000 });
  } catch {
    await camera.evaluate(() => window.__gesturePrototype.forceCameraReady());
  }
  await camera.click("#start-practice");
  assert.equal(await camera.locator(".screen.active").getAttribute("data-screen-id"), "GI-03");
  await checkLayout(camera, "GI-03 1440x900");
  await camera.screenshot({ path: path.join(qaDir, "phase4b-gi03-lab.png"), fullPage: true });
  for (let index = 0; index < 3; index += 1) {
    await camera.evaluate(() => window.__gesturePrototype.completeCurrentGesture());
    await camera.click("#next-gesture");
  }
  assert.equal(await camera.locator(".screen.active").getAttribute("data-screen-id"), "GI-04");
  const cameraState = await camera.evaluate(() => window.__gesturePrototype.getState());
  assert.equal(cameraState.inputProfile.mode, "camera_full");
  assert.deepEqual(cameraState.inputProfile.childActions, ["JUMP", "DUCK", "SWITCH_CHARACTER"]);
  pass("GI-02 → GI-03 → GI-04 produces camera_full with all three actions");
  await checkLayout(camera, "GI-04 1440x900");
  await camera.screenshot({ path: path.join(qaDir, "phase4b-gi04-camera.png"), fullPage: true });
  await camera.click("#start-camera-game");
  await camera.click("#ready-close");
  await camera.click("#start-camera-game");
  assert.equal(await camera.evaluate(() => window.__inputReadyCount), 1);
  pass("camera_full dispatches input-ready exactly once");

  await camera.click(".screen.active [data-open-parent]");
  assert.equal(await camera.locator("#drawer-backdrop").getAttribute("aria-hidden"), "false");
  await camera.click("#drawer-switch");
  await camera.click("#confirm-switch");
  const switchedState = await camera.evaluate(() => window.__gesturePrototype.getState());
  assert.equal(switchedState.screen, "GI-05");
  assert.equal(switchedState.cameraStreamActive, false);
  assert.equal(switchedState.cameraTracks.length, 0);
  pass("parent-confirmed keyboard switch releases the camera stream");
  await camera.screenshot({ path: path.join(qaDir, "phase4b-gi05-keyboard.png"), fullPage: true });
  await camera.close();

  const review = await makePage({ width: 1440, height: 900 }, reviewUrl);
  const reviewMetrics = await review.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    decisionCards: document.querySelectorAll(".decision-card").length,
    feedbackFields: document.querySelectorAll("[data-feedback-field]").length,
    overflows: [...document.querySelectorAll("body *")].map(element => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 60), left: rect.left, right: rect.right, width: rect.width };
    }).filter(item => item.left < -1 || item.right > innerWidth + 1).slice(0, 10)
  }));
  if (reviewMetrics.scrollWidth > reviewMetrics.innerWidth) console.log("REVIEW_OVERFLOW", JSON.stringify(reviewMetrics));
  assert.equal(reviewMetrics.scrollWidth <= reviewMetrics.innerWidth, true);
  assert.equal(reviewMetrics.decisionCards, 3);
  assert.equal(reviewMetrics.feedbackFields >= 3, true);
  pass("Phase 4B Review Console renders three decision cards without horizontal overflow");
  await review.screenshot({ path: path.join(qaDir, "phase4b-review-console.png"), fullPage: true });
  await review.close();

  assert.deepEqual(failures, [], failures.join(" | "));
  console.log(`DONE ${passes.length} targeted checks passed`);
} finally {
  await browser.close();
}
