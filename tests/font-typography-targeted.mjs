import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = {
  ".html":"text/html; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".mp3":"audio/mpeg",
  ".woff2":"font/woff2",
  ".task":"application/octet-stream",
  ".js":"text/javascript",
  ".mjs":"text/javascript"
};

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
  { width:1219, height:681 },
  { width:1024, height:700 },
  { width:919, height:843 }
];

try {
  for (const viewport of viewports) {
    const errors = [];
    const missing = [];
    const fontResponses = [];
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
    });
    page.on("response", response => {
      if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) missing.push(`${response.status()} ${response.url()}`);
      if (response.url().endsWith(".woff2")) fontResponses.push({
        url:response.url(),
        status:response.status(),
        type:response.headers()["content-type"]
      });
    });

    await page.goto(url, { waitUntil:"load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Boolean(window.__mvpTest));

    const firstScreen = await page.evaluate(() => {
      const fits = selector => {
        const node = document.querySelector(selector);
        const rect = node.getBoundingClientRect();
        return {
          inside:rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
          textFits:node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1
        };
      };
      return {
        active:document.querySelector(".screen.active")?.id,
        bodyFont:getComputedStyle(document.body).fontFamily,
        displayFont:getComputedStyle(document.querySelector("#gi01-game-title")).fontFamily,
        roundness:getComputedStyle(document.body).fontVariationSettings,
        uiLoaded:document.fonts.check('700 20px "Little Tail Rounded"', "举起一只手"),
        displayLoaded:document.fonts.check('400 44px "Little Tail Xiaolai"', "小尾巴探险队"),
        title:fits("#gi01-game-title"),
        prompt:fits("#gi01-title"),
        scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight
      };
    });

    assert.equal(firstScreen.active, "gi01");
    assert.match(firstScreen.bodyFont, /Little Tail Rounded/);
    assert.match(firstScreen.displayFont, /Little Tail Xiaolai/);
    assert.match(firstScreen.roundness, /ROND/);
    assert.equal(firstScreen.uiLoaded, true, `${viewport.width} rounded UI font did not load`);
    assert.equal(firstScreen.displayLoaded, true, `${viewport.width} Xiaolai display font did not load`);
    assert.deepEqual(firstScreen.title, { inside:true, textFits:true }, `${viewport.width} title overflow`);
    assert.deepEqual(firstScreen.prompt, { inside:true, textFits:true }, `${viewport.width} prompt overflow`);
    assert.ok(firstScreen.scrollWidth <= viewport.width, `${viewport.width} horizontal overflow`);
    assert.ok(firstScreen.scrollHeight <= viewport.height, `${viewport.height} vertical overflow`);

    await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
    const hub = await page.evaluate(() => ({
      active:document.querySelector(".screen.active")?.id,
      headings:[...document.querySelectorAll("#lv00 h1, #lv00 h2")].map(node => ({
        family:getComputedStyle(node).fontFamily,
        fits:node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1,
        rect:(() => { const r=node.getBoundingClientRect(); return { left:r.left, top:r.top, right:r.right, bottom:r.bottom }; })()
      })),
      scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight
    }));
    assert.equal(hub.active, "lv00");
    assert.ok(hub.headings.length >= 4);
    assert.ok(hub.headings.every(item => item.family.includes("Little Tail Xiaolai") && item.fits), `${viewport.width} hub heading font/overflow`);
    assert.ok(hub.headings.every(item => item.rect.left >= 0 && item.rect.top >= 0 && item.rect.right <= viewport.width && item.rect.bottom <= viewport.height), `${viewport.width} hub heading outside viewport`);
    assert.ok(hub.scrollWidth <= viewport.width, `${viewport.width} hub horizontal overflow`);
    assert.ok(hub.scrollHeight <= viewport.height, `${viewport.height} hub vertical overflow`);

    assert.deepEqual(errors, [], `${viewport.width} page errors: ${errors.join(" | ")}`);
    assert.deepEqual(missing, [], `${viewport.width} missing resources: ${missing.join(" | ")}`);
    assert.equal(fontResponses.length, 2, `${viewport.width} expected two local font responses`);
    assert.ok(fontResponses.every(item => item.status === 200 && item.type === "font/woff2"), `${viewport.width} invalid font response`);
    assert.ok(fontResponses.every(item => new URL(item.url).host.startsWith("127.0.0.1:")), `${viewport.width} font loaded from external host`);

    await page.close();
    console.log(`PASS ${viewport.width}x${viewport.height} local fonts, GI-01 and LV-00 typography`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
