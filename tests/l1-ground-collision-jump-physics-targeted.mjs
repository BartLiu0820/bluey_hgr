import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = { ".css":"text/css", ".html":"text/html; charset=utf-8", ".png":"image/png", ".woff2":"font/woff2", ".mp3":"audio/mpeg", ".js":"text/javascript", ".mjs":"text/javascript", ".wasm":"application/wasm", ".task":"application/octet-stream" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = path.resolve(root, `.${pathname}`);
  if (!requested.startsWith(`${root}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type":mime[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(file)}`;
const browser = await chromium.launch({ headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const errors = [];

async function pageAt(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  return page;
}

async function launchScoredL1(page) {
  await page.evaluate(() => { window.__mvpTest.startWithMode("keyboard_full"); window.__mvpTest.selectLevel("L1"); });
  await page.locator("#launch-start").click();
  await page.evaluate(() => window.__mvpTest.advance(3000));
  await page.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
  await page.evaluate(() => window.__mvpTest.advance(4000));
  assert.equal((await page.evaluate(() => window.__mvpTest.getState().level.phase)), "scored_run");
}

async function sampleJump(page, progressMeters) {
  // Keep physics samples in one browser task so real animation frames cannot add time between samples.
  return page.evaluate(value => {
    window.__mvpTest.setProgressMeters(value);
    window.__mvpTest.emit("JUMP", "child_keyboard");
    const launch = window.__mvpTest.getState().level;
    let peak = 0;
    let elapsed = 0;
    for (; elapsed < 1500; elapsed += 16) {
      const level = window.__mvpTest.advance(16).level;
      peak = Math.max(peak, level.jumpY);
      if (elapsed > 100 && level.jumpY === 0) break;
    }
    return { launch, peak, elapsed };
  }, progressMeters);
}

function pass(copy) { console.log(`PASS ${copy}`); }

try {
  for (const viewport of [{ width:1440, height:900 }, { width:1219, height:681 }, { width:919, height:843 }]) {
    const page = await pageAt(viewport);
    await launchScoredL1(page);
    const playerX = await page.evaluate(() => document.querySelector("#game-world").clientWidth * .26);
    let state = await page.evaluate(value => {
      // Inject and evaluate the same swept sample before requestAnimationFrame updates previousWorldX.
      window.__mvpTest.setL1Target({ type:"box", worldX:value + 140, previousWorldX:value + 170 });
      return window.__mvpTest.evaluateL1Target();
    }, playerX);
    assert.equal(state.level.courage, 3, `${viewport.width} collision fired before swept hitboxes touched`);
    assert.ok(state.level.target, `${viewport.width} pre-contact target was resolved early`);

    state = await page.evaluate(value => {
      // Inject and evaluate the same swept sample before requestAnimationFrame updates previousWorldX.
      window.__mvpTest.setL1Target({ type:"box", worldX:value - 100, previousWorldX:value + 100 });
      return window.__mvpTest.evaluateL1Target();
    }, playerX);
    assert.equal(state.level.courage, 2, `${viewport.width} swept collision missed a target crossing the player in one sample`);
    assert.equal(state.level.collisionCount, 1, `${viewport.width} swept collision was not unique`);

    await page.evaluate(() => window.__mvpTest.advance(2050));
    await page.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
    await page.evaluate(() => window.__mvpTest.advance(380));
    const beforeSuccess = await page.evaluate(() => window.__mvpTest.getState().level);
    assert.ok(beforeSuccess.jumpY > 100, `${viewport.width} jump did not reach visible clearance`);
    state = await page.evaluate(value => {
      // Inject and evaluate the same swept sample before requestAnimationFrame updates previousWorldX.
      window.__mvpTest.setL1Target({ type:"box", worldX:value + 30, previousWorldX:value + 75 });
      return window.__mvpTest.evaluateL1Target();
    }, playerX);
    assert.equal(state.level.courage, 2, `${viewport.width} vertically separated target incorrectly collided`);
    assert.equal(state.level.target, null, `${viewport.width} safe spatial overlap did not resolve`);
    assert.ok(state.level.score >= beforeSuccess.score + 20, `${viewport.width} safe spatial overlap did not score`);

    await page.evaluate(() => window.__mvpTest.advance(1000));
    await page.evaluate(value => window.__mvpTest.setL1Target({ type:"box", worldX:value + 250, previousWorldX:value + 250 }), playerX);
    const geometry = await page.evaluate(() => {
      const rect = selector => { const value=document.querySelector(selector).getBoundingClientRect(); return { top:value.top, bottom:value.bottom, left:value.left, right:value.right }; };
      return { ground:rect("#map-ground-skin"), dog:rect("#level-dog-wrap"), obstacle:rect("#world-object") };
    });
    assert.ok(geometry.dog.bottom > geometry.ground.top && geometry.dog.bottom < geometry.ground.bottom + 2, `${viewport.width} player feet anchor is outside the depth ground band`);
    assert.ok(geometry.obstacle.bottom > geometry.ground.top && geometry.obstacle.bottom < geometry.ground.bottom + 2, `${viewport.width} obstacle base is outside the depth ground band`);
    assert.deepEqual(errors, [], `${viewport.width} browser errors: ${errors.join(" | ")}`);
    await page.close();
    pass(`${viewport.width}x${viewport.height} 地面纵深锚点、提前判碰与 swept 漏碰修复`);
  }

  const physicsPage = await pageAt({ width:1440, height:900 });
  await launchScoredL1(physicsPage);
  const base = await sampleJump(physicsPage, 0);
  await physicsPage.evaluate(() => window.__mvpTest.advance(300));
  const fast = await sampleJump(physicsPage, 1000);
  assert.equal(base.launch.jumpLaunchSpeedMultiplier, 1);
  assert.equal(fast.launch.jumpLaunchSpeedMultiplier, 1.6);
  assert.ok(fast.launch.jumpVelocity > base.launch.jumpVelocity, "high speed did not receive jump velocity assistance");
  assert.ok(fast.launch.jumpGravity > base.launch.jumpGravity, "high speed did not receive the paired gravity ramp");
  assert.ok(base.peak >= 185 && base.peak <= 210, `base peak outside child-safe band: ${base.peak}`);
  assert.ok(fast.peak > base.peak && fast.peak <= 225, `fast peak outside coupled band: ${fast.peak}`);
  assert.ok(base.elapsed >= 1080 && base.elapsed <= 1220, `base airtime outside band: ${base.elapsed}`);
  assert.ok(fast.elapsed >= base.elapsed && fast.elapsed <= 1240, `fast airtime lost predictability: ${fast.elapsed}`);

  const playerX = await physicsPage.evaluate(() => document.querySelector("#game-world").clientWidth * .26);
  await physicsPage.evaluate(value => window.__mvpTest.setL1Target({ type:"pit", worldX:value + 300, previousWorldX:value + 300 }), playerX);
  const lead = await physicsPage.evaluate(() => window.__mvpTest.getState().level.recommendedJumpLeadSeconds);
  assert.ok(lead >= .92 && lead <= 1.12, `cue lead outside child-safe reaction band: ${lead}`);
  await physicsPage.screenshot({ path:"/tmp/l1-ground-collision-jump-physics.png", fullPage:true });
  await physicsPage.close();
  pass("1.0×–1.6× 速度档使用成对起跳速度/重力补偿，腾空与提示窗口保持稳定");

  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
  console.log("L1 ground, collision and jump physics targeted QA complete: 4/4 PASS");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
