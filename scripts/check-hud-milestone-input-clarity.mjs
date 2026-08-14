import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const screenshotDir = path.join(root, "qa/screenshots/hud-milestone-input-clarity");
const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { width:1440, height:900 },
  { width:1219, height:681 },
  { width:919, height:843 }
];

fs.mkdirSync(screenshotDir, { recursive:true });
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".png":"image/png", ".mp3":"audio/mpeg", ".task":"application/octet-stream" };
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
const browser = await chromium.launch({ headless:true, executablePath:chromePath });
const page = await browser.newPage({ viewport:viewports[0], deviceScaleFactor:1 });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) errors.push(`${response.status()} ${response.url()}`); });

const inside = (child, parent, padding = 0) => child.left >= parent.left + padding && child.top >= parent.top + padding && child.right <= parent.right - padding && child.bottom <= parent.bottom - padding;

try {
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  const report = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      window.__mvpTest.startWithMode("keyboard_full");
      window.__mvpTest.selectLevel("L1");
      document.querySelector("#launch-start").click();
    });
    await page.waitForTimeout(50);
    const launch = await page.evaluate(() => {
      const box = selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height };
      };
      const textBox = selector => {
        const node = document.querySelector(selector).firstChild;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height };
      };
      return {
        panel:box("#launch-panel"), title:box("#lv01-title"), count:textBox("#launch-count"), status:textBox("#launch-status"),
        counting:document.querySelector("#launch-panel").classList.contains("is-counting"),
        countText:document.querySelector("#launch-count").textContent
      };
    });
    assert.equal(launch.counting, true, `countdown state missing at ${viewport.width}x${viewport.height}`);
    assert.equal(launch.countText, "3", `countdown number missing at ${viewport.width}x${viewport.height}`);
    assert.ok(inside(launch.title, launch.panel, 20), `countdown title exceeds safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(inside(launch.count, launch.panel, 20), `countdown number exceeds safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(inside(launch.status, launch.panel, 20), `countdown status exceeds safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(launch.title.bottom + 12 <= launch.count.top, `countdown title collides with number at ${viewport.width}x${viewport.height}`);
    assert.ok(launch.count.bottom + 8 <= launch.status.top, `countdown number collides with status at ${viewport.width}x${viewport.height}`);
    await page.screenshot({ path:path.join(screenshotDir, `countdown-${viewport.width}x${viewport.height}.png`), fullPage:false });

    await page.evaluate(() => { window.__mvpTest.advance(3100); window.__mvpTest.advance(8100); window.__mvpTest.setProgressMeters(100); });
    await page.waitForTimeout(80);
    const game = await page.evaluate(() => {
      const box = selector => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        return { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height };
      };
      const coach = document.querySelector("#game-coach");
      const guide = document.querySelector("#tracking-guide");
      const pauseLead = document.querySelector("#pause-copy");
      const leadStyle = getComputedStyle(pauseLead);
      return {
        panel:box("#milestone-hud"), copy:box(".milestone-copy"), meters:box("#milestone-meters"), track:box(".milestone-copy .progress-track"), overlay:box("#milestone-overlay"),
        visibleHudText:document.querySelector("#milestone-hud").innerText,
        hasVisibleScore:document.querySelector(".milestone-score") !== null,
        hasVisibleLabel:document.querySelector(".milestone-label") !== null,
        overlayText:document.querySelector("#milestone-overlay").innerText,
        overlayImageCount:document.querySelectorAll("#milestone-overlay img").length,
        overlayAnimation:getComputedStyle(document.querySelector("#milestone-overlay")).animationName,
        coachHidden:coach.hidden && getComputedStyle(coach).display === "none" && coach.getAttribute("aria-hidden") === "true",
        guideHidden:getComputedStyle(guide).display === "none" && !guide.classList.contains("show"),
        digitCount:document.querySelectorAll("#milestone-meters .art-digit").length,
        hasStyledMeterUnit:Boolean(document.querySelector("#milestone-meters .art-unit-m")) && getComputedStyle(document.querySelector("#milestone-meters .art-unit-m")).backgroundImage.includes("adventure-digits.png"),
        digitAssetReady:document.documentElement.classList.contains("art-digits-ready"),
        pauseLineHeight:parseFloat(leadStyle.lineHeight), pauseFontSize:parseFloat(leadStyle.fontSize)
      };
    });
    assert.equal(game.hasVisibleScore, false, `runtime score should not be visible at ${viewport.width}x${viewport.height}`);
    assert.equal(game.hasVisibleLabel, false, `runtime stage label should not be visible at ${viewport.width}x${viewport.height}`);
    assert.ok(!/[★星]/.test(game.visibleHudText), `star/rating concept remains in HUD at ${viewport.width}x${viewport.height}`);
    assert.ok(!/新挑战/.test(game.visibleHudText + game.overlayText), `duplicate challenge copy remains at ${viewport.width}x${viewport.height}`);
    assert.equal(game.overlayImageCount, 0, `milestone overlay still reuses HUD image at ${viewport.width}x${viewport.height}`);
    assert.match(game.overlayAnimation, /milestoneCelebrate/, `celebration animation missing at ${viewport.width}x${viewport.height}`);
    assert.ok(inside(game.copy, game.panel), `HUD content exceeds panel at ${viewport.width}x${viewport.height}`);
    assert.ok(inside(game.meters, game.copy), `HUD meters exceed safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(game.track.width >= game.copy.width * .98, `HUD progress is not full-width at ${viewport.width}x${viewport.height}`);
    assert.ok(game.overlay.left >= 0 && game.overlay.right <= viewport.width && game.overlay.top >= 0 && game.overlay.bottom <= viewport.height, `celebration is clipped at ${viewport.width}x${viewport.height}`);
    assert.equal(game.coachHidden, true, `keyboard coach remains visible at ${viewport.width}x${viewport.height}`);
    assert.equal(game.guideHidden, true, `keyboard hand guide remains visible at ${viewport.width}x${viewport.height}`);
    assert.ok(game.digitCount >= 3, `stylized meter digits missing at ${viewport.width}x${viewport.height}`);
    assert.equal(game.hasStyledMeterUnit, true, `meter unit m is not using the shared glyph atlas at ${viewport.width}x${viewport.height}`);
    assert.equal(game.digitAssetReady, true, `stylized digit asset failed at ${viewport.width}x${viewport.height}`);
    assert.ok(game.pauseLineHeight >= game.pauseFontSize * 1.5, `pause copy line-height remains tight at ${viewport.width}x${viewport.height}`);
    await page.screenshot({ path:path.join(screenshotDir, `milestone-${viewport.width}x${viewport.height}.png`), fullPage:false });
    await page.evaluate(() => {
      document.querySelector("#pause-eyebrow").textContent = "伙伴接力";
      document.querySelector("#pause-title").textContent = "请伙伴来接着跑";
      document.querySelector("#pause-copy").textContent = "先握拳准备，再张开手。需要时，也可以点伙伴大头像。";
      const layer = document.querySelector("#pause-layer");
      layer.classList.add("show");
      layer.setAttribute("aria-hidden", "false");
    });
    await page.screenshot({ path:path.join(screenshotDir, `pause-${viewport.width}x${viewport.height}.png`), fullPage:false });
    await page.evaluate(() => {
      const layer = document.querySelector("#pause-layer");
      layer.classList.remove("show");
      layer.setAttribute("aria-hidden", "true");
    });
    report.push({ viewport, launch, game });
  }

  await page.setViewportSize(viewports[0]);
  await page.evaluate(() => {
    window.__mvpTest.startWithMode("camera_full");
    window.__mvpTest.selectLevel("L2");
    document.querySelector("#launch-start").click();
    window.__mvpTest.advance(3100);
  });
  await page.waitForTimeout(50);
  const cameraChrome = await page.evaluate(() => {
    const coach = document.querySelector("#game-coach");
    const guide = document.querySelector("#tracking-guide");
    return { coachVisible:!coach.hidden && getComputedStyle(coach).display !== "none" && coach.getAttribute("aria-hidden") === "false", guideVisible:getComputedStyle(guide).display !== "none" && guide.classList.contains("show") };
  });
  assert.equal(cameraChrome.coachVisible, true, "camera coach should remain visible");
  assert.equal(cameraChrome.guideVisible, true, "camera follow mode should retain the hand guide");
  assert.deepEqual(errors, [], `browser errors: ${errors.join("; ")}`);
  console.log(JSON.stringify({ passed:true, viewports:viewports.length, cameraChrome, screenshots:screenshotDir }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
