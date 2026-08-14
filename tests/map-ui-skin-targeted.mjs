import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const prototypeName = "04B-prototype-手势小狗探险MVP.html";
const screenshotDir = path.join(root, "qa/screenshots/map-ui-skin");
fs.mkdirSync(screenshotDir, { recursive:true });

const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".png":"image/png", ".json":"application/json", ".task":"application/octet-stream" };
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
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(prototypeName)}`;
const browser = await chromium.launch({ headless:true });
const errors = [];

function pass(copy) { console.log(`PASS ${copy}`); }

async function pageAt(viewport = { width:1440, height:900 }) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  return page;
}

async function startMap(page) {
  await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
}

try {
  const page = await pageAt();
  const setupButtons = await page.evaluate(() => ["camera-choice","keyboard-choice"].map(id => {
    const button=document.getElementById(id); const image=button.querySelector(":scope > img");
    return { id, text:button.textContent.trim(), iconButton:button.classList.contains("mode-icon-button"), imageWidth:image?.getBoundingClientRect().width || 0, buttonWidth:button.getBoundingClientRect().width };
  }));
  assert.equal(setupButtons.every(item => item.text === "" && item.iconButton && item.imageWidth >= item.buttonWidth - 6), true);
  await page.screenshot({ path:path.join(screenshotDir, "GI01-generated-art-buttons.png") });
  pass("圆形输入图标直接作为放大按钮本体，旁侧短文案不进入按钮");
  await startMap(page);

  const hubSkin = await page.evaluate(() => ({
    bodyBackground:getComputedStyle(document.body).backgroundImage,
    paper:getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
    bark:getComputedStyle(document.documentElement).getPropertyValue("--bark").trim(),
    cards:[...document.querySelectorAll(".level-card-scene")].map(node => getComputedStyle(node).backgroundImage),
    cardBorder:getComputedStyle(document.querySelector(".level-card")).borderBottomWidth,
    oldPseudo:[...document.querySelectorAll(".level-card-scene")].map(node => getComputedStyle(node,"::before").content)
  }));
  assert.match(hubSkin.bodyBackground, /maps\/menu\/adventure-garden\.png/);
  assert.equal(hubSkin.paper, "#fff9e8");
  assert.equal(hubSkin.bark, "#8a5a32");
  assert.deepEqual(hubSkin.cards.map(image => /creek\//.test(image) ? "creek" : /firefly\//.test(image) ? "firefly" : /treetop\//.test(image) ? "treetop" : "missing"), ["creek","firefly","treetop"]);
  assert.ok(Number.parseFloat(hubSkin.cardBorder) >= 6);
  assert.ok(hubSkin.oldPseudo.every(value => value === "none"));
  await page.screenshot({ path:path.join(screenshotDir, "hub-illustrated-cards.png") });
  pass("初始背景使用生成的探险花园，玩法大厅使用三张真实地图预览与统一手绘 UI");

  const themes = { L1:"creek", L2:"firefly", L3:"treetop" };
  for (const [levelId, theme] of Object.entries(themes)) {
    await page.evaluate(id => window.__mvpTest.selectLevel(id), levelId);
    const launch = await page.evaluate(() => ({
      theme:document.querySelector("#launch-world").dataset.theme,
      far:getComputedStyle(document.querySelector("#launch-map-far")).backgroundImage,
      mid:getComputedStyle(document.querySelector("#launch-map-mid")).backgroundImage,
      ground:getComputedStyle(document.querySelector("#launch-map-ground")).display,
      oldScenery:document.querySelectorAll("#launch-world > :is(.sun-disc,.cloud,.hill,.paper-path,.flower-line)").length,
      plaqueBackground:getComputedStyle(document.querySelector(".launch-copy > div")).backgroundColor,
      launchBounds:(() => { const rect=document.querySelector(".launch-copy > div").getBoundingClientRect(); return { top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right }; })()
    }));
    assert.equal(launch.theme, theme);
    assert.match(launch.far, new RegExp(`${theme}/far-loop-pair\\.png`));
    assert.match(launch.mid, new RegExp(`${theme}/mid-loop-pair\\.png`));
    assert.equal(launch.ground, theme === "creek" ? "block" : "none");
    assert.equal(launch.oldScenery, 0);
    assert.notEqual(launch.plaqueBackground, "rgba(0, 0, 0, 0)");
    assert.ok(launch.launchBounds.top >= 0 && launch.launchBounds.bottom <= 900 && launch.launchBounds.left >= 0 && launch.launchBounds.right <= 1440);
    await page.screenshot({ path:path.join(screenshotDir, `${levelId}-${theme}-launch-map.png`) });
    await page.locator("#launch-back").click();
  }
  pass("三个玩法的启动封面均复用对应关卡地图，旧 CSS 云丘场景已移除");

  await page.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await page.locator("#launch-start").click();
  await page.evaluate(() => window.__mvpTest.advance(3000));
  await page.evaluate(() => window.__mvpTest.previewMapObject("pit"));
  const pit = await page.evaluate(() => {
    const node=document.querySelector("#world-object");
    return {
      image:getComputedStyle(node).backgroundImage,
      visualWidth:node.getBoundingClientRect().width,
      collisionWidth:Number(node.dataset.collisionWidth),
      border:getComputedStyle(node).borderTopWidth
    };
  });
  assert.match(pit.image, /creek-pit\/prop\.png/);
  assert.ok(pit.visualWidth > pit.collisionWidth);
  assert.equal(pit.border, "0px");
  await page.screenshot({ path:path.join(screenshotDir, "L1-new-creek-pit.png") });
  pass("L1 水坑使用独立透明美术，视觉宽度与碰撞宽度解耦");

  await page.evaluate(() => window.__mvpTest.completeLevel());
  const resultSkin = await page.evaluate(() => ({
    theme:document.querySelector("#lv03").dataset.theme,
    background:getComputedStyle(document.querySelector("#lv03")).backgroundImage,
    finishBackground:getComputedStyle(document.querySelector(".finish-card")).backgroundColor,
    finishBorder:getComputedStyle(document.querySelector(".finish-card")).borderBottomWidth,
    scrollHeight:document.documentElement.scrollHeight,
    clientHeight:document.documentElement.clientHeight
  }));
  assert.equal(resultSkin.theme, "creek");
  assert.match(resultSkin.background, /creek\/far-loop-pair\.png/);
  assert.notEqual(resultSkin.finishBackground, "rgba(0, 0, 0, 0)");
  assert.ok(Number.parseFloat(resultSkin.finishBorder) >= 6);
  assert.ok(resultSkin.scrollHeight <= resultSkin.clientHeight + 1);
  pass("结算页沿用当前玩法地图和冒险手册 UI，保持单屏");

  await page.close();

  for (const viewport of [{ width:1280,height:720 },{ width:1024,height:700 },{ width:919,height:843 }]) {
    const viewportPage = await pageAt(viewport);
    await startMap(viewportPage);
    await viewportPage.evaluate(() => window.__mvpTest.selectLevel("L3"));
    const layout = await viewportPage.evaluate(() => {
      const rect = selector => { const box=document.querySelector(selector).getBoundingClientRect(); return { top:box.top,bottom:box.bottom,left:box.left,right:box.right }; };
      return {
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        scrollHeight:document.documentElement.scrollHeight,
        clientHeight:document.documentElement.clientHeight,
        plaque:rect(".launch-copy > div"),
        start:rect("#launch-start"),
        back:rect("#launch-back")
      };
    });
    assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `${viewport.width} launch horizontal scroll`);
    assert.ok(layout.scrollHeight <= layout.clientHeight + 1, `${viewport.height} launch vertical scroll`);
    for (const item of [layout.plaque,layout.start,layout.back]) {
      assert.ok(item.top >= -1 && item.bottom <= viewport.height + 1 && item.left >= -1 && item.right <= viewport.width + 1,
        `${viewport.width}x${viewport.height} launch UI outside viewport`);
    }
    await viewportPage.screenshot({ path:path.join(screenshotDir, `launch-${viewport.width}x${viewport.height}.png`) });
    await viewportPage.close();
  }
  pass("入口封面在三个紧凑目标视口保持单屏、按钮完整可见");

  assert.deepEqual(errors, []);
  console.log("Map UI skin targeted QA complete: 7/7 PASS");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
