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
      const preview = rect(document.querySelector("#gi02 .preview-shell"));
      const buttons = [...document.querySelectorAll("#gi02 .icon-copy-button")].map(button => {
        const image = button.querySelector("img");
        return { button:rect(button), image:rect(image), loaded:image.complete && image.naturalWidth >= 256, src:image.getAttribute("src") };
      });
      const parentImages = [...document.querySelectorAll(".parent-trigger.generated-parent img")];
      return {
        panel,
        preview,
        panelBackground:getComputedStyle(panelNode).backgroundImage,
        buttons,
        parentImages:parentImages.map(image => ({ loaded:image.complete && image.naturalWidth >= 256, src:image.getAttribute("src") })),
        scrollWidth:document.documentElement.scrollWidth,
        scrollHeight:document.documentElement.scrollHeight,
        guideImage:[...document.querySelectorAll("#gi02 .preview-hand-icon")].map(node => ({ rect:rect(node), loaded:node.complete && node.naturalWidth > 0, src:node.getAttribute("src"), borderRadius:getComputedStyle(node).borderRadius, background:getComputedStyle(node).backgroundImage }))
      };
    });
    assert.ok(setup.panelBackground.includes("camera-prep-panel.png"), `${viewport.width} generated GI-02 panel missing`);
    assert.equal(setup.buttons.length, 4);
    assert.ok(setup.buttons.every(item => item.loaded), `${viewport.width} setup icon missing`);
    assert.ok(setup.buttons.every(item => item.image.left >= item.button.left - 1 && item.image.right <= item.button.right + 1), `${viewport.width} setup icon clipped horizontally`);
    assert.ok(setup.buttons.every(item => item.image.top >= item.button.top - 1 && item.image.bottom <= item.button.bottom + 1), `${viewport.width} setup icon clipped vertically`);
    assert.ok(setup.buttons.every(item => item.button.left >= setup.panel.left + 38 && item.button.right <= setup.panel.right - 38), `${viewport.width} setup action too close to panel decoration`);
    const decorativeSafeInset = setup.panel.width * .092;
    assert.ok(setup.preview.left >= setup.panel.left + decorativeSafeInset, `${viewport.width} video overlaps the panel's left wood/leaf decoration: inset=${(setup.preview.left - setup.panel.left).toFixed(1)}, required=${decorativeSafeInset.toFixed(1)}`);
    assert.ok(setup.preview.right <= setup.panel.right - 38, `${viewport.width} video exceeds panel on the right`);
    assert.ok(setup.preview.top >= setup.panel.top + 38 && setup.preview.bottom <= setup.panel.bottom - 38, `${viewport.width} video exceeds panel vertically`);
    assert.ok(Math.abs(setup.preview.width / setup.preview.height - 1.6) < .03, `${viewport.width} video ratio is not constrained`);
    assert.ok(Math.max(...setup.buttons.map(item => item.image.left)) - Math.min(...setup.buttons.map(item => item.image.left)) <= 1.5, `${viewport.width} setup icons are not aligned`);
    assert.ok(setup.buttons.at(-1).src.endsWith("control-icons/back-control.png"), `${viewport.width} back control still uses parent icon`);
    assert.ok(setup.parentImages.length >= 4 && setup.parentImages.every(item => item.loaded && item.src.includes("parent-control.png")), `${viewport.width} generated parent icon incomplete`);
    assert.equal(setup.guideImage.length, 1, `${viewport.width} GI-02 generated hand guide missing`);
    assert.equal(setup.guideImage[0].src, "assets/ui/instruction-icons/find-hand.png", `${viewport.width} GI-02 still uses the old hand symbol`);
    assert.equal(setup.guideImage[0].loaded, true, `${viewport.width} GI-02 generated hand guide did not load`);
    assert.equal(setup.guideImage[0].borderRadius, "0px", `${viewport.width} guide symbol looks like a round button`);
    assert.equal(setup.guideImage[0].background, "none", `${viewport.width} guide symbol has a button background`);
    assert.ok(setup.scrollWidth <= viewport.width && setup.scrollHeight <= viewport.height, `${viewport.width} GI-02 viewport overflow`);

    if (viewport.width === 1440 || viewport.width === 1024) await page.screenshot({ path:`${screenshotDir}/gi02-${viewport.width}x${viewport.height}.png` });

    await page.evaluate(() => window.__gesturePrototype.forceCameraReady());
    await page.locator("#start-practice").click();
    assert.equal(await page.evaluate(() => window.__mvpTest.getState().screen), "LV-00", `${viewport.width} camera ready did not go directly to mode hub`);
    assert.equal(await page.locator('[data-screen-id="GI-03"],[data-screen-id="GI-04"]').count(), 0, `${viewport.width} removed ready/result screen remains in DOM`);

    const expected = {
      L1:"assets/ui/instruction-icons/pose-transition.png",
      L2:"assets/ui/instruction-icons/hand-move-free.png",
      L3:"assets/ui/instruction-icons/hand-move-horizontal.png"
    };
    for (const [levelId, suffix] of Object.entries(expected)) {
      await page.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
      await page.evaluate(id => window.__mvpTest.selectLevel(id), levelId);
      await page.waitForFunction(() => { const image=document.querySelector("#launch-control-image"); return image.complete && image.naturalWidth > 0; });
      const launchIcon = await page.evaluate(() => { const image=document.querySelector("#launch-control-image"); return { source:image.getAttribute("src"), loaded:image.complete && image.naturalWidth > 0, type:image.dataset.instructionIcon }; });
      assert.equal(launchIcon.source, suffix, `${viewport.width} ${levelId} launch icon mismatch: ${launchIcon.source}`);
      assert.equal(launchIcon.loaded, true, `${viewport.width} ${levelId} launch icon not loaded`);
      const launchSpacing = await page.evaluate(() => { const icon=document.querySelector("#launch-control-image").getBoundingClientRect(); const shell=document.querySelector(".launch-control-symbol").getBoundingClientRect(); const status=document.querySelector("#launch-status").getBoundingClientRect(); const panel=getComputedStyle(document.querySelector("#launch-panel")); const iconStyle=getComputedStyle(document.querySelector("#launch-control-image")); const statusStyle=getComputedStyle(document.querySelector("#launch-status")); return { icon:{top:icon.top,bottom:icon.bottom,height:icon.height}, shell:{top:shell.top,bottom:shell.bottom,height:shell.height}, status:{top:status.top,bottom:status.bottom,height:status.height}, gap:status.top-icon.bottom, panelDisplay:panel.display, panelRows:panel.gridTemplateRows, iconPosition:iconStyle.position, statusPosition:statusStyle.position, statusGridRow:statusStyle.gridRow }; });
      assert.ok(launchSpacing.gap >= 4, `${viewport.width} ${levelId} launch icon overlaps status: ${JSON.stringify(launchSpacing)}`);
      if (viewport.width === 1440 && levelId === "L1") await page.screenshot({ path:`${screenshotDir}/lv01-l1-${viewport.width}x${viewport.height}.png` });
    }

    await page.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
    await page.evaluate(() => window.__mvpTest.selectLevel("L2"));
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3400));
    const runtime = await page.evaluate(() => ({
      screen:window.__mvpTest.getState().screen,
      actionSource:document.querySelector("#action-symbol-image").getAttribute("src"),
      actionLoaded:document.querySelector("#action-symbol-image").complete && document.querySelector("#action-symbol-image").naturalWidth > 0,
      actionFrame:{ borderRadius:getComputedStyle(document.querySelector("#action-symbol-image")).borderRadius, background:getComputedStyle(document.querySelector("#action-symbol-image")).backgroundImage }
    }));
    assert.equal(runtime.screen, "LV-02");
    assert.equal(runtime.actionSource, "assets/ui/instruction-icons/hand-move-free.png", `${viewport.width} runtime guide icon mismatch`);
    assert.equal(runtime.actionLoaded, true, `${viewport.width} runtime guide icon not loaded`);
    assert.equal(runtime.actionFrame.borderRadius, "0px", `${viewport.width} runtime guide looks like a round button`);
    assert.equal(runtime.actionFrame.background, "none", `${viewport.width} runtime guide has a button background`);
    const progressGeometry = await page.evaluate(() => {
      const panel=document.querySelector("#milestone-hud").getBoundingClientRect();
      const track=document.querySelector("#milestone-hud .progress-track").getBoundingClientRect();
      return { panel:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom,height:panel.height}, track:{left:track.left,right:track.right,top:track.top,bottom:track.bottom,height:track.height}, centerRatio:((track.top+track.bottom)/2-panel.top)/panel.height };
    });
    assert.ok(progressGeometry.track.height >= 16 && progressGeometry.track.height <= 22.5, `${viewport.width} progress height ${progressGeometry.track.height} is outside 16–22px`);
    assert.ok(progressGeometry.track.left > progressGeometry.panel.left && progressGeometry.track.right < progressGeometry.panel.right, `${viewport.width} progress escapes milestone art horizontally`);
    assert.ok(progressGeometry.track.top > progressGeometry.panel.top && progressGeometry.track.bottom < progressGeometry.panel.bottom, `${viewport.width} progress escapes milestone art vertically`);
    assert.ok(progressGeometry.centerRatio >= .76 && progressGeometry.centerRatio <= .86, `${viewport.width} progress is not aligned to illustrated rail: ${progressGeometry.centerRatio}`);
    if (viewport.width === 1440) await page.screenshot({ path:`${screenshotDir}/lv02-runtime-${viewport.width}x${viewport.height}.png` });

    const polish = await page.evaluate(() => {
      window.__mvpTest.setProgressMeters(1);
      window.__mvpTest.advance(1800);
      const first = window.__mvpTest.getState().level;
      const world = document.querySelector("#game-world").getBoundingClientRect();
      const object = document.querySelector("#world-object").getBoundingClientRect();
      const firstPosition = first.target?.worldX;
      window.__mvpTest.advance(400);
      const second = window.__mvpTest.getState().level;
      window.__mvpTest.completeLevel("qa");
      return {
        spawnedFromRight:first.target?.spawnedFromRight,
        firstPosition,
        secondPosition:second.target?.worldX,
        worldWidth:world.width,
        objectInitiallyOutside:object.left >= world.right - 1,
        drawerLabelExists:Boolean(document.querySelector("#drawer-title")?.previousElementSibling),
        scoreRows:[...document.querySelectorAll("#local-score-list li strong")].map(node => ({ text:node.textContent, artDigits:node.querySelectorAll(".art-digit").length, transform:getComputedStyle(node).transform }))
      };
    });
    assert.equal(polish.spawnedFromRight, true, `${viewport.width} L2 target is not marked as right-edge spawn`);
    assert.ok(polish.firstPosition > polish.worldWidth, `${viewport.width} L2 target center did not start beyond right edge`);
    assert.ok(polish.secondPosition < polish.firstPosition, `${viewport.width} L2 target did not travel continuously from right to left`);
    assert.equal(polish.objectInitiallyOutside, true, `${viewport.width} L2 target appears inside the scene on spawn`);
    assert.equal(polish.drawerLabelExists, false, `${viewport.width} parent drawer still shows an entry label`);
    assert.ok(polish.scoreRows.length >= 1 && polish.scoreRows.every(row => row.text && row.artDigits === 0 && row.transform === "none"), `${viewport.width} result ranking digits remain distorted`);

    await page.evaluate(() => { window.__mvpTest.startWithMode("camera_full"); window.__mvpTest.selectLevel("L1"); });
    await page.locator("#launch-start").click();
    await page.evaluate(() => window.__mvpTest.advance(3400));
    assert.equal(await page.locator("#action-symbol-image").getAttribute("src"), "assets/ui/instruction-icons/fist-hold.png", `${viewport.width} L1 waiting icon mismatch`);
    await page.evaluate(() => { window.__mvpTest.injectStableGesture("Closed_Fist"); window.__mvpTest.advance(50); });
    assert.equal(await page.locator("#action-symbol-image").getAttribute("src"), "assets/ui/instruction-icons/open-palm-jump.png", `${viewport.width} L1 armed icon mismatch`);
    await page.evaluate(() => window.__mvpTest.setHandPresent(false));
    const pause = await page.evaluate(() => { const image=document.querySelector("#pause-instruction-image"); return { visible:document.querySelector("#pause-layer").classList.contains("show"), source:image.getAttribute("src"), loaded:image.complete && image.naturalWidth > 0 }; });
    assert.equal(pause.visible, true, `${viewport.width} no-hand pause did not open`);
    assert.equal(pause.source, "assets/ui/instruction-icons/find-hand.png", `${viewport.width} no-hand icon mismatch`);
    assert.equal(pause.loaded, true, `${viewport.width} no-hand icon not loaded`);
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
