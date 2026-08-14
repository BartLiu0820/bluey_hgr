import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".task": "application/octet-stream" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = path.resolve(root, `.${pathname}`);
  if (!requested.startsWith(`${root}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type": mime[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(file)}`;
const browser = await chromium.launch({ headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const errors = [];

async function pageAt(viewport = { width: 1280, height: 720 }) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  return page;
}

async function state(page) { return page.evaluate(() => window.__mvpTest.getState()); }
async function advance(page, ms) { return page.evaluate(value => window.__mvpTest.advance(value), ms); }
async function startMode(page, mode = "keyboard_full") { return page.evaluate(value => window.__mvpTest.startWithMode(value), mode); }
async function select(page, id) { return page.evaluate(value => window.__mvpTest.selectLevel(value), id); }
async function emit(page, action) { return page.evaluate(value => window.__mvpTest.emit(value, "child_keyboard"), action); }
async function track(page, frame) { return page.evaluate(value => window.__mvpTest.emitHandTrackingFrame(value), frame); }

async function driveVerticalClimb(page, durationMs, timestampStart = 1_000) {
  const samples = [];
  let cameraShiftObserved = false;
  for (let elapsed = 0; elapsed < durationMs; elapsed += 50) {
    const before = await state(page);
    const level = before.level;
    const nextPlatform = [...level.platforms]
      .filter(platform => platform.worldY > level.lastLandedWorldY + 18)
      .filter(platform => platform.worldY <= level.lastLandedWorldY + 150)
      .sort((a, b) => a.worldY - b.worldY)[0];
    if (nextPlatform) {
      await track(page, {
        handPresent:true,
        palmCenterX:nextPlatform.xNormalized,
        palmCenterY:.5,
        timestamp:timestampStart + elapsed
      });
    }
    await advance(page, 50);
    const after = await state(page);
    if (after.level.cameraY > level.cameraY + .01) {
      const common = level.platforms.find(platform => after.level.platforms.some(candidate => candidate.id === platform.id));
      const shifted = common && after.level.platforms.find(platform => platform.id === common.id);
      if (shifted && shifted.worldY === common.worldY && shifted.screenY > common.screenY) cameraShiftObserved = true;
    }
    samples.push(after.level);
  }
  return { samples, cameraShiftObserved };
}

function pass(copy) { console.log(`PASS ${copy}`); }

try {
  const page = await pageAt();

  assert.equal(await page.locator("#next-gesture").textContent(), "开始游戏");
  assert.equal((await page.locator("body").innerText()).includes("去看看结果"), false);
  pass("输入准备页主按钮直接开始游戏");

  let current = await startMode(page);
  assert.equal(current.screen, "LV-00");
  assert.deepEqual([...current.unlockedLevelIds].sort(), ["L1", "L2", "L3"]);
  assert.deepEqual(current.inputProfile.capabilities, { poseTransition: true, handTrackingY: true, handTrackingX: true });
  const disabled = await page.locator(".level-card:disabled").count();
  assert.equal(disabled, 0);
  pass("三个玩法默认全部可选");

  const instructions = {
    L1: "空格跳",
    L2: "↑ ↓ 带路",
    L3: "← → 带路"
  };
  for (const id of ["L1", "L2", "L3"]) {
    await select(page, id);
    assert.equal((await state(page)).screen, "LV-01");
    assert.equal((await page.locator("#launch-status").textContent()).trim(), instructions[id]);
    await page.locator("#launch-back").click();
    assert.equal((await state(page)).screen, "LV-00");
  }
  pass("每个玩法在自身启动层展示独立短提示");

  await select(page, "L1");
  await page.locator("#launch-start").click();
  await advance(page, 3_000);
  current = await state(page);
  assert.equal(current.screen, "LV-02");
  assert.equal(current.level.phase, "tutorial");
  await emit(page, "JUMP");
  await advance(page, 4_000);
  current = await state(page);
  assert.equal(current.level.phase, "scored_run");

  await advance(page, 1_800);
  current = await state(page);
  assert.ok(current.level.target, "L1 did not spawn its first spatial target");
  const beforeSuccess = current.level.score;
  await emit(page, "JUMP");
  await advance(page, 1_050);
  current = await state(page);
  assert.equal(current.level.courage, 3);
  assert.equal(current.level.target, null);
  assert.ok(current.level.score >= beforeSuccess + 20, "successful jump did not score");
  assert.ok(current.level.jumpY >= 54, `jump was too low at obstacle: ${current.level.jumpY}px`);
  pass("L1 使用同一世界速度做空间碰撞，及时起跳可以越过障碍");

  await advance(page, 3_600);
  current = await state(page);
  assert.ok(current.level.target, "L1 did not spawn a target for miss testing");
  await advance(page, 1_050);
  current = await state(page);
  assert.equal(current.level.courage, 2);
  assert.equal(current.level.phase, "rescue");
  assert.ok(current.level.passedObjects.length > 0, "L1 obstacle vanished on the collision frame");
  const l1PassedBefore = current.level.passedObjects[0].worldX;
  assert.ok(await page.locator("#passed-object-layer [data-passed-object]").count() > 0,
    "L1 judged obstacle is not rendered during rescue");
  assert.equal(await page.locator("#level-dog-wrap").evaluate(node => node.classList.contains("falling") || node.classList.contains("bump")), true);
  await advance(page, 300);
  current = await state(page);
  assert.ok(current.level.passedObjects[0].worldX < l1PassedBefore,
    "L1 judged obstacle stopped instead of continuing left during rescue");
  assert.ok(await page.locator("#passed-object-layer [data-passed-object]").count() > 0,
    "L1 judged obstacle disappeared before leaving the viewport");
  await advance(page, 550);
  assert.equal((await state(page)).level.phase, "scored_run");
  pass("L1 失误会扣勇气心、播放受挫动作，障碍继续向左离场");

  await page.evaluate(() => window.__mvpTest.completeLevel());
  current = await state(page);
  assert.equal(current.screen, "LV-03");
  assert.equal(Number(await page.locator("#finish-score").textContent()), current.completionSummary.score);
  assert.equal(await page.locator("#local-score-list li").count(), 1);
  assert.equal(current.completionSummary.snapshotCaptured, false);
  assert.equal(current.completionSummary.videoRecorded, false);
  assert.equal(await page.locator("#run-memory").evaluate(node => node.classList.contains("has-snapshot")), false);
  assert.equal(await page.locator("#play-again").getAttribute("aria-label"), "再玩一次");
  assert.equal(await page.locator("#return-map").getAttribute("aria-label"), "换个玩法");
  assert.equal((await page.locator("#play-again").textContent()).trim(), "");
  assert.equal((await page.locator("#return-map").textContent()).trim(), "");
  pass("本局成绩进入设备本地玩法 Top 5，结果页可重玩或换玩法");

  await page.close();

  const followPage = await pageAt();
  await startMode(followPage);
  await select(followPage, "L2");
  await followPage.locator("#launch-start").click();
  await advance(followPage, 3_000);
  await track(followPage, { handPresent:true, palmCenterY:.28, palmCenterX:.5, timestamp:100 });
  await track(followPage, { handPresent:true, palmCenterY:.68, palmCenterX:.5, timestamp:200 });
  await advance(followPage, 5_000);
  await advance(followPage, 1_800);
  current = await state(followPage);
  assert.ok(current.level.target, "L2 did not spawn a moving obstacle");
  for (let index = 0; index < 8; index += 1) {
    await track(followPage, { handPresent:true, palmCenterY:current.level.target.safeY, palmCenterX:.5, timestamp:300 + index * 20 });
  }
  await advance(followPage, 1_550);
  current = await state(followPage);
  assert.ok(current.level.passedObjects.length > 0, "L2 obstacle vanished at the player collision line");
  const passedBefore = current.level.passedObjects[0].worldX;
  assert.ok(await followPage.locator("#passed-object-layer [data-passed-object]").count() > 0,
    "L2 passed obstacle is not rendered after crossing the player");
  await advance(followPage, 400);
  current = await state(followPage);
  assert.ok(current.level.passedObjects[0].worldX < passedBefore,
    "L2 passed obstacle stopped instead of continuing toward the exit");
  assert.ok(await followPage.locator("#passed-object-layer [data-passed-object]").count() > 0,
    "L2 passed obstacle disappeared before leaving the viewport");
  await followPage.close();
  pass("L2 障碍越过角色后仍持续移动，直到完整离开画面");

  const bouncePage = await pageAt();
  await startMode(bouncePage);
  await select(bouncePage, "L3");
  await bouncePage.locator("#launch-start").click();
  await advance(bouncePage, 3_000);
  await track(bouncePage, { handPresent:true, palmCenterX:.28, palmCenterY:.5, timestamp:100 });
  await track(bouncePage, { handPresent:true, palmCenterX:.72, palmCenterY:.5, timestamp:200 });
  await driveVerticalClimb(bouncePage, 5_000, 300);
  current = await state(bouncePage);
  assert.equal(current.level.runtimeType, "auto_bounce_climb");
  assert.equal(current.level.target, null, "L3 incorrectly retained the old timed target line");
  assert.ok(current.level.platformCount >= 6, "L3 did not build a vertical platform world");
  const initialMaxPlatformY = Math.max(...current.level.platforms.map(platform => platform.worldY));
  const climb = await driveVerticalClimb(bouncePage, 12_000, 6_000);
  current = await state(bouncePage);
  const phases = new Set(climb.samples.map(sample => sample.bouncePhase));
  assert.ok(phases.has("rising") && phases.has("falling"), "L3 did not continuously rise and fall");
  assert.ok(current.level.platformLandings >= 3, `L3 did not complete repeated descending landings: ${current.level.platformLandings}`);
  assert.ok(current.level.climbHeight >= 180, `L3 did not gain real world height: ${current.level.climbHeight}`);
  assert.ok(current.level.cameraY > 0, "L3 camera never followed the player upward");
  assert.ok(climb.cameraShiftObserved, "L3 platforms did not move down on screen while cameraY rose");
  assert.ok(current.level.playerScreenYNormalized >= .30 && current.level.playerScreenYNormalized <= .80,
    `L3 player was not held in the camera play band: ${current.level.playerScreenYNormalized}`);
  assert.ok(Math.max(...current.level.platforms.map(platform => platform.worldY)) > initialMaxPlatformY,
    "L3 did not generate higher platforms as the camera climbed");
  assert.ok(await bouncePage.locator("#bounce-platform-layer [data-bounce-platform]").count() > 0,
    "L3 vertical platforms are not visible in the camera world");
  await bouncePage.close();
  pass("L3 持续自动弹跳，下降落台再弹，达到阈值后镜头向上追随并生成更高平台");

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1219, height: 681 },
    { width: 1024, height: 700 },
    { width: 919, height: 843 }
  ]) {
    const viewportPage = await pageAt(viewport);
    await viewportPage.evaluate(() => {
      localStorage.setItem('gesture-pup-local-scores-v1', JSON.stringify({
        bestScoreByMode:{ L1:88 },
        topScoresByMode:{ L1:[88,72,61,49,35], L2:[], L3:[] },
        tutorialSeenByMode:{ L1:true, L2:false, L3:false }
      }));
    });
    await viewportPage.reload({ waitUntil:'load' });
    await viewportPage.waitForFunction(() => Boolean(window.__mvpTest));
    await startMode(viewportPage);
    const layout = await viewportPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      cards: [...document.querySelectorAll(".level-card")].map(node => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      })
    }));
    assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `${viewport.width} horizontal scroll`);
    assert.ok(layout.scrollHeight <= layout.clientHeight + 1, `${viewport.height} vertical scroll`);
    for (const card of layout.cards) {
      assert.ok(card.left >= -1 && card.right <= viewport.width + 1 && card.top >= -1 && card.bottom <= viewport.height + 1,
        `${viewport.width}x${viewport.height} mode card outside viewport`);
    }

    await select(viewportPage, "L1");
    let screenLayout = await viewportPage.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      controls: ["#launch-start", "#launch-back"].map(selector => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
      })
    }));
    assert.ok(screenLayout.scrollHeight <= screenLayout.clientHeight + 1, `${viewport.height} launch vertical scroll`);
    for (const control of screenLayout.controls) {
      assert.ok(control.top >= -1 && control.bottom <= viewport.height + 1 && control.left >= -1 && control.right <= viewport.width + 1,
        `${viewport.width}x${viewport.height} launch control outside viewport`);
    }

    await viewportPage.locator("#launch-start").click();
    await advance(viewportPage, 3_000);
    screenLayout = await viewportPage.evaluate(() => {
      const box = selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
      };
      const coach = box("#game-coach");
      const cue = box(".target-cue");
      const intersects = !(cue.right <= coach.left || cue.left >= coach.right || cue.bottom <= coach.top || cue.top >= coach.bottom);
      const actionCard = box("#action-card");
      const message = box("#game-message");
      const messageVisible = getComputedStyle(document.querySelector("#game-message")).display !== "none";
      const messageIntersectsAction = messageVisible && !(message.right <= actionCard.left || message.left >= actionCard.right || message.bottom <= actionCard.top || message.top >= actionCard.bottom);
      return {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        coach,
        cue,
        intersects,
        messageIntersectsAction,
        dog:box("#level-dog"),
        milestone:box("#milestone-hud"),
        milestoneTrack:box("#milestone-progress-fill"),
        meters:box("#milestone-meters"),
        scoreCount:document.querySelectorAll("#score-count").length,
        visualScoreCount:document.querySelectorAll(".milestone-score").length,
        visualStageCount:document.querySelectorAll(".milestone-label").length,
        styledMeterUnit:Boolean(document.querySelector("#milestone-meters .art-unit-m"))
      };
    });
    assert.ok(screenLayout.scrollHeight <= screenLayout.clientHeight + 1, `${viewport.height} game vertical scroll`);
    assert.ok(screenLayout.coach.top >= -1 && screenLayout.coach.bottom <= viewport.height + 1 && screenLayout.coach.right <= viewport.width + 1,
      `${viewport.width}x${viewport.height} game coach outside viewport`);
    assert.equal(screenLayout.intersects, false, `${viewport.width}x${viewport.height} instruction overlaps coach`);
    assert.equal(screenLayout.messageIntersectsAction, false, `${viewport.width}x${viewport.height} feedback text overlaps the action instruction`);
    assert.ok(screenLayout.dog.bottom >= viewport.height * .84, `${viewport.width}x${viewport.height} L1 dog appears to float above the road`);
    assert.ok(screenLayout.milestoneTrack.top >= screenLayout.milestone.top && screenLayout.milestoneTrack.bottom <= screenLayout.milestone.bottom,
      `${viewport.width}x${viewport.height} progress track escapes its illustrated panel`);
    assert.equal(screenLayout.visualScoreCount, 0, `${viewport.width}x${viewport.height} still renders a runtime score`);
    assert.equal(screenLayout.visualStageCount, 0, `${viewport.width}x${viewport.height} still renders a runtime stage label`);
    assert.equal(screenLayout.scoreCount, 1, `${viewport.width}x${viewport.height} must retain one semantic score value`);
    assert.equal(screenLayout.styledMeterUnit, true, `${viewport.width}x${viewport.height} meter unit is not stylized`);

    await viewportPage.evaluate(() => window.__mvpTest.completeLevel());
    screenLayout = await viewportPage.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      surfaces: ["#lv03 .finish-card", "#lv03 .finish-summary", "#local-score-list"].map(selector => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { selector, top:box.top, bottom:box.bottom, left:box.left, right:box.right };
      }),
      scoreRows: document.querySelectorAll("#local-score-list li").length,
      scoreValues:[...document.querySelectorAll("#local-score-list li strong")].map(node => Number(node.textContent)),
      scoreTops:[...document.querySelectorAll("#local-score-list li")].map(node => node.getBoundingClientRect().top),
      memory:(() => { const box=document.querySelector("#run-memory").getBoundingClientRect(); return { left:box.left,right:box.right,top:box.top,bottom:box.bottom }; })(),
      summary:(() => { const box=document.querySelector("#lv03 .finish-summary").getBoundingClientRect(); return { left:box.left,right:box.right,top:box.top,bottom:box.bottom }; })(),
      buttons: [...document.querySelectorAll("#lv03 .result-actions button")].map(node => {
        const box = node.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
      })
    }));
    assert.ok(screenLayout.scrollHeight <= screenLayout.clientHeight + 1, `${viewport.height} result vertical scroll`);
    assert.equal(screenLayout.scoreRows, 5, `${viewport.width}x${viewport.height} did not render the complete Top 5`);
    assert.deepEqual(screenLayout.scoreValues, [...screenLayout.scoreValues].sort((a,b) => b-a), `${viewport.width}x${viewport.height} Top 5 is not high-to-low`);
    assert.equal(screenLayout.scoreTops.every((top,index,all) => index === 0 || top > all[index-1]), true,
      `${viewport.width}x${viewport.height} Top 5 is not arranged vertically`);
    assert.ok(screenLayout.memory.right <= screenLayout.summary.left + 1,
      `${viewport.width}x${viewport.height} play-memory frame is not on the left of the ranking summary`);
    for (const surface of screenLayout.surfaces) {
      assert.ok(surface.top >= -1 && surface.bottom <= viewport.height + 1 && surface.left >= -1 && surface.right <= viewport.width + 1,
        `${viewport.width}x${viewport.height} ${surface.selector} outside viewport`);
    }
    for (const button of screenLayout.buttons) {
      assert.ok(button.top >= -1 && button.bottom <= viewport.height + 1 && button.left >= -1 && button.right <= viewport.width + 1,
        `${viewport.width}x${viewport.height} result button outside viewport`);
    }
    await viewportPage.close();
  }
  pass("玩法大厅、玩法说明、运行态和完整 Top 5 成绩页在六个目标视口保持单屏无滚动且不遮挡");

  assert.deepEqual(errors, []);
  console.log("Mode hub and scored-loop targeted QA complete: 9/9 PASS");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
