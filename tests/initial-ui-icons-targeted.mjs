import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = { ".html":"text/html; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".mp3":"audio/mpeg", ".task":"application/octet-stream", ".js":"text/javascript", ".mjs":"text/javascript" };
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
const browser = await chromium.launch({
  headless:true,
  executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

const viewports = [
  { width:1440, height:900 },
  { width:1280, height:720 },
  { width:1219, height:681 },
  { width:1024, height:700 },
  { width:919, height:843 },
  { width:2048, height:1056 }
];
const screenshotDir = "/tmp/bluey-initial-icon-ui";
fs.mkdirSync(screenshotDir, { recursive:true });

try {
  for (const viewport of viewports) {
    const errors = [];
    const missing = [];
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
    });
    page.on("response", response => {
      if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) missing.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil:"load" });
    await page.waitForFunction(() => Boolean(window.__mvpTest));

    const report = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const panel = rect("#gi01 .setup-panel");
      const content = rect("#gi01 .setup-content");
      const privacy = rect("#gi01 .privacy-box");
      const cards = [...document.querySelectorAll("#gi01 .mode-card")];
      const buttons = [...document.querySelectorAll("#gi01 .mode-icon-button")].map(node => node.getBoundingClientRect());
      const copies = [...document.querySelectorAll("#gi01 .mode-copy")].map(node => node.getBoundingClientRect());
      const marks = [...document.querySelectorAll("#gi01 .start-title-mark")];
      return {
        active:document.querySelector(".screen.active")?.id,
        scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight,
        panel:{ left:panel.left, right:panel.right, top:panel.top, bottom:panel.bottom, width:panel.width, height:panel.height, cx:panel.left+panel.width/2, cy:panel.top+panel.height/2 },
        content:{ left:content.left, right:content.right, top:content.top, bottom:content.bottom, cx:content.left+content.width/2, cy:content.top+content.height/2 },
        privacy:{ left:privacy.left, right:privacy.right, top:privacy.top, bottom:privacy.bottom },
        cards:cards.map(node => { const style=getComputedStyle(node); return { bg:style.backgroundColor, border:style.borderTopWidth }; }),
        buttons:buttons.map(({left,right,top,bottom,width,height}) => ({left,right,top,bottom,width,height})),
        copies:copies.map(({left,right,top,bottom}) => ({left,right,top,bottom})),
        marks:marks.map(node => ({ complete:node.complete, naturalWidth:node.naturalWidth })),
        cameraDisabled:document.querySelector("#camera-choice").disabled
      };
    });

    assert.equal(report.active, "gi01");
    assert.ok(report.scrollWidth <= viewport.width, `${viewport.width} horizontal overflow`);
    assert.ok(report.scrollHeight <= viewport.height, `${viewport.height} vertical overflow`);
    assert.ok(report.panel.height <= Math.min(682, viewport.height - 148), `${viewport.width} setup panel remains too tall`);
    assert.ok(Math.abs(report.panel.cx - report.content.cx) <= 1, `${viewport.width} setup content not horizontally centered`);
    assert.ok(Math.abs(report.panel.cy - report.content.cy) <= 46, `${viewport.width} setup content not vertically centered`);
    assert.ok(report.privacy.left >= report.panel.left + 60 && report.privacy.right <= report.panel.right - 60, `${viewport.width} privacy too close to side decoration`);
    assert.ok(report.privacy.bottom <= report.panel.bottom - 62, `${viewport.width} privacy overlaps bottom decoration`);
    assert.ok(report.cards.every(card => card.bg === "rgba(0, 0, 0, 0)" && card.border === "0px"), `${viewport.width} old mode-card base remains`);
    assert.ok(report.buttons.every(button => button.width >= 108 && button.height >= 108), `${viewport.width} mode icon buttons too small`);
    assert.ok(report.copies.every((copy, index) => copy.left >= report.buttons[index].right - 1), `${viewport.width} mode copy is not beside icon button`);
    assert.ok(report.marks.every(mark => mark.complete && mark.naturalWidth >= 500), `${viewport.width} generated team mark missing`);
    assert.equal(report.cameraDisabled, true);

    if (viewport.width === 1440 || viewport.width === 1024) {
      await page.screenshot({ path:`${screenshotDir}/gi01-${viewport.width}x${viewport.height}.png` });
    }

    await page.locator("#privacy-check").check();
    assert.equal(await page.locator("#camera-choice").isEnabled(), true);
    await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
    assert.equal((await page.evaluate(() => window.__mvpTest.getState())).screen, "LV-00");
    const levelIcons = await page.locator(".level-card-number img").evaluateAll(nodes => nodes.map(node => ({ complete:node.complete, width:node.naturalWidth, rect:node.getBoundingClientRect().width })));
    assert.equal(levelIcons.length, 3);
    assert.ok(levelIcons.every(icon => icon.complete && icon.width >= 500 && icon.rect >= 70), `${viewport.width} generated level icon missing or too small`);
    if (viewport.width === 1440 || viewport.width === 1024) {
      await page.screenshot({ path:`${screenshotDir}/lv00-${viewport.width}x${viewport.height}.png` });
    }
    assert.deepEqual(errors, [], `${viewport.width} page errors: ${errors.join(" | ")}`);
    assert.deepEqual(missing, [], `${viewport.width} missing resources: ${missing.join(" | ")}`);
    await page.close();
    console.log(`PASS ${viewport.width}x${viewport.height} centered icon-first GI-01 and generated level icons`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
