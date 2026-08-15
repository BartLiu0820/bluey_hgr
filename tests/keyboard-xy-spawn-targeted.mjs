import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = { ".html":"text/html; charset=utf-8", ".png":"image/png", ".js":"text/javascript", ".mjs":"text/javascript", ".task":"application/octet-stream" };
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
const screenshotDir = "/tmp/bluey-keyboard-xy";
fs.mkdirSync(screenshotDir, { recursive:true });

const intersects = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

async function newPage(viewport) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  return { page, errors };
}

try {
  for (const viewport of [{ width:1440, height:900 }, { width:1219, height:681 }, { width:919, height:843 }]) {
    const { page, errors } = await newPage(viewport);
    await page.locator("#keyboard-choice").click();
    assert.equal(await page.locator(".screen.active").getAttribute("data-screen-id"), "GI-05");
    assert.equal(await page.locator('[data-screen-id="GI-06"]').count(), 0, "redundant keyboard confirmation screen remains");

    const setup = await page.evaluate(() => {
      const panel = document.querySelector("#gi05 .keyboard-panel");
      const stage = document.querySelector("#gi05 .keyboard-stage");
      const box = node => { const rect=node.getBoundingClientRect(); return { left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom }; };
      return {
        panelBackground:getComputedStyle(panel).backgroundImage,
        panel:box(panel),
        stage:box(stage),
        keyCount:document.querySelectorAll("#gi05 .key-lamp").length,
        scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight
      };
    });
    assert.ok(setup.panelBackground.includes("camera-prep-panel.png"), `${viewport.width} keyboard panel does not match camera panel family`);
    assert.equal(setup.keyCount, 5, `${viewport.width} keyboard page does not show four arrows and Space`);
    assert.ok(setup.stage.left >= setup.panel.left && setup.stage.right <= setup.panel.right, `${viewport.width} keyboard test surface escapes panel`);
    assert.ok(setup.scrollWidth <= viewport.width + 1 && setup.scrollHeight <= viewport.height + 1, `${viewport.width} keyboard screen overflows viewport`);
    if (viewport.width === 1440) await page.screenshot({ path:`${screenshotDir}/gi05-keyboard.png`, fullPage:true });

    await page.locator('.key-lamp[data-key="ArrowLeft"]').click();
    assert.equal(await page.locator('.key-lamp[data-key="ArrowLeft"]').evaluate(node => node.classList.contains("lit")), true);
    assert.equal(await page.locator("#start-keyboard-game").isEnabled(), true);
    await page.locator("#start-keyboard-game").click();
    assert.equal((await page.evaluate(() => window.__mvpTest.getState())).screen, "LV-00", "keyboard setup did not go directly to level selection");

    await page.evaluate(() => { window.__mvpTest.startWithMode("keyboard_full"); window.__mvpTest.selectLevel("L2"); });
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3000));
    const before = await page.evaluate(() => window.__mvpTest.getState().level);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowUp");
    const after = await page.evaluate(() => window.__mvpTest.getState().level);
    assert.ok(after.playerXNormalized > before.playerXNormalized, `${viewport.width} L2 right control did not move player horizontally`);
    assert.ok(after.playerYNormalized < before.playerYNormalized, `${viewport.width} L2 up control did not move player vertically`);
    assert.equal((await page.locator("#action-title").textContent()).trim(), "↑ ↓ ← →");

    await page.evaluate(() => window.__mvpTest.advance(5000));
    await page.evaluate(() => window.__mvpTest.advance(1800));
    assert.ok((await page.evaluate(() => window.__mvpTest.getState().level.target)), `${viewport.width} L2 target cue was not available for overlap QA`);
    await page.evaluate(() => window.__mvpTest.previewMilestone(1));
    await page.waitForTimeout(300);
    const overlayGeometry = await page.evaluate(() => {
      const rect = selector => { const value=document.querySelector(selector).getBoundingClientRect(); return { left:value.left,right:value.right,top:value.top,bottom:value.bottom }; };
      return { milestone:rect("#milestone-overlay"), instruction:rect("#target-cue") };
    });
    assert.equal(intersects(overlayGeometry.milestone, overlayGeometry.instruction), false, `${viewport.width} L2 milestone overlaps its top action instruction`);
    if (viewport.width === 1440) await page.screenshot({ path:`${screenshotDir}/l2-milestone-spacing.png`, fullPage:true });

    await page.evaluate(() => { window.__mvpTest.startWithMode("camera_full"); window.__mvpTest.selectLevel("L2"); });
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3000));
    const cameraBefore = await page.evaluate(() => window.__mvpTest.getState().level);
    await page.evaluate(() => window.__mvpTest.emitHandTrackingFrame({ handPresent:true, palmCenterX:.65, palmCenterY:.30, confidence:.98, timestamp:100 }));
    const cameraAfter = await page.evaluate(() => window.__mvpTest.getState().level);
    assert.ok(cameraAfter.playerXNormalized > cameraBefore.playerXNormalized, `${viewport.width} camera palm X did not move the L2 player horizontally`);
    assert.ok(cameraAfter.playerYNormalized < cameraBefore.playerYNormalized, `${viewport.width} camera palm Y did not move the L2 player vertically`);
    assert.equal(await page.locator("#action-symbol-image").getAttribute("src"), "assets/ui/instruction-icons/hand-move-free.png");

    await page.evaluate(() => { window.__mvpTest.startWithMode("keyboard_full"); window.__mvpTest.selectLevel("L1"); });
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3000));
    await page.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
    await page.evaluate(() => window.__mvpTest.advance(4000));
    await page.evaluate(() => window.__mvpTest.advance(1800));
    const spawn = await page.evaluate(() => {
      const state=window.__mvpTest.getState().level;
      const world=document.querySelector("#game-world").getBoundingClientRect();
      const object=document.querySelector("#world-object").getBoundingClientRect();
      return { target:state.target, worldWidth:world.width, objectLeft:object.left, worldRight:world.right };
    });
    assert.ok(spawn.target, `${viewport.width} L1 did not spawn an obstacle`);
    assert.equal(spawn.target.spawnedFromRight, true, `${viewport.width} L1 obstacle is not tagged as offscreen-right spawn`);
    assert.ok(spawn.target.worldX > spawn.worldWidth, `${viewport.width} L1 obstacle center starts inside the world`);
    assert.ok(spawn.objectLeft >= spawn.worldRight - 1, `${viewport.width} L1 obstacle pops into the visible scene`);

    assert.deepEqual(errors, [], `${viewport.width} page errors: ${errors.join(" | ")}`);
    await page.close();
    console.log(`PASS ${viewport.width}x${viewport.height} keyboard single-page, L2 XY, popup spacing and L1 spawn`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
