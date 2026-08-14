import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const screenshotDir = path.join(root, "qa/screenshots/ui-refinement");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { width:1840, height:1280 },
  { width:1219, height:681 },
  { width:919, height:843 }
];

fs.mkdirSync(screenshotDir, { recursive:true });

const mime = { ".html":"text/html; charset=utf-8", ".mjs":"text/javascript", ".js":"text/javascript", ".png":"image/png", ".mp3":"audio/mpeg", ".task":"application/octet-stream" };
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
page.on("console", message => {
  if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text());
});
page.on("response", response => {
  if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) errors.push(`${response.status()} ${response.url()}`);
});

function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

try {
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  await page.evaluate(() => {
    window.__mvpTest.startWithMode("keyboard_full");
    window.__mvpTest.selectLevel("L3");
    document.querySelector("#launch-start").click();
    window.__mvpTest.advance(3100);
    window.__mvpTest.advance(8100);
    window.__mvpTest.setProgressMeters(50);
  });

  const report = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      document.querySelector("#pause-layer").classList.remove("show");
      const layer = document.querySelector("#bounce-platform-layer");
      layer.replaceChildren();
      [
        { skin:"default", left:28, top:28, width:34 },
        { skin:"narrow", left:52, top:51, width:30 },
        { skin:"curved", left:76, top:74, width:31 }
      ].forEach(item => {
        const node = document.createElement("span");
        node.className = "bounce-platform";
        node.dataset.skin = item.skin;
        node.style.left = `${item.left}%`;
        node.style.top = `${item.top}%`;
        node.style.width = `${item.width}%`;
        layer.append(node);
      });
    });
    await page.waitForTimeout(80);

    const gameLayout = await page.evaluate(() => {
      const box = selector => {
        const element = document.querySelector(selector);
        const value = element.getBoundingClientRect();
        return { left:value.left, top:value.top, right:value.right, bottom:value.bottom, width:value.width, height:value.height };
      };
      const panel = box("#milestone-hud");
      const copy = box(".milestone-copy");
      const meters = box(".milestone-meters");
      const track = box(".milestone-copy .progress-track");
      const platforms = [...document.querySelectorAll(".bounce-platform")].map(node => ({
        skin:node.dataset.skin,
        rect:box(`[data-skin="${node.dataset.skin}"]`),
        backgroundSize:getComputedStyle(node).backgroundSize,
        backgroundPosition:getComputedStyle(node).backgroundPosition,
        boxShadow:getComputedStyle(node).boxShadow,
        filter:getComputedStyle(node).filter
      }));
      return { panel, copy, meters, track, hasVisibleScore:Boolean(document.querySelector(".milestone-score")), hasVisibleLabel:Boolean(document.querySelector(".milestone-label")), platforms };
    });

    assert.ok(gameLayout.copy.left - gameLayout.panel.left >= gameLayout.panel.width * .13, `HUD left padding too small at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.panel.right - gameLayout.copy.right >= gameLayout.panel.width * .12, `HUD right padding too small at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.copy.top - gameLayout.panel.top >= gameLayout.panel.height * .12, `HUD top padding too small at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.panel.bottom - gameLayout.copy.bottom >= gameLayout.panel.height * .24, `HUD bottom padding too small at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.track.width >= gameLayout.copy.width * .98, `HUD progress does not span bottom content width at ${viewport.width}x${viewport.height}`);
    assert.equal(gameLayout.hasVisibleScore, false, `HUD still renders a visual score at ${viewport.width}x${viewport.height}`);
    assert.equal(gameLayout.hasVisibleLabel, false, `HUD still renders a stage label at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.meters.left >= gameLayout.copy.left && gameLayout.meters.right <= gameLayout.copy.right, `HUD meters escape safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(gameLayout.track.top >= gameLayout.meters.bottom - 1, `HUD progress collides with meters at ${viewport.width}x${viewport.height}`);
    for (const platform of gameLayout.platforms) {
      assert.equal(platform.boxShadow, "none", `${platform.skin} platform still has a rectangular box shadow`);
      assert.match(platform.filter, /drop-shadow/, `${platform.skin} platform needs an alpha-aware shadow`);
      if (platform.skin !== "default") {
        assert.ok(platform.backgroundSize === "116%" || platform.backgroundSize === "116% auto", `${platform.skin} platform transparent canvas is not cropped`);
        assert.equal(platform.backgroundPosition, "50% 48%", `${platform.skin} platform subject is not centered`);
      }
    }
    await page.screenshot({ path:path.join(screenshotDir, `game-${viewport.width}x${viewport.height}.png`), fullPage:false });

    await page.evaluate(() => {
      document.querySelector("#pause-eyebrow").textContent = "伙伴接力";
      document.querySelector("#pause-title").textContent = "请伙伴来接着跑";
      document.querySelector("#pause-copy").textContent = "先握拳准备，再张开手。需要时，也可以点伙伴大头像。";
      const layer = document.querySelector("#pause-layer");
      layer.classList.add("show");
      layer.setAttribute("aria-hidden", "false");
    });
    await page.waitForTimeout(50);
    const pauseLayout = await page.evaluate(() => {
      const box = selector => {
        const element = document.querySelector(selector);
        const value = element.getBoundingClientRect();
        return { left:value.left, top:value.top, right:value.right, bottom:value.bottom, width:value.width, height:value.height };
      };
      const titleNode = document.querySelector("#pause-title");
      const contentNode = document.querySelector(".pause-content");
      const cardNode = document.querySelector(".pause-card");
      return {
        card:box(".pause-card"), content:box(".pause-content"), icon:box(".pause-icon-shell"),
        heading:box(".pause-copy-group"), title:box("#pause-title"), body:box("#pause-copy"),
        computed:{
          cardColumns:getComputedStyle(cardNode).gridTemplateColumns,
          cardPadding:`${getComputedStyle(cardNode).paddingTop} ${getComputedStyle(cardNode).paddingRight} ${getComputedStyle(cardNode).paddingBottom} ${getComputedStyle(cardNode).paddingLeft}`,
          contentWidth:getComputedStyle(contentNode).width,
          contentMaxWidth:getComputedStyle(contentNode).maxWidth,
          contentJustifySelf:getComputedStyle(contentNode).justifySelf
        },
        titleFits:titleNode.scrollWidth <= titleNode.clientWidth + 1,
        contentFits:contentNode.scrollWidth <= contentNode.clientWidth + 1 && contentNode.scrollHeight <= contentNode.clientHeight + 1
      };
    });
    assert.ok(Math.abs((pauseLayout.card.left + pauseLayout.card.right) / 2 - viewport.width / 2) <= 1, `pause card is not horizontally centered at ${viewport.width}x${viewport.height}`);
    assert.ok(Math.abs((pauseLayout.card.top + pauseLayout.card.bottom) / 2 - viewport.height / 2) <= 1, `pause card is not vertically centered at ${viewport.width}x${viewport.height}`);
    assert.ok(pauseLayout.content.left > pauseLayout.card.left && pauseLayout.content.right < pauseLayout.card.right, `pause content exceeds horizontal safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(pauseLayout.content.top > pauseLayout.card.top && pauseLayout.content.bottom < pauseLayout.card.bottom, `pause content exceeds vertical safe area at ${viewport.width}x${viewport.height}`);
    assert.ok(pauseLayout.icon.right + 10 <= pauseLayout.heading.left, `pause icon collides with heading at ${viewport.width}x${viewport.height}`);
    assert.ok(Math.abs(pauseLayout.body.left - pauseLayout.heading.left) <= 1, `pause body is not aligned to heading at ${viewport.width}x${viewport.height}`);
    assert.ok(pauseLayout.body.top >= pauseLayout.heading.bottom - 1, `pause body collides with heading at ${viewport.width}x${viewport.height}`);
    assert.equal(pauseLayout.titleFits, true, `pause title overflows at ${viewport.width}x${viewport.height}`);
    assert.equal(pauseLayout.contentFits, true, `pause content overflows at ${viewport.width}x${viewport.height}: ${JSON.stringify(pauseLayout)}`);
    await page.screenshot({ path:path.join(screenshotDir, `pause-${viewport.width}x${viewport.height}.png`), fullPage:false });
    report.push({ viewport, gameLayout, pauseLayout });
  }

  assert.deepEqual(errors, [], `browser errors: ${errors.join("; ")}`);
  console.log(JSON.stringify({ passed:true, viewports:report.map(item => item.viewport), screenshots:screenshotDir }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
