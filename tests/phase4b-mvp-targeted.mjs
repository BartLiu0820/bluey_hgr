import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const prototypePath = path.join(projectRoot, "04B-prototype-手势小狗探险MVP.html");
const qaDir = path.join(projectRoot, "prototype-qa");
fs.mkdirSync(qaDir, { recursive: true });

const mimeTypes = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".wasm": "application/wasm", ".task": "application/octet-stream" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = path.resolve(projectRoot, `.${pathname}`);
  if (!requested.startsWith(`${projectRoot}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const prototypeUrl = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(prototypePath))}`;

const browser = await chromium.launch({ headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const errors = [];
const passes = [];
const obstacles = [[5000, "JUMP"], [13000, "JUMP"], [21000, "JUMP"], [29000, "JUMP"], [36000, "SWITCH_CHARACTER"]];

function pass(message) { passes.push(message); console.log(`PASS ${message}`); }

async function makePage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() !== "error") return;
    if (message.text().includes("Created TensorFlow Lite XNNPACK delegate for CPU")) return;
    errors.push(`console: ${message.text()}`);
  });
  await page.goto(prototypeUrl, { waitUntil: "load" });
  return page;
}

async function state(page) { return page.evaluate(() => window.__mvpTest.getState()); }
async function advance(page, ms) { return page.evaluate(value => window.__mvpTest.advance(value), ms); }

async function checkLayout(page, label) {
  const metrics = await page.evaluate(() => {
    const active = document.querySelector(".screen.active");
    const buttons = [...active.querySelectorAll("button")].filter(button => {
      const rect = button.getBoundingClientRect(); const style = getComputedStyle(button);
      return !button.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const surfaces = [active, ...active.querySelectorAll(".panel, .finish-card")].filter(surface => {
      const rect = surface.getBoundingClientRect(); const style = getComputedStyle(surface);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const buttonRects = buttons.map(button => button.getBoundingClientRect());
    return {
      screen: active?.dataset.screenId,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerWidth,
      innerHeight,
      minButtonHeight: buttons.length ? Math.min(...buttons.map(button => button.getBoundingClientRect().height)) : 999,
      buttonsInViewport: buttonRects.every(rect => rect.top >= -1 && rect.bottom <= innerHeight + 1),
      surfacesFit: surfaces.every(surface => surface.scrollHeight <= surface.clientHeight + 1),
      productCanvas: Boolean(document.querySelector("main.product-canvas")),
      scaffold: Boolean(document.querySelector(".prototype-inspector, #screen-nav, #state-nav, [data-prototype-shell-version]"))
    };
  });
  assert.equal(metrics.scrollWidth <= metrics.innerWidth, true, `${label}: horizontal overflow`);
  assert.equal(metrics.scrollHeight <= metrics.innerHeight, true, `${label}: vertical page scroll`);
  assert.equal(metrics.surfacesFit, true, `${label}: active surface clips vertically`);
  assert.equal(metrics.buttonsInViewport, true, `${label}: active button is outside the viewport`);
  assert.equal(metrics.minButtonHeight >= 44, true, `${label}: active button below 44px`);
  assert.equal(metrics.productCanvas, true);
  assert.equal(metrics.scaffold, false, `${label}: prototype scaffold leaked into product UI`);
  pass(`${label}: ${metrics.screen}, single viewport, accessible product controls, no scaffold`);
}

async function checkAllScreensSingleViewport(viewport, label) {
  const page = await makePage(viewport);
  for (const screenId of ["GI-01", "GI-02", "GI-05", "LV-00", "LV-01", "LV-02", "LV-03"]) {
    await page.evaluate(id => window.__mvpTest.showScreen(id), screenId);
    if (viewport.width === 1024 && viewport.height === 700) {
      await page.screenshot({ path: path.join(qaDir, `mvp-single-viewport-${screenId.toLowerCase()}-1024.png`), fullPage: true });
    }
    if (viewport.width === 1280 && viewport.height === 720 && ["GI-02", "GI-03"].includes(screenId)) {
      await page.screenshot({ path: path.join(qaDir, `mvp-overlap-check-${screenId.toLowerCase()}-1280.png`), fullPage: true });
    }
    const metrics = await page.evaluate(() => {
      const active = document.querySelector(".screen.active");
      const visible = element => {
        const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const surfaces = [active, ...active.querySelectorAll(".panel, .finish-card, .split-panel, .step-column, .status-row, .gesture-guide, .lab-camera, .keyboard-grid")].filter(visible);
      const controls = [...active.querySelectorAll("button, a[href], input")].filter(visible);
      const atoms = [...active.querySelectorAll("button, h1, h2, h3, p, .status-card, .step-item, .recognition-card, .lab-footer, .result-note")].filter(visible);
      const overlapPairs = [];
      for (let first = 0; first < atoms.length; first += 1) {
        for (let second = first + 1; second < atoms.length; second += 1) {
          const a = atoms[first], b = atoms[second];
          if (a.contains(b) || b.contains(a)) continue;
          const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
          const overlapWidth = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
          const overlapHeight = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
          if (overlapWidth > 3 && overlapHeight > 3) overlapPairs.push([a.id || a.className || a.tagName, b.id || b.className || b.tagName]);
        }
      }
      return {
        screenId: active.dataset.screenId,
        rootFits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
        surfaceOverflows: surfaces.filter(surface => surface.scrollWidth > surface.clientWidth + 1 || surface.scrollHeight > surface.clientHeight + 1).map(surface => ({
          name: surface.id || surface.className,
          scrollWidth: surface.scrollWidth,
          clientWidth: surface.clientWidth,
          scrollHeight: surface.scrollHeight,
          clientHeight: surface.clientHeight
        })),
        controlsFit: controls.every(control => {
          const rect = control.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1;
        }),
        overlapPairs,
        layoutBoxes: [...active.querySelectorAll(":scope > *, .split-panel > *")].filter(visible).map(element => {
          const rect = element.getBoundingClientRect();
          return { name: element.id || element.className, top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
        })
      };
    });
    assert.equal(metrics.rootFits, true, `${label} ${screenId}: page scroll detected`);
    assert.deepEqual(metrics.surfaceOverflows, [], `${label} ${screenId}: content surface clips ${JSON.stringify({ overflows: metrics.surfaceOverflows, boxes: metrics.layoutBoxes })}`);
    assert.equal(metrics.controlsFit, true, `${label} ${screenId}: control outside viewport`);
    assert.deepEqual(metrics.overlapPairs, [], `${label} ${screenId}: visible content overlaps ${JSON.stringify(metrics.overlapPairs)}`);
  }
  await page.evaluate(() => window.__mvpTest.showScreen("GI-02"));
  await page.click(".screen.active [data-open-parent]");
  await page.click("#drawer-switch");
  const drawerFits = await page.evaluate(() => {
    const drawer = document.querySelector(".parent-drawer");
    const rect = drawer.getBoundingClientRect();
    return drawer.scrollHeight <= drawer.clientHeight + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1;
  });
  assert.equal(drawerFits, true, `${label}: expanded parent drawer requires vertical scrolling`);
  await page.close();
  pass(`${label}: all 10 screens and expanded parent drawer fit one viewport without scrolling`);
}

async function finishKeyboardRun(page) {
  for (const [time, action] of obstacles) {
    const current = (await state(page)).level.activePlayElapsedMs;
    if (current < time - 900) await advance(page, time - 900 - current);
    await page.evaluate(({ action }) => window.__mvpTest.emit(action, "child_keyboard"), { action });
    await advance(page, 1100);
  }
  const current = (await state(page)).level.activePlayElapsedMs;
  if (current < 40000) await advance(page, 40100 - current);
}

try {
  const fileLaunch = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await fileLaunch.goto(pathToFileURL(prototypePath).href, { waitUntil: "load" });
  assert.equal(await fileLaunch.locator("#local-launch-gate").isVisible(), true);
  assert.equal((await fileLaunch.locator("#local-launch-title").textContent()).includes("手势模型还没有启动"), true);
  assert.equal(await fileLaunch.locator("#local-game-link").getAttribute("href"), "http://127.0.0.1:36721/04B-prototype-手势小狗探险MVP.html");
  assert.equal((await fileLaunch.locator("body").innerText()).includes("本机动作模型没有准备好"), false);
  pass("file:// launch is intercepted before camera permission and points to the localhost game URL");
  await fileLaunch.screenshot({ path: path.join(qaDir, "mvp-file-protocol-launch-gate.png"), fullPage: true });
  await fileLaunch.close();

  const desktop = await makePage({ width: 1440, height: 900 });
  await checkLayout(desktop, "GI-01 1440x900");
  assert.equal(await desktop.locator("#camera-choice").isDisabled(), true);
  await desktop.screenshot({ path: path.join(qaDir, "mvp-gi01-1440.png"), fullPage: true });
  await desktop.close();

  await checkAllScreensSingleViewport({ width: 1440, height: 900 }, "single viewport 1440x900");
  await checkAllScreensSingleViewport({ width: 1280, height: 720 }, "single viewport 1280x720");
  await checkAllScreensSingleViewport({ width: 1219, height: 681 }, "reported in-app viewport 1219x681");
  await checkAllScreensSingleViewport({ width: 919, height: 843 }, "current in-app pane 919x843");
  await checkAllScreensSingleViewport({ width: 1024, height: 700 }, "single viewport 1024x700");

  const keyboard = await makePage({ width: 1440, height: 900 });
  await keyboard.evaluate(() => { window.__inputReadyCount = 0; window.addEventListener("input-ready", () => { window.__inputReadyCount += 1; }); });
  await keyboard.click("#keyboard-choice");
  await keyboard.keyboard.press("Space"); await keyboard.waitForTimeout(250);
  assert.equal((await state(keyboard)).screen, "GI-05");
  assert.equal(await keyboard.locator('[data-screen-id="GI-06"]').count(), 0);
  await keyboard.click("#start-keyboard-game");
  assert.equal(await keyboard.evaluate(() => window.__inputReadyCount), 1);
  assert.equal((await state(keyboard)).screen, "LV-00");
  await keyboard.evaluate(() => window.__mvpTest.selectLevel("L1"));
  assert.equal((await state(keyboard)).screen, "LV-01");
  await keyboard.click("#launch-start");
  await advance(keyboard, 700);
  await keyboard.screenshot({ path: path.join(qaDir, "mvp-lv01-countdown.png"), fullPage: true });
  await advance(keyboard, 3000);
  assert.equal((await state(keyboard)).screen, "LV-02");
  await keyboard.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
  await advance(keyboard, 4000);
  await advance(keyboard, 1800);
  assert.equal((await state(keyboard)).level.target.action, "JUMP");
  await checkLayout(keyboard, "LV-02 jump 1440x900");
  await keyboard.screenshot({ path: path.join(qaDir, "mvp-lv02-jump.png"), fullPage: true });
  await keyboard.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
  await advance(keyboard, 3800);
  await finishKeyboardRun(keyboard);
  const keyboardDone = await state(keyboard);
  assert.equal(keyboardDone.screen, "LV-03");
  assert.equal(keyboardDone.completionSummary.completed, true);
  assert.equal(keyboardDone.completionSummary.switchCompleted, true);
  assert.equal(keyboardDone.completionSummary.inputModeAtFinish, "keyboard_full");
  assert.equal(keyboardDone.completionSummary.collectibleTotal, 6);
  pass("keyboard_full naturally reaches LV-03 through L1 targets and 6 collectibles");
  await keyboard.screenshot({ path: path.join(qaDir, "mvp-lv03-keyboard.png"), fullPage: true });
  const firstRunId = keyboardDone.completionSummary.levelRunId;
  await keyboard.click("#play-again");
  assert.notEqual((await state(keyboard)).level.levelRunId, firstRunId);
  assert.equal((await state(keyboard)).inputProfile.mode, "keyboard_full");
  pass("replay preserves InputProfile and creates a new level run");
  await keyboard.close();

  const collision = await makePage({ width: 1024, height: 700 });
  await collision.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
  await collision.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await advance(collision, 3700);
  await advance(collision, 7200);
  const collisionState = await state(collision);
  assert.equal(collisionState.level.collisionCount, 1);
  assert.equal(collisionState.level.state, "running");
  assert.equal((await collision.locator("body").innerText()).includes("Game Over"), false);
  await checkLayout(collision, "LV-02 collision 1024x700");
  await collision.screenshot({ path: path.join(qaDir, "mvp-lv02-collision-1024.png"), fullPage: true });
  await advance(collision, 3000);
  assert.equal((await state(collision)).level.collectedCount >= collisionState.level.collectedCount, true);
  pass("missed action causes a recoverable bump without deducting cookies or causing Game Over");
  await collision.close();

  const camera = await makePage({ width: 1440, height: 900 });
  await camera.evaluate(() => { window.__inputReadyCount = 0; window.addEventListener("input-ready", () => { window.__inputReadyCount += 1; }); });
  await camera.check("#privacy-check");
  await camera.click("#camera-choice");
  await camera.click("#enable-camera");
  await camera.waitForFunction(() => ["ready", "error"].includes(window.__mvpTest.getState().modelStatus), null, { timeout: 30000 });
  const loadedState = await state(camera);
  assert.equal(loadedState.modelStatus, "ready", loadedState.lastRecognizerError || "MediaPipe model failed to load");
  assert.equal(loadedState.recognizerInfo.name, "mediapipe_gesture_recognizer");
  pass("local MediaPipe runtime and gesture_recognizer.task load successfully over localhost");
  await camera.evaluate(() => window.__gesturePrototype.forceCameraReady());
  await camera.evaluate(() => window.__mvpTest.renderSyntheticHand("Open_Palm"));
  const setupCoach = await camera.evaluate(() => {
    const preview = document.querySelector(".preview-shell").getBoundingClientRect();
    const steps = document.querySelector(".step-column").getBoundingClientRect();
    const canvas = document.querySelector("#setup-landmarks");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    return {
      preview, steps,
      framing: document.querySelector("#setup-framing").textContent,
      seen: document.querySelector("#setup-seen").textContent,
      coloredPixels: pixels.some((value, index) => index % 4 === 3 && value > 0),
      hasTargetFrame: Boolean(document.querySelector(".target-frame"))
    };
  });
  assert.equal(setupCoach.preview.left < setupCoach.steps.left, true);
  assert.equal(setupCoach.preview.width > setupCoach.steps.width, true);
  assert.equal(setupCoach.framing, "看得很清楚");
  assert.equal(setupCoach.seen, "我看到：张开手掌");
  assert.equal(setupCoach.coloredPixels, true);
  assert.equal(setupCoach.hasTargetFrame, false);
  pass("GI-02 uses a large left mirror, right-side guidance, no fill-the-frame target, and visible landmarks/results");
  await camera.screenshot({ path: path.join(qaDir, "mvp-gi02-friendly-framing.png"), fullPage: true });
  await camera.click("#start-practice");
  const practiceLayout = await camera.evaluate(() => {
    const cameraBox = document.querySelector("#lab-video").getBoundingClientRect();
    const guide = document.querySelector(".gesture-guide").getBoundingClientRect();
    return { cameraBox, guide, title: document.querySelector("#gesture-title").textContent, copy: document.querySelector("#gesture-copy").textContent };
  });
  assert.equal(practiceLayout.cameraBox.left < practiceLayout.guide.left, true);
  assert.equal(practiceLayout.cameraBox.width > practiceLayout.guide.width, true);
  assert.equal(practiceLayout.title, "握拳，再张开");
  assert.equal(practiceLayout.copy.includes("先做小拳头"), true);
  assert.equal(await camera.locator("#countdown").count(), 0);
  pass("GI-03 keeps the large camera stage on the left and teaches one fist-to-palm control cycle without a recognition countdown");
  await camera.screenshot({ path: path.join(qaDir, "mvp-gi03-left-camera-right-guide.png"), fullPage: true });

  const reportedViewport = await makePage({ width: 1219, height: 681 });
  await reportedViewport.evaluate(() => window.__mvpTest.showScreen("GI-03"));
  const guideZones = await reportedViewport.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height };
    };
    const guide = document.querySelector(".gesture-guide");
    return {
      guide: box(".gesture-guide"),
      instruction: box(".gesture-guide .gesture-card"),
      bubble: box("#feedback-bubble"),
      dog: box("#dog-stage .dog-art"),
      tip: box(".recognition-card"),
      fits: guide.scrollHeight <= guide.clientHeight + 1
    };
  });
  assert.equal(guideZones.fits, true);
  assert.equal(guideZones.instruction.bottom <= guideZones.bubble.top + 1, true);
  assert.equal(guideZones.bubble.bottom <= guideZones.dog.bottom + 1, true);
  assert.equal(guideZones.dog.bottom <= guideZones.tip.top + 1, true);
  assert.equal(guideZones.tip.bottom <= guideZones.guide.bottom + 1, true);
  await reportedViewport.screenshot({ path: path.join(qaDir, "mvp-gi03-reported-viewport-1219x681.png"), fullPage: true });
  await reportedViewport.close();
  pass("GI-03 reported 1219x681 viewport keeps instruction, dog feedback, character and tip in separate non-overlapping zones");
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  assert.equal((await state(camera)).practicePhase, "waiting_fist");
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Closed_Fist"));
  assert.equal((await state(camera)).practicePhase, "armed");
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  assert.equal((await state(camera)).practicePhase, "freeze");
  assert.equal((await state(camera)).lastCommand.action, "JUMP");
  const firstPracticeCommandId = (await state(camera)).lastCommand.commandId;
  await camera.waitForTimeout(760);
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Closed_Fist"));
  assert.equal((await state(camera)).practicePhase, "armed");
  assert.equal((await state(camera)).controlCyclePassed, true);
  assert.equal((await state(camera)).practiceRepeatCount, 1);
  assert.equal(await camera.locator("#next-gesture").isVisible(), true);
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  const secondPracticeAction = await state(camera);
  assert.equal(secondPracticeAction.practicePhase, "freeze");
  assert.equal(secondPracticeAction.lastCommand.action, "JUMP");
  assert.notEqual(secondPracticeAction.lastCommand.commandId, firstPracticeCommandId);
  const secondPracticeCommandId = secondPracticeAction.lastCommand.commandId;
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  assert.equal((await state(camera)).lastCommand.commandId, secondPracticeCommandId);
  await camera.waitForTimeout(760);
  await camera.evaluate(() => window.__mvpTest.injectStableGesture("Closed_Fist"));
  assert.equal((await state(camera)).practicePhase, "armed");
  assert.equal((await state(camera)).practiceRepeatCount, 2);
  await camera.click("#next-gesture");
  assert.equal((await state(camera)).screen, "GI-04");
  assert.deepEqual((await state(camera)).gestureAttempts, [2, 0, 0]);
  assert.equal((await state(camera)).controlCyclePassed, true);
  pass("Gesture Lab unlocks results after one cycle, keeps the dog responsive for an optional second cycle, and never repeats while palm is held");
  await camera.click("#start-camera-game");
  assert.equal(await camera.evaluate(() => window.__inputReadyCount), 1);
  assert.equal((await state(camera)).screen, "LV-00");
  await camera.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await advance(camera, 3700);
  const gameCoach = await camera.evaluate(() => {
    const world = document.querySelector("#game-world").getBoundingClientRect();
    const coach = document.querySelector("#game-coach").getBoundingClientRect();
    return { world, coach, hasVideo: Boolean(document.querySelector("#game-video")), hasCanvas: Boolean(document.querySelector("#game-landmarks")) };
  });
  assert.equal(gameCoach.world.left < gameCoach.coach.left, true);
  assert.equal(gameCoach.world.right >= gameCoach.coach.right, true);
  assert.equal(gameCoach.coach.width >= 210, true);
  assert.equal(gameCoach.hasVideo && gameCoach.hasCanvas, true);
  pass("camera game keeps a full-bleed world with a compact floating landmark/recognition coach");
  await camera.evaluate(() => window.__mvpTest.setHandPresent(false));
  await advance(camera, 1000);
  const pausedElapsed = (await state(camera)).level.activePlayElapsedMs;
  await advance(camera, 4000);
  assert.equal((await state(camera)).level.activePlayElapsedMs, pausedElapsed);
  assert.equal((await state(camera)).level.pauseReason, "hand");
  await camera.evaluate(() => window.__mvpTest.setHandPresent(true));
  await advance(camera, 3100);
  assert.equal((await state(camera)).level.pauseReason, null);
  pass("camera_full hand-missing wait freezes active time and resumes after a short child-friendly countdown");
  const elapsed = (await state(camera)).level.activePlayElapsedMs;
  await advance(camera, 40100 - elapsed);
  if ((await state(camera)).level?.pauseReason === "switch") {
    await advance(camera, 2600);
    await camera.click("#orange-avatar");
    const remaining = 40100 - (await state(camera)).level.activePlayElapsedMs;
    if (remaining > 0) await advance(camera, remaining);
  }
  const cameraDone = await state(camera);
  assert.equal(cameraDone.screen, "LV-03");
  assert.equal(cameraDone.completionSummary.inputModeAtFinish, "camera_full");
  assert.equal(cameraDone.completionSummary.collisionCount >= 1, true);
  pass("camera_full has no timed auto-recognition; blank fake video collides safely and still reaches the L1 finish");

  await camera.click("#play-again");
  await advance(camera, 3700);
  await advance(camera, 25000);
  const beforeSwitch = await state(camera);
  await camera.click(".screen.active [data-open-parent]");
  await camera.click("#drawer-switch");
  await camera.click("#confirm-switch");
  await advance(camera, 3100);
  const afterSwitch = await state(camera);
  assert.equal(afterSwitch.inputProfile.mode, "keyboard_full");
  assert.equal(afterSwitch.cameraStreamActive, false);
  assert.equal(afterSwitch.cameraTracks.length, 0);
  assert.equal(afterSwitch.level.levelRunId, beforeSwitch.level.levelRunId);
  assert.equal(afterSwitch.level.collectedCount, beforeSwitch.level.collectedCount);
  pass("parent-confirmed mid-level keyboard switch preserves checkpoint and collectibles, and releases camera tracks");
  await camera.close();

  const gestureControl = await makePage({ width: 1280, height: 720 });
  await gestureControl.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
  await gestureControl.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await advance(gestureControl, 3700);
  await advance(gestureControl, 3500);
  assert.equal((await state(gestureControl)).level.target.action, "JUMP");
  await gestureControl.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  assert.equal((await state(gestureControl)).level.target.resolved, false);
  assert.equal((await state(gestureControl)).gameGestureGate, "need_fist");
  await gestureControl.evaluate(() => window.__mvpTest.injectStableGesture("Closed_Fist"));
  assert.equal((await state(gestureControl)).gameGestureGate, "armed");
  await gestureControl.evaluate(() => window.__mvpTest.injectStableGesture("Open_Palm"));
  assert.equal((await state(gestureControl)).level.target.resolved, true);
  assert.equal((await state(gestureControl)).lastCommand.action, "JUMP");
  assert.equal((await state(gestureControl)).lastCommand.result, "accepted");
  assert.equal((await state(gestureControl)).gameGestureGate, "freeze");
  pass("camera control ignores an unarmed palm, then fist -> palm immediately resolves the target and freezes input");
  await gestureControl.close();

  const compact = await makePage({ width: 1024, height: 700 });
  await compact.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
  await compact.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await advance(compact, 3700);
  await advance(compact, 3500);
  await checkLayout(compact, "LV-02 action HUD 1024x700");
  const bounds = await compact.evaluate(() => {
    const dog = document.querySelector("#level-dog-wrap").getBoundingClientRect();
    const prompt = document.querySelector("#action-card").getBoundingClientRect();
    const parent = document.querySelector(".screen.active [data-open-parent]").getBoundingClientRect();
    return { dog, prompt, parent, width: innerWidth, height: innerHeight };
  });
  assert.equal(bounds.dog.left >= 0 && bounds.dog.right <= bounds.width, true);
  assert.equal(bounds.prompt.left >= 0 && bounds.prompt.right <= bounds.width, true);
  assert.equal(bounds.parent.right <= bounds.width && bounds.parent.top >= 0, true);
  pass("1024x700 keeps dog safe zone, action prompt and parent control visible");
  await compact.close();

  const source = fs.readFileSync(prototypePath, "utf8");
  const httpUrls = source.match(/https?:\/\/[^\s\"'<]+/g) || [];
  assert.equal(httpUrls.length > 0 && httpUrls.every(url => url.startsWith("http://127.0.0.1:36721/")), true);
  assert.equal(/Bluey|布鲁伊/.test(source), false);
  assert.equal(/prototype-inspector|screen-nav|state-nav|QA 摘要|跳关|倍速/.test(source), false);
  const runtimeSource = fs.readFileSync(path.join(projectRoot, "gesture-recognizer-runtime.mjs"), "utf8");
  assert.equal(/https?:\/\//.test(runtimeSource), false);
  assert.equal(/recognizeForVideo/.test(runtimeSource), true);
  assert.equal(/gesture_recognizer\.task/.test(runtimeSource), true);
  assert.equal(/Open_Palm/.test(runtimeSource) && /Closed_Fist/.test(runtimeSource), true);
  assert.equal(/categoryAllowlist: \["None", "Open_Palm", "Closed_Fist"\]/.test(runtimeSource), true);
  assert.equal(/3 consecutive/.test(runtimeSource), true);
  assert.equal(/Pointing_Up|Victory/.test(runtimeSource), false);
  pass("local MVP bundle only exposes its 127.0.0.1 launch URL, has no CDN/protected IP naming, and uses recognizeForVideo");

  assert.deepEqual(errors, [], errors.join(" | "));
  console.log(`DONE ${passes.length} targeted checks passed`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
