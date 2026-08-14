import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

/*
 * QA-TARGETED contract for the confirmed three-runtime MVP.
 *
 * Invisible test seam expected on window.__mvpTest:
 *
 * - startWithMode("camera_full" | "keyboard_full")
 *     Starts a fresh session on LV-00 with only L1 unlocked.
 * - selectLevel("L1" | "L2" | "L3")
 *     Opens LV-01 for an unlocked level; a locked selection stays on LV-00.
 * - advance(ms)
 *     Deterministically advances launch countdown, level time, input freeze,
 *     hand-loss timers, and cloud-round timers.
 * - renderSyntheticHand(label, { handPresent, landmarks })
 *     Sends one already-stable recognizer frame through handleRecognizerFrame
 *     (never directly to a level handler). This remains the recognizer bridge
 *     seam; runtime tests below use the two normalized input contracts.
 * - emitPoseTransition({ stablePose, timestamp, source })
 *     Sends a PoseTransitionEvent through the production input adapter used by
 *     L1/L3. A pose event is edge-triggered, not a held-frame command.
 * - emitHandTrackingFrame({ handPresent, palmCenterY, confidence, timestamp })
 *     Sends a HandTrackingFrame through the production input adapter used by
 *     L2. It intentionally has no gesture label: None/Unknown classification
 *     must not gate position tracking while landmarks still produce a center.
 * - emit(action, source), completeLevel(), triggerCollision(),
 *   resolveCloudRound(), and getState().
 *     completeLevel/triggerCollision/resolveCloudRound are deterministic,
 *     test-only entry points into the same production reducers; they must not
 *     expose UI controls.
 *
 * Camera inputProfile contract:
 *   capabilities: { poseTransition: true, handTrackingY: true }.
 *
 * getState() progression contract:
 *   screen, currentLevelId, unlockedLevelIds, completedLevelIds,
 *   gameGestureGate, completionSummary, and level.
 *
 * level contract shared by all runtimes:
 *   runtimeType, durationMs, collectibleTotal, activePlayElapsedMs,
 *   collectedCount, pauseReason, lastAction, actionFeedbackCount, target.
 *
 * Runtime-specific level fields:
 * - command_runner: firstInteractionAtMs, switchCompleted.
 * - hand_follow_dodge: playerYNormalized (0 top .. 1 bottom), shieldHits.
 * - cloud_stack: cloudCount, cloudTargetLayers (1..3),
 *   cloudAutoPadCount, cloudStarCount, lastCloudResult.
 *
 * Stable DOM hooks:
 *   #level-dog-wrap, #game-world, #game-coach, #game-video,
 *   #game-landmarks, #game-coach > .camera-readout,
 *   #game-framing, #game-seen, #game-control-status, and
 *   #cloud-stack containing [data-cloud-layer] or .cloud-layer nodes.
 */

const projectRoot = path.resolve(import.meta.dirname, "..");
const prototypePath = path.join(projectRoot, "04B-prototype-手势小狗探险MVP.html");

const LEVELS = Object.freeze([
  { id: "L1", runtimeType: "command_runner", durationMs: 40_000, collectibleTotal: 6 },
  { id: "L2", runtimeType: "hand_follow_dodge", durationMs: 45_000, collectibleTotal: 6 },
  { id: "L3", runtimeType: "cloud_stack", durationMs: 50_000, collectibleTotal: 6 }
]);
const LEVEL_IDS = LEVELS.map(level => level.id);
const VIEWPORTS = Object.freeze([
  { width: 1440, height: 900, label: "1440x900" },
  { width: 1280, height: 720, label: "1280x720" },
  { width: 1219, height: 681, label: "1219x681" },
  { width: 1024, height: 700, label: "1024x700" },
  { width: 919, height: 843, label: "919x843" }
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".task": "application/octet-stream"
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requestedPath = path.resolve(projectRoot, `.${pathname}`);
  const isInsideProject = requestedPath.startsWith(`${projectRoot}${path.sep}`);
  if (!isInsideProject || !fs.existsSync(requestedPath) || !fs.statSync(requestedPath).isFile()) {
    response.writeHead(404);
    response.end("not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(requestedPath)] || "application/octet-stream"
  });
  fs.createReadStream(requestedPath).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const prototypeUrl = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(prototypePath))}`;
const browser = await chromium.launch({
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
});

const browserErrors = [];
const passes = [];

function pass(message) {
  passes.push(message);
  console.log(`PASS ${message}`);
}

function sorted(values) {
  return [...values].sort();
}

function approx(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, received ${actual}`);
}

function palmLandmarks(centerY) {
  const base = [
    [.50, .83], [.42, .72], [.36, .61], [.31, .50], [.27, .39],
    [.44, .55], [.42, .40], [.41, .27], [.40, .15],
    [.51, .53], [.51, .36], [.51, .22], [.51, .10],
    [.58, .56], [.61, .40], [.63, .28], [.64, .18],
    [.64, .62], [.70, .50], [.74, .42], [.77, .35]
  ];
  const baseCenter = base.reduce((sum, point) => sum + point[1], 0) / base.length;
  const scale = .42;
  return base.map(([x, y]) => ({
    x: .5 + (x - .5) * scale,
    y: Math.max(.02, Math.min(.98, centerY + (y - baseCenter) * scale)),
    z: 0
  }));
}

async function makePage(viewport = { width: 1280, height: 720 }) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() !== "error") return;
    if (message.text().includes("Created TensorFlow Lite XNNPACK delegate for CPU")) return;
    browserErrors.push(`console: ${message.text()}`);
  });
  await page.goto(prototypeUrl, { waitUntil: "load" });
  await page.waitForFunction(() => {
    const api = window.__mvpTest;
    const methods = [
      "startWithMode",
      "selectLevel",
      "advance",
      "renderSyntheticHand",
      "emitPoseTransition",
      "emitHandTrackingFrame",
      "emit",
      "completeLevel",
      "triggerCollision",
      "resolveCloudRound",
      "getState"
    ];
    return api && methods.every(method => typeof api[method] === "function");
  }, null, { timeout: 5_000 });
  return page;
}

async function getState(page) {
  return page.evaluate(() => window.__mvpTest.getState());
}

async function startWithMode(page, mode) {
  await page.evaluate(nextMode => window.__mvpTest.startWithMode(nextMode), mode);
  return getState(page);
}

async function selectLevel(page, levelId) {
  await page.evaluate(nextLevelId => window.__mvpTest.selectLevel(nextLevelId), levelId);
  return getState(page);
}

async function advance(page, ms) {
  await page.evaluate(deltaMs => window.__mvpTest.advance(deltaMs), ms);
  return getState(page);
}

async function renderHand(page, label, options = {}) {
  await page.evaluate(({ nextLabel, nextOptions }) => {
    window.__mvpTest.renderSyntheticHand(nextLabel, nextOptions);
  }, { nextLabel: label, nextOptions: options });
  return getState(page);
}

async function emitPoseTransition(page, stablePose, source = "camera") {
  await page.evaluate(({ nextPose, nextSource }) => {
    const timestamp = Math.max(
      Number(window.__qaInputTimestamp || 0),
      performance.now()
    ) + 80;
    window.__qaInputTimestamp = timestamp;
    window.__mvpTest.emitPoseTransition({
      stablePose: nextPose,
      timestamp,
      source: nextSource
    });
  }, { nextPose: stablePose, nextSource: source });
  return getState(page);
}

async function emitHandTrackingFrame(page, {
  handPresent = true,
  palmCenterY = null,
  confidence = .98
} = {}) {
  await page.evaluate(frame => {
    const timestamp = Math.max(
      Number(window.__qaInputTimestamp || 0),
      performance.now()
    ) + 80;
    window.__qaInputTimestamp = timestamp;
    window.__mvpTest.emitHandTrackingFrame({ ...frame, timestamp });
  }, { handPresent, palmCenterY, confidence });
  return getState(page);
}

async function emit(page, action, source = "child_keyboard") {
  await page.evaluate(({ nextAction, nextSource }) => {
    window.__mvpTest.emit(nextAction, nextSource);
  }, { nextAction: action, nextSource: source });
  return getState(page);
}

async function completeLevel(page) {
  await page.evaluate(() => window.__mvpTest.completeLevel());
  return getState(page);
}

async function launchSelectedLevel(page) {
  let current = await getState(page);
  if (current.screen === "LV-01") current = await advance(page, 3_700);
  assert.equal(current.screen, "LV-02", "launch countdown did not enter LV-02");
  return current;
}

async function unlockThrough(page, lastLevelIndex) {
  for (let index = 0; index <= lastLevelIndex; index += 1) {
    await selectLevel(page, LEVELS[index].id);
    await launchSelectedLevel(page);
    await completeLevel(page);
  }
  return getState(page);
}

function assertProgression(actual, unlocked, completed, label) {
  assert.deepEqual(sorted(actual.unlockedLevelIds), sorted(unlocked), `${label}: unlocked levels`);
  assert.deepEqual(sorted(actual.completedLevelIds), sorted(completed), `${label}: completed levels`);
}

function assertLevelContract(actual, expected) {
  assert.equal(actual.currentLevelId, expected.id, `${expected.id}: currentLevelId`);
  assert.ok(actual.level, `${expected.id}: level state is missing`);
  assert.equal(actual.level.runtimeType, expected.runtimeType, `${expected.id}: runtimeType`);
  assert.equal(actual.level.durationMs, expected.durationMs, `${expected.id}: durationMs`);
  assert.equal(actual.level.collectibleTotal, expected.collectibleTotal, `${expected.id}: collectibleTotal`);
}

async function advanceUntil(page, predicate, timeoutMs, stepMs = 100) {
  let elapsed = 0;
  let current = await getState(page);
  while (!predicate(current) && elapsed < timeoutMs) {
    current = await advance(page, stepMs);
    elapsed += stepMs;
  }
  assert.equal(predicate(current), true,
    `condition not reached within ${timeoutMs}ms; state=${JSON.stringify(current)}`);
  return { state: current, elapsed };
}

async function addCloud(page) {
  let current = await getState(page);
  const before = current.level.cloudCount;
  if (current.gameGestureGate !== "need_fist") {
    current = await advance(page, 760);
  }
  current = await emitPoseTransition(page, "Closed_Fist");
  assert.equal(current.gameGestureGate, "armed",
    `cloud round did not arm after fist; before=${before}, elapsed=${current.level.activePlayElapsedMs}, pause=${current.level.pauseReason}, lock=${current.level.discreteLockUntil ?? "hidden"}, screen=${current.screen}`);
  current = await emitPoseTransition(page, "Open_Palm");
  assert.equal(current.level.cloudCount, before + 1, "one fist→palm cycle must add exactly one cloud");
  return current;
}

function expectedTrackingStep(current, rawTarget) {
  const target = Math.max(.22, Math.min(.72, rawTarget));
  const delta = target - current;
  if (Math.abs(delta) <= .035) return current;
  const step = Math.max(-.12, Math.min(.12, delta * .28));
  return Math.max(.22, Math.min(.72, current + step));
}

async function checkWorldFeedback(page, tokens, label) {
  const result = await page.evaluate(nextTokens => {
    const world = document.querySelector("#game-world");
    if (!world) return { hasWorld: false, matches: [] };
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) > 0
        && rect.width > 0
        && rect.height > 0;
    };
    const candidates = [
      ...world.querySelectorAll(
        "#game-message, .cloud-layer.assist, [data-cloud-assist], [data-assist-feedback], [data-star-feedback], .bonus-star"
      )
    ];
    const assistLayers = [...world.querySelectorAll(".cloud-layer.assist, [data-cloud-assist]")]
      .filter(visible);
    const starNodes = [...world.querySelectorAll(".bonus-star, [data-star-feedback]")]
      .filter(visible);
    const starUnits = starNodes.reduce((sum, element) => {
      const declared = Number(
        element.getAttribute("data-star-count")
        || element.getAttribute("data-count")
      );
      if (Number.isFinite(declared) && declared > 0) return sum + declared;
      const glyphs = (element.textContent || "").match(/★/g)?.length || 0;
      return sum + Math.max(1, glyphs);
    }, 0);
    const cloudRisePx = parseFloat(
      getComputedStyle(document.querySelector("#level-dog-wrap"))
        .getPropertyValue("--cloud-rise")
    ) || 0;
    return {
      hasWorld: true,
      assistLayerCount: assistLayers.length,
      starUnits,
      cloudRisePx,
      matches: candidates.filter(visible).map(element => ({
        signature: [
          element.textContent,
          element.className,
          element.getAttribute("data-feedback"),
          element.getAttribute("data-cloud-assist"),
          element.getAttribute("data-star-feedback")
        ].filter(Boolean).join(" "),
        insideWorld: world.contains(element)
      })).filter(item => nextTokens.some(token => item.signature.includes(token)))
    };
  }, tokens);
  assert.equal(result.hasWorld, true, `${label}: #game-world missing`);
  assert.ok(result.matches.some(item => item.insideWorld),
    `${label}: no visible in-world feedback matching ${tokens.join(" / ")}`);
  return result;
}

async function jumpAnimationMetrics(page) {
  return page.evaluate(() => {
    const actor = document.querySelector("#level-dog-wrap");
    const computed = getComputedStyle(actor);
    const animation = actor.getAnimations().find(item => {
      const name = String(item.animationName || computed.animationName || "");
      return /jump/i.test(name);
    });
    const keyframes = animation?.effect?.getKeyframes?.() || [];
    let height = 0;
    for (const frame of keyframes) {
      const transform = String(frame.transform || "");
      for (const match of transform.matchAll(/translateY\(\s*(-?[\d.]+)px\s*\)/g)) {
        height = Math.max(height, Math.max(0, -Number(match[1])));
      }
      for (const match of transform.matchAll(/translate(?:3d)?\([^,]+,\s*(-?[\d.]+)px/g)) {
        height = Math.max(height, Math.max(0, -Number(match[1])));
      }
      const matrix = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*(-?[\d.]+)\)/);
      if (matrix) height = Math.max(height, Math.max(0, -Number(matrix[1])));
    }
    const timing = animation?.effect?.getTiming?.() || {};
    return {
      hasJumpClass: actor.classList.contains("jump"),
      animationName: String(animation?.animationName || computed.animationName || "none"),
      durationMs: Number(timing.duration || parseFloat(computed.animationDuration) * 1000 || 0),
      jumpHeightPx: height
    };
  });
}

async function checkCoachDoesNotCoverVideo(page, label) {
  const metrics = await page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { left: value.left, right: value.right, top: value.top, bottom: value.bottom };
    };
    const intersectionArea = (a, b) => {
      if (!a || !b) return Infinity;
      return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
        * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    };
    const coach = document.querySelector("#game-coach");
    const camera = rect("#game-coach .coach-camera");
    const video = rect("#game-video");
    const canvas = rect("#game-landmarks");
    const readout = rect("#game-coach > .camera-readout");
    const framing = rect("#game-framing");
    const seenElement = document.querySelector("#game-seen");
    const controlElement = document.querySelector("#game-control-status");
    return {
      missing: [camera, video, canvas, readout, framing].some(value => !value) || !seenElement || !controlElement,
      cameraReadoutIntersection: intersectionArea(camera, readout),
      videoReadoutIntersection: intersectionArea(video, readout),
      canvasReadoutIntersection: intersectionArea(canvas, readout),
      secondaryCopyHidden: getComputedStyle(seenElement).display === "none" && getComputedStyle(controlElement).display === "none",
      ordered: camera && readout
        ? camera.bottom <= readout.top + 1
        : false,
      coachFits: coach
        ? coach.scrollHeight <= coach.clientHeight + 1
          && coach.getBoundingClientRect().bottom <= innerHeight + 1
        : false
    };
  });
  assert.equal(metrics.missing, false, `${label}: stable coach hooks are missing`);
  assert.equal(metrics.cameraReadoutIntersection, 0, `${label}: readout covers camera`);
  assert.equal(metrics.videoReadoutIntersection, 0, `${label}: readout covers video`);
  assert.equal(metrics.canvasReadoutIntersection, 0, `${label}: readout covers landmark canvas`);
  assert.equal(metrics.secondaryCopyHidden, true, `${label}: secondary coach copy should stay hidden`);
  assert.equal(metrics.ordered, true, `${label}: camera/readout order collapsed`);
  assert.equal(metrics.coachFits, true, `${label}: coach clips or escapes the viewport`);
}

async function checkSingleViewport(page, label) {
  const metrics = await page.evaluate(() => {
    const active = document.querySelector(".screen.active");
    if (!active) return { missingActive: true };
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.hidden
        && element.getAttribute("aria-hidden") !== "true"
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || 1) > 0
        && rect.width > 0
        && rect.height > 0;
    };
    const name = element => element.id || element.dataset.levelId || String(element.className || element.tagName);
    const rect = element => element.getBoundingClientRect();
    const surfaces = [
      active,
      ...active.querySelectorAll(".level-map-shell, .level-grid, .level-card, .launch-copy, .game-coach, .finish-card, .pause-card")
    ].filter(visible);
    const controls = [...active.querySelectorAll("button, a[href], input")].filter(visible);
    const zones = [...active.querySelectorAll(
      ".level-card, .game-hud, .game-coach, .target-cue, .launch-copy > div, .finish-card, .pause-card"
    )].filter(visible);
    const overlaps = [];
    for (let first = 0; first < zones.length; first += 1) {
      for (let second = first + 1; second < zones.length; second += 1) {
        const a = zones[first];
        const b = zones[second];
        if (a.contains(b) || b.contains(a)) continue;
        const ar = rect(a);
        const br = rect(b);
        const width = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
        const height = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
        if (width > 3 && height > 3) overlaps.push([name(a), name(b)]);
      }
    }
    return {
      missingActive: false,
      pageFits: document.documentElement.scrollWidth <= innerWidth + 1
        && document.documentElement.scrollHeight <= innerHeight + 1
        && document.body.scrollWidth <= innerWidth + 1
        && document.body.scrollHeight <= innerHeight + 1,
      surfaceOverflows: surfaces
        .filter(surface => surface.scrollWidth > surface.clientWidth + 1 || surface.scrollHeight > surface.clientHeight + 1)
        .map(name),
      controlsOutside: controls.filter(control => {
        const value = rect(control);
        return value.left < -1 || value.right > innerWidth + 1 || value.top < -1 || value.bottom > innerHeight + 1;
      }).map(name),
      smallControls: controls.filter(control => rect(control).height < 44).map(name),
      overlaps
    };
  });
  assert.equal(metrics.missingActive, false, `${label}: no active screen`);
  assert.equal(metrics.pageFits, true, `${label}: page scroll detected`);
  assert.deepEqual(metrics.surfaceOverflows, [], `${label}: clipped surface`);
  assert.deepEqual(metrics.controlsOutside, [], `${label}: control outside viewport`);
  assert.deepEqual(metrics.smallControls, [], `${label}: control below 44px`);
  assert.deepEqual(metrics.overlaps, [], `${label}: independent content zones intersect`);
}

async function checkCloudBounds(page, label) {
  const metrics = await page.evaluate(() => {
    const world = document.querySelector("#game-world")?.getBoundingClientRect();
    const stack = document.querySelector("#cloud-stack")?.getBoundingClientRect();
    const layers = [...document.querySelectorAll("#cloud-stack [data-cloud-layer], #cloud-stack .cloud-layer")]
      .filter(element => {
        const style = getComputedStyle(element);
        const value = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && value.width > 0 && value.height > 0;
      })
      .map(element => element.getBoundingClientRect());
    const inside = (outer, inner) => outer && inner
      && inner.left >= outer.left - 1 && inner.right <= outer.right + 1
      && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
    return {
      hasWorld: Boolean(world),
      hasStack: Boolean(stack),
      layerCount: layers.length,
      stackInsideWorld: inside(world, stack),
      layersInsideWorld: layers.every(layer => inside(world, layer)),
      layersInsideStack: layers.every(layer => inside(stack, layer))
    };
  });
  assert.equal(metrics.hasWorld, true, `${label}: #game-world missing`);
  assert.equal(metrics.hasStack, true, `${label}: #cloud-stack missing`);
  assert.ok(metrics.layerCount >= 1, `${label}: no rendered cloud layers`);
  assert.equal(metrics.stackInsideWorld, true, `${label}: cloud stack escapes game world`);
  assert.equal(metrics.layersInsideWorld, true, `${label}: cloud layer escapes game world`);
  assert.equal(metrics.layersInsideStack, true, `${label}: cloud layer escapes cloud stack`);
}

try {
  // Map progression: completion, never score, unlocks the next level.
  {
    const page = await makePage();
    let current = await startWithMode(page, "keyboard_full");
    assert.equal(current.screen, "LV-00");
    assert.equal(current.currentLevelId, null);
    assertProgression(current, ["L1"], [], "fresh map");

    current = await selectLevel(page, "L2");
    assert.equal(current.screen, "LV-00", "locked L2 navigated away from map");
    assert.equal(current.currentLevelId, null, "locked L2 became current");

    for (let index = 0; index < LEVELS.length; index += 1) {
      const definition = LEVELS[index];
      current = await selectLevel(page, definition.id);
      assert.equal(current.screen, "LV-01", `${definition.id}: unlocked card did not launch`);
      assertLevelContract(current, definition);
      current = await launchSelectedLevel(page);
      assertLevelContract(current, definition);
      current = await completeLevel(page);
      assert.equal(current.screen, "LV-03", `${definition.id}: completion did not show celebration`);
      assertProgression(
        current,
        LEVEL_IDS.slice(0, Math.min(LEVEL_IDS.length, index + 2)),
        LEVEL_IDS.slice(0, index + 1),
        `${definition.id} completion`
      );
    }
    pass("map unlocks L1→L2→L3 on completion; runtimes are 40/45/50s with six collectibles each");
    await page.close();
  }

  // L1: command runner, immediate free jump, prominent motion, early target,
  // and a final partner switch command.
  {
    const page = await makePage({ width: 1440, height: 900 });
    let current = await startWithMode(page, "camera_full");
    assert.equal(Array.isArray(current.inputProfile.capabilities), false,
      "camera capabilities must be a named boolean map, not a positional array");
    assert.deepEqual(current.inputProfile.capabilities, {
      poseTransition: true,
      handTrackingY: true
    }, "camera profile does not advertise the two normalized input channels");
    current = await selectLevel(page, "L1");
    assertLevelContract(current, LEVELS[0]);
    current = await launchSelectedLevel(page);
    assert.equal(current.level.target, null, "L1 should open with a brief free-control window");

    current = await emitPoseTransition(page, "Closed_Fist");
    assert.equal(current.gameGestureGate, "armed");
    const feedbackBefore = current.level.actionFeedbackCount;
    current = await emitPoseTransition(page, "Open_Palm");
    assert.equal(current.level.lastAction, "JUMP");
    assert.equal(current.level.actionFeedbackCount, feedbackBefore + 1);
    assert.equal(current.level.target, null, "free jump modified a future target");

    const animation = await jumpAnimationMetrics(page);
    assert.equal(animation.hasJumpClass, true, "JUMP did not apply a visible actor state");
    assert.notEqual(animation.animationName, "none", "JUMP has no CSS animation");
    assert.ok(animation.durationMs >= 600, `JUMP is too brief to read clearly: ${animation.durationMs}ms`);
    assert.ok(animation.jumpHeightPx >= 150,
      `JUMP height is below the confirmed 150px minimum: ${animation.jumpHeightPx}px`);

    await advance(page, 760);
    await emitPoseTransition(page, "Closed_Fist");
    const firstTarget = await advanceUntil(page, value => Boolean(value.level?.target), 6_000);
    assert.ok(firstTarget.elapsed <= 6_000, `first L1 target appeared after ${firstTarget.elapsed}ms`);
    assert.equal(firstTarget.state.gameGestureGate, "armed", "first target cleared the prepared fist state");
    assert.ok(Number(firstTarget.state.level.firstInteractionAtMs) <= 6_000,
      `configured first interaction is too late: ${firstTarget.state.level.firstInteractionAtMs}ms`);

    const observedActions = [];
    current = firstTarget.state;
    for (let step = 0; step < 450 && current.screen === "LV-02"; step += 1) {
      if (current.level.target && !current.level.target.resolved) {
        observedActions.push(current.level.target.action);
        current = await emit(page, current.level.target.action, "parent_keyboard");
      }
      if (current.screen === "LV-02") current = await advance(page, 100);
    }
    assert.equal(current.screen, "LV-03", "L1 did not complete at 40 seconds");
    assert.equal(observedActions.at(-1), "SWITCH_CHARACTER", "L1 final command is not partner switch");
    assert.equal(current.completionSummary.switchCompleted, true, "L1 final switch was not recorded");
    assert.equal((await page.locator("body").innerText()).includes("Game Over"), false);
    pass("camera profile exposes PoseTransitionEvent/HandTrackingFrame capabilities; L1 consumes pose transitions, jumps ≥150px, and ends with SWITCH");
    await page.close();
  }

  // L2: the normalized HandTrackingFrame stream has no gesture label. Every
  // frame must apply EMA(.28), a 3.5% dead zone, and a 12% maximum step.
  // Repeated missing frames model the real 80ms recognizer cadence rather than
  // one test-only toggle followed by a large deterministic clock jump.
  {
    const page = await makePage({ width: 1280, height: 720 });
    await startWithMode(page, "camera_full");
    await unlockThrough(page, 0);
    let current = await selectLevel(page, "L2");
    assertLevelContract(current, LEVELS[1]);
    current = await launchSelectedLevel(page);

    // The real recognizer bridge may report None/Unknown while landmarks are
    // usable. Both frames must still become HandTrackingFrame updates.
    const bridgeStartY = current.level.playerYNormalized;
    current = await renderHand(page, "None", {
      handPresent: true,
      landmarks: palmLandmarks(.22)
    });
    const bridgeUpperY = current.level.playerYNormalized;
    assert.ok(bridgeUpperY < bridgeStartY,
      `L2 None-label recognizer frame did not move upward: ${bridgeStartY} -> ${bridgeUpperY}`);
    current = await renderHand(page, "Unknown", {
      handPresent: true,
      landmarks: palmLandmarks(.78)
    });
    assert.ok(current.level.playerYNormalized > bridgeUpperY,
      `L2 Unknown-label recognizer frame did not move downward: ${bridgeUpperY} -> ${current.level.playerYNormalized}`);

    let expectedY = current.level.playerYNormalized;
    for (let frame = 0; frame < 7; frame += 1) {
      const previousY = current.level.playerYNormalized;
      expectedY = expectedTrackingStep(expectedY, .22);
      current = await emitHandTrackingFrame(page, {
        handPresent: true,
        palmCenterY: .22,
        confidence: .98
      });
      approx(current.level.playerYNormalized, expectedY, .006,
        `L2 upper EMA frame ${frame + 1}`);
      assert.ok(Math.abs(current.level.playerYNormalized - previousY) <= .1201,
        `L2 upper frame exceeded 12% max step: ${previousY} -> ${current.level.playerYNormalized}`);
    }
    const highPosition = current.level.playerYNormalized;
    assert.ok(highPosition < .29,
      `L2 repeated upper frames did not visibly move the actor: ${highPosition}`);

    for (let frame = 0; frame < 7; frame += 1) {
      const previousY = current.level.playerYNormalized;
      expectedY = expectedTrackingStep(expectedY, .78);
      current = await emitHandTrackingFrame(page, {
        handPresent: true,
        palmCenterY: .78,
        confidence: .98
      });
      approx(current.level.playerYNormalized, expectedY, .006,
        `L2 lower EMA frame ${frame + 1}`);
      assert.ok(Math.abs(current.level.playerYNormalized - previousY) <= .1201,
        `L2 lower frame exceeded 12% max step: ${previousY} -> ${current.level.playerYNormalized}`);
    }
    const lowPosition = current.level.playerYNormalized;
    assert.ok(lowPosition - highPosition >= .32,
      `L2 actor did not visibly follow the label-free palm-center stream: ${highPosition} -> ${lowPosition}`);

    const beforeLossElapsed = current.level.activePlayElapsedMs;
    const heldY = current.level.playerYNormalized;
    for (let frame = 0; frame < 5; frame += 1) {
      current = await emitHandTrackingFrame(page, {
        handPresent: false,
        palmCenterY: null,
        confidence: 0
      });
      current = await advance(page, 80);
    }
    assert.equal(current.level.pauseReason, null, "400ms continuous hand loss paused L2 too early");
    approx(current.level.playerYNormalized, heldY, .003, "short hand loss holds last Y");
    assert.ok(current.level.activePlayElapsedMs > beforeLossElapsed,
      "short hand loss stopped the world instead of holding the actor");

    for (let frame = 0; frame < 4 && current.level.pauseReason !== "hand"; frame += 1) {
      current = await emitHandTrackingFrame(page, {
        handPresent: false,
        palmCenterY: null,
        confidence: 0
      });
      current = await advance(page, 80);
    }
    assert.equal(current.level.pauseReason, "hand",
      "sustained 80ms missing frames did not safely pause L2 after the 600ms grace");
    const pausedElapsed = current.level.activePlayElapsedMs;
    current = await advance(page, 1_000);
    assert.equal(current.level.activePlayElapsedMs, pausedElapsed, "L2 advanced while hand-paused");

    current = await emitHandTrackingFrame(page, {
      handPresent: true,
      palmCenterY: .50,
      confidence: .98
    });
    assert.equal(current.level.pauseReason, "resume", "returning tracking frame did not start safe resume");
    current = await advance(page, 1_300);
    assert.equal(current.level.pauseReason, null, "L2 did not resume after hand returned");

    // Stay low for the first upper gap and let the production target timer make
    // the collision decision; do not call the collision reducer directly.
    for (let frame = 0; frame < 5; frame += 1) {
      current = await emitHandTrackingFrame(page, {
        handPresent: true,
        palmCenterY: .72,
        confidence: .98
      });
    }
    current = await advance(page, Math.max(0, 9_950 - current.level.activePlayElapsedMs));
    const shieldBefore = current.level.shieldHits;
    const collectedBefore = current.level.collectedCount;
    current = await advance(page, 100);
    assert.equal(current.level.shieldHits, shieldBefore + 1, "L2 collision did not consume shield feedback");
    assert.equal(current.level.collectedCount, collectedBefore, "L2 shield collision removed a collectible");
    assert.equal(current.screen, "LV-02", "L2 collision ended the level");
    const collisionSafeY = current.level.playerYNormalized;
    await page.keyboard.press("ArrowUp");
    current = await getState(page);
    assert.ok(current.level.playerYNormalized < collisionSafeY,
      `L2 ArrowUp moved down after shield snap: ${collisionSafeY} -> ${current.level.playerYNormalized}`);
    assert.equal((await page.locator("body").innerText()).includes("Game Over"), false);
    pass("L2 HandTrackingFrame filters continuous input, pauses sustained loss, naturally resolves a gap with a shield, and keeps keyboard direction coherent after snap-back");
    await page.close();
  }

  // L3: one cloud per armed cycle, under-build auto padding, over-build stars.
  {
    const page = await makePage({ width: 1280, height: 720 });
    await startWithMode(page, "camera_full");
    await unlockThrough(page, 1);
    let current = await selectLevel(page, "L3");
    assertLevelContract(current, LEVELS[2]);
    current = await launchSelectedLevel(page);
    assert.ok(current.level.cloudTargetLayers >= 1 && current.level.cloudTargetLayers <= 3,
      `L3 target is outside 1–3 layers: ${current.level.cloudTargetLayers}`);

    const firstTarget = current.level.cloudTargetLayers;
    const padBefore = current.level.cloudAutoPadCount;
    current = await advance(page, 9_050);
    assert.equal(current.level.cloudAutoPadCount, padBefore + firstTarget,
      "the naturally timed under-built round did not auto-pad all missing layers");
    assert.equal(current.level.lastCloudResult.autoPadded, firstTarget);
    assert.equal(current.screen, "LV-02");
    const assistFeedback = await checkWorldFeedback(page, ["assist", "安全云", "补"],
      "L3 under-build assist");
    assert.ok(assistFeedback.assistLayerCount >= firstTarget,
      `L3 rendered ${assistFeedback.assistLayerCount} safety clouds for ${firstTarget} missing layers`);
    assert.ok(assistFeedback.cloudRisePx >= firstTarget * 40,
      `L3 safety clouds did not visibly lift the actor: ${assistFeedback.cloudRisePx}px`);
    current = await advance(page, 950);
    assert.equal(current.level.cloudCount, 0,
      "L3 resolved stack did not finish its visible reset before the next round");

    const secondTarget = current.level.cloudTargetLayers;
    assert.ok(secondTarget >= 1 && secondTarget <= 3,
      `next L3 target is outside 1–3 layers: ${secondTarget}`);
    current = await addCloud(page);
    const afterOneCloud = current.level.cloudCount;
    current = await emitPoseTransition(page, "Open_Palm");
    assert.equal(current.level.cloudCount, afterOneCloud, "held palm added a duplicate cloud");
    current = await advance(page, 760);
    current = await emitPoseTransition(page, "Open_Palm");
    assert.equal(current.level.cloudCount, afterOneCloud,
      "palm added another cloud without returning to fist");

    while (current.level.cloudCount < secondTarget + 2) current = await addCloud(page);
    const builtLayers = current.level.cloudCount;
    const starsBefore = current.level.cloudStarCount;
    current = await advance(page, Math.max(0, 20_050 - current.level.activePlayElapsedMs));
    assert.equal(current.level.cloudStarCount, starsBefore + builtLayers - secondTarget,
      "the naturally timed over-built round did not convert extra clouds one-for-one into stars");
    assert.equal(current.level.lastCloudResult.starsAwarded, builtLayers - secondTarget);
    const starFeedback = await checkWorldFeedback(page, ["star", "星星"], "L3 over-build bonus");
    assert.ok(starFeedback.starUnits >= builtLayers - secondTarget,
      `L3 showed ${starFeedback.starUnits} star units for ${builtLayers - secondTarget} extra clouds`);
    assert.equal((await page.locator("body").innerText()).includes("Game Over"), false);
    pass("L3 consumes PoseTransitionEvent cycles, renders in-world assist/star feedback, auto-pads missing layers, and converts extras to stars");
    await page.close();
  }

  // Keyboard is a complete fallback, but discrete actions still use the same
  // 700ms acceptance window so a key bounce/rapid double press cannot produce
  // two clouds or restart a jump while it is still in flight.
  {
    const page = await makePage({ width: 1280, height: 720 });
    await startWithMode(page, "keyboard_full");
    let current = await selectLevel(page, "L1");
    current = await launchSelectedLevel(page);
    const jumpFeedbackBefore = current.level.actionFeedbackCount;
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    current = await getState(page);
    assert.equal(current.level.actionFeedbackCount, jumpFeedbackBefore + 1,
      "rapid keyboard presses restarted L1 jump inside the discrete freeze window");

    await completeLevel(page);
    await selectLevel(page, "L2");
    await launchSelectedLevel(page);
    await completeLevel(page);
    await selectLevel(page, "L3");
    current = await launchSelectedLevel(page);
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    current = await getState(page);
    assert.equal(current.level.cloudCount, 1,
      "rapid keyboard presses added two clouds inside the discrete freeze window");
    current = await advance(page, 760);
    await page.keyboard.press("Space");
    current = await getState(page);
    assert.equal(current.level.cloudCount, 2,
      "keyboard cloud action did not unlock after the 700ms freeze window");
    pass("keyboard fallback shares the 700ms discrete-action freeze for L1 and L3");
    await page.close();
  }

  // Five supported viewports: all product screens remain single-view, camera
  // copy never covers the image, and a three-layer L3 stack stays in-world.
  for (const viewport of VIEWPORTS) {
    const page = await makePage(viewport);
    await startWithMode(page, "camera_full");
    await checkSingleViewport(page, `${viewport.label} LV-00 map`);

    await selectLevel(page, "L1");
    await checkSingleViewport(page, `${viewport.label} L1 launch`);
    await launchSelectedLevel(page);
    await emitPoseTransition(page, "Closed_Fist");
    await checkSingleViewport(page, `${viewport.label} L1 runtime`);
    await checkCoachDoesNotCoverVideo(page, `${viewport.label} L1 coach`);
    await completeLevel(page);
    await checkSingleViewport(page, `${viewport.label} L1 celebration`);

    await selectLevel(page, "L2");
    await checkSingleViewport(page, `${viewport.label} L2 launch`);
    await launchSelectedLevel(page);
    await emitHandTrackingFrame(page, {
      handPresent: true,
      palmCenterY: .35,
      confidence: .98
    });
    await checkSingleViewport(page, `${viewport.label} L2 runtime`);
    await checkCoachDoesNotCoverVideo(page, `${viewport.label} L2 coach`);
    await completeLevel(page);

    await selectLevel(page, "L3");
    await checkSingleViewport(page, `${viewport.label} L3 launch`);
    await launchSelectedLevel(page);
    for (let cloud = 0; cloud < 3; cloud += 1) await addCloud(page);
    await checkSingleViewport(page, `${viewport.label} L3 runtime`);
    await checkCoachDoesNotCoverVideo(page, `${viewport.label} L3 coach`);
    await checkCloudBounds(page, `${viewport.label} L3 clouds`);
    await completeLevel(page);
    await checkSingleViewport(page, `${viewport.label} L3 celebration`);

    await page.close();
    pass(`${viewport.label}: all three runtimes fit one viewport; coach and clouds stay in their bounds`);
  }

  assert.deepEqual(browserErrors, [], `browser errors:\n${browserErrors.join("\n")}`);
  console.log(`DONE ${passes.length} confirmed-runtime targeted checks passed`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
