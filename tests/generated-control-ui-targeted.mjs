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
  response.writeHead(200, { "Content-Type":mime[path.extname(requested)] || "application/octet-stream" });
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
  { width:1219, height:681 },
  { width:1024, height:700 },
  { width:2048, height:1056 }
];
const screenshotDir = "/tmp/bluey-generated-control-ui";
fs.mkdirSync(screenshotDir, { recursive:true });

try {
  for (const viewport of viewports) {
    const errors = [];
    const missing = [];
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) missing.push(`${response.status()} ${response.url()}`); });
    await page.goto(url, { waitUntil:"load" });
    await page.waitForFunction(() => Boolean(window.__mvpTest));
    await page.evaluate(() => window.__mvpTest.showScreen("GI-02"));

    const setup = await page.evaluate(() => {
      const rect = node => { const value=node.getBoundingClientRect(); return { left:value.left, right:value.right, top:value.top, bottom:value.bottom, width:value.width, height:value.height }; };
      const panelNode = document.querySelector("#gi02 .split-panel");
      const panel = rect(panelNode);
      const buttons = [...document.querySelectorAll("#gi02 .icon-copy-button")].map(button => {
        const image = button.querySelector("img");
        return { button:rect(button), image:rect(image), loaded:image.complete && image.naturalWidth >= 256, src:image.getAttribute("src") };
      });
      const parentImages = [...document.querySelectorAll(".parent-trigger.generated-parent img")];
      return {
        panel,
        panelBackground:getComputedStyle(panelNode).backgroundImage,
        buttons,
        parentImages:parentImages.map(image => ({ loaded:image.complete && image.naturalWidth >= 256, src:image.getAttribute("src") })),
        scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight,
        oldLargeSvg:[...document.querySelectorAll("#gi02 svg")].filter(node => { const r=node.getBoundingClientRect(); return r.width > 32 || r.height > 32; }).length
      };
    });
    assert.ok(setup.panelBackground.includes("camera-prep-panel.png"), `${viewport.width} generated GI-02 panel missing`);
    assert.equal(setup.buttons.length, 4);
    assert.ok(setup.buttons.every(item => item.loaded), `${viewport.width} setup icon missing`);
    assert.ok(setup.buttons.every(item => item.image.left >= item.button.left - 1 && item.image.right <= item.button.right + 1), `${viewport.width} setup icon clipped horizontally`);
    assert.ok(setup.buttons.every(item => item.image.top >= item.button.top - 1 && item.image.bottom <= item.button.bottom + 1), `${viewport.width} setup icon clipped vertically`);
    assert.ok(setup.buttons.every(item => item.button.left >= setup.panel.left + 38 && item.button.right <= setup.panel.right - 38), `${viewport.width} setup action too close to panel decoration`);
    assert.ok(setup.parentImages.length >= 6 && setup.parentImages.every(item => item.loaded && item.src.includes("parent-control.png")), `${viewport.width} generated parent icon incomplete`);
    assert.equal(setup.oldLargeSvg, 0, `${viewport.width} old large GI-02 SVG remains`);
    assert.ok(setup.scrollWidth <= viewport.width && setup.scrollHeight <= viewport.height, `${viewport.width} GI-02 viewport overflow`);

    if (viewport.width === 1440 || viewport.width === 1024) await page.screenshot({ path:`${screenshotDir}/gi02-${viewport.width}x${viewport.height}.png` });

    const expected = {
      L1:"control-icons/open-palm.png",
      L2:"control-icons/vertical-guide.png",
      L3:"control-icons/horizontal-guide.png"
    };
    for (const [levelId, suffix] of Object.entries(expected)) {
      await page.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
      await page.evaluate(id => window.__mvpTest.selectLevel(id), levelId);
      const source = await page.locator("#launch-control-image").getAttribute("src");
      assert.ok(source.endsWith(suffix), `${viewport.width} ${levelId} launch icon mismatch: ${source}`);
    }

    await page.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
    await page.evaluate(() => window.__mvpTest.selectLevel("L2"));
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3400));
    const runtime = await page.evaluate(() => ({
      screen:window.__mvpTest.getState().screen,
      actionSource:document.querySelector("#action-symbol").getAttribute("src"),
      actionLoaded:document.querySelector("#action-symbol").complete && document.querySelector("#action-symbol").naturalWidth >= 256,
      pauseLoaded:document.querySelector("#pause-icon").complete && document.querySelector("#pause-icon").naturalWidth >= 256,
      activeLargeSvg:[...document.querySelectorAll("#lv02 svg")].filter(node => { const r=node.getBoundingClientRect(); return r.width > 32 || r.height > 32; }).length
    }));
    assert.equal(runtime.screen, "LV-02");
    assert.ok(runtime.actionSource.endsWith("control-icons/vertical-guide.png"), `${viewport.width} runtime guide icon mismatch`);
    assert.ok(runtime.actionLoaded && runtime.pauseLoaded, `${viewport.width} generated runtime icon missing`);
    assert.equal(runtime.activeLargeSvg, 0, `${viewport.width} old large LV-02 SVG remains`);

    await page.evaluate(() => document.querySelector("#pause-layer").classList.add("show"));
    if (viewport.width === 1440) await page.screenshot({ path:`${screenshotDir}/lv02-pause-${viewport.width}x${viewport.height}.png` });
    assert.deepEqual(errors, [], `${viewport.width} page errors: ${errors.join(" | ")}`);
    assert.deepEqual(missing, [], `${viewport.width} missing resources: ${missing.join(" | ")}`);
    await page.close();
    console.log(`PASS ${viewport.width}x${viewport.height} generated panel, setup controls, parent and runtime icons`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
