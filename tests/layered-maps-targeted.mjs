import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/maps/game-maps.json"), "utf8"));
const buildReport = JSON.parse(fs.readFileSync(path.join(root, "data/maps/map-asset-build-report.json"), "utf8"));
const screenshotDir = path.join(root, "qa/screenshots/maps");
fs.mkdirSync(screenshotDir, { recursive: true });

function pngDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  assert.equal(data.toString("ascii", 1, 4), "PNG", `${filePath} is not PNG`);
  return { width:data.readUInt32BE(16), height:data.readUInt32BE(20), colorType:data[25], bytes:data.length };
}

function pass(copy) { console.log(`PASS ${copy}`); }

assert.equal(manifest.mapMode, "side_scroll_mode");
assert.equal(manifest.visualModel, "parallax_layers");
assert.equal(manifest.readabilityContract.collisionSource, "runtime geometry; never alpha bounds");
for (const report of buildReport.levels) {
  assert.equal(report.outerSeamDifferenceBBox, null, `${report.level} loop pair outer seam differs`);
  const level = Object.values(manifest.levels).find(item => item.theme === report.level);
  assert.ok(level, `missing manifest theme ${report.level}`);
  for (const layer of level.layers) {
    const assetPath = path.join(root, layer.image);
    assert.ok(fs.existsSync(assetPath), `missing ${layer.image}`);
    const png = pngDimensions(assetPath);
    assert.ok(png.width >= 1536 && png.height >= 150 && png.bytes > 10_000, `invalid ${layer.image}`);
  }
}
for (const objectPath of [
  "assets/map-objects/soft-crate/prop.png",
  "assets/map-objects/creek-pit/prop.png",
  "assets/map-objects/firefly-leaf-barrier/prop.png",
  "assets/map-objects/treetop-branch-platform/prop.png",
  "assets/map-objects/safety-cloud/prop.png"
]) {
  const png = pngDimensions(path.join(root, objectPath));
  assert.equal(png.colorType, 6, `${objectPath} is not RGBA`);
  assert.ok(png.bytes > 10_000, `${objectPath} is unexpectedly small`);
}
pass("地图清单、循环接缝与透明结构物件静态契约");

const mime = { ".html":"text/html; charset=utf-8", ".mjs":"text/javascript", ".js":"text/javascript", ".png":"image/png", ".json":"application/json", ".task":"application/octet-stream" };
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
const browser = await chromium.launch({ headless:true });
const errors = [];

async function pageAt() {
  const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil:"load" });
  await page.waitForFunction(() => Boolean(window.__mvpTest));
  return page;
}

async function launch(page, levelId) {
  await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
  await page.evaluate(id => window.__mvpTest.selectLevel(id), levelId);
  await page.locator("#launch-start").click();
  await page.evaluate(() => window.__mvpTest.advance(3000));
}

async function assetLoadStatus(page) {
  return page.evaluate(async () => Promise.all(window.__mvpTest.mapAssets().map(src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve({ src, ok:true, width:image.naturalWidth, height:image.naturalHeight });
    image.onerror = () => resolve({ src, ok:false, width:0, height:0 });
    image.src = src;
  }))));
}

try {
  const l1 = await pageAt();
  const loads = await assetLoadStatus(l1);
  assert.ok(loads.length >= 12);
  assert.deepEqual(loads.filter(item => !item.ok), []);
  assert.ok(loads.every(item => item.width > 0 && item.height > 0));
  pass(`${loads.length} 个地图、里程碑与物件运行时资源全部可加载`);

  await launch(l1, "L1");
  let style = await l1.evaluate(() => {
    const far = document.querySelector("#map-far-layer");
    const mid = document.querySelector("#map-mid-layer");
    const ground = document.querySelector("#map-ground-skin");
    const legacy = document.querySelector("#moving-path");
    return {
      theme:document.querySelector("#game-world").dataset.theme,
      farImage:getComputedStyle(far).backgroundImage,
      midImage:getComputedStyle(mid).backgroundImage,
      farRepeat:getComputedStyle(far).backgroundRepeat,
      groundDisplay:getComputedStyle(ground).display,
      groundImage:getComputedStyle(ground).backgroundImage,
      farOpacity:Number(getComputedStyle(far).opacity),
      midOpacity:Number(getComputedStyle(mid).opacity),
      legacyDisplay:getComputedStyle(legacy).display
    };
  });
  assert.equal(style.theme, "creek");
  assert.match(style.farImage, /creek\/far-loop-pair\.png/);
  assert.match(style.midImage, /creek\/mid-loop-pair\.png/);
  assert.equal(style.farRepeat, "repeat-x");
  assert.equal(style.groundDisplay, "block");
  assert.match(style.groundImage, /creek-ground-strip\/loop-pair\.png/);
  assert.ok(style.farOpacity < 1 && style.midOpacity < style.farOpacity);
  assert.equal(style.legacyDisplay, "none");

  const offsets = [];
  for (const distancePx of [0, 4200, -4200]) {
    offsets.push(await l1.evaluate(distance => {
      window.__mvpTest.setMapOffset({ distancePx:distance });
      return {
        far:document.querySelector("#map-far-layer").style.backgroundPosition,
        mid:document.querySelector("#map-mid-layer").style.backgroundPosition,
        ground:document.querySelector("#map-ground-skin").style.backgroundPosition
      };
    }, distancePx));
  }
  assert.notEqual(offsets[0].far, offsets[1].far);
  assert.notEqual(offsets[1].far, offsets[2].far);
  assert.match(offsets[1].far, /-336px/);
  assert.match(offsets[2].far, /336px/);
  const crateImage = await l1.evaluate(() => {
    const node=document.querySelector("#world-object");
    node.className="world-object show box";
    return getComputedStyle(node).backgroundImage;
  });
  assert.match(crateImage, /soft-crate\/prop\.png/);
  const pitStyle = await l1.evaluate(() => {
    const node=document.querySelector("#world-object");
    node.className="world-object show pit";
    node.style.width="170px";
    return { image:getComputedStyle(node).backgroundImage, border:getComputedStyle(node).borderTopWidth, width:node.getBoundingClientRect().width };
  });
  assert.match(pitStyle.image, /creek-pit\/prop\.png/);
  assert.equal(pitStyle.border, "0px");
  assert.ok(pitStyle.width >= 154);
  await l1.screenshot({ path:path.join(screenshotDir, "L1-creek-layered-map.png") });
  await l1.close();
  pass("L1 远中地三层支持正负偏移循环，木箱与水坑均为独立皮肤");

  const l2 = await pageAt();
  await launch(l2, "L2");
  await l2.evaluate(() => {
    const api = window.__mvpTest;
    api.emitHandTrackingFrame({ handPresent:true, palmCenterY:.28, palmCenterX:.5, confidence:.95, timestamp:performance.now() });
    api.emitHandTrackingFrame({ handPresent:true, palmCenterY:.68, palmCenterX:.5, confidence:.95, timestamp:performance.now() + 80 });
    api.advance(5000);
    api.advance(1800);
  });
  style = await l2.evaluate(() => {
    const object=document.querySelector("#world-object");
    return {
      theme:document.querySelector("#game-world").dataset.theme,
      far:getComputedStyle(document.querySelector("#map-far-layer")).backgroundImage,
      mid:getComputedStyle(document.querySelector("#map-mid-layer")).backgroundImage,
      ground:getComputedStyle(document.querySelector("#map-ground-skin")).display,
      before:getComputedStyle(object,"::before").backgroundImage,
      after:getComputedStyle(object,"::after").backgroundImage,
      gapTop:object.style.getPropertyValue("--gap-top"),
      gapBottom:object.style.getPropertyValue("--gap-bottom")
    };
  });
  assert.equal(style.theme, "firefly");
  assert.match(style.far, /firefly\/far-loop-pair\.png/);
  assert.match(style.mid, /firefly\/mid-loop-pair\.png/);
  assert.equal(style.ground, "none");
  assert.match(style.before, /firefly-leaf-barrier\/prop\.png/);
  assert.equal(style.before, style.after);
  assert.ok(style.gapTop && style.gapBottom);
  await l2.screenshot({ path:path.join(screenshotDir, "L2-firefly-layered-map.png") });
  await l2.close();
  pass("L2 低干扰湿地背景与上下独立树篱共用现有 safeY 几何");

  const l3 = await pageAt();
  await launch(l3, "L3");
  style = await l3.evaluate(() => ({
    theme:document.querySelector("#game-world").dataset.theme,
    far:getComputedStyle(document.querySelector("#map-far-layer")).backgroundImage,
    mid:getComputedStyle(document.querySelector("#map-mid-layer")).backgroundImage,
    repeat:getComputedStyle(document.querySelector("#map-far-layer")).backgroundRepeat,
    platformCount:document.querySelectorAll("#bounce-platform-layer [data-bounce-platform]").length,
    platformImage:getComputedStyle(document.querySelector("#bounce-platform-layer [data-bounce-platform]")).backgroundImage
  }));
  assert.equal(style.theme, "treetop");
  assert.match(style.far, /treetop\/far-loop-pair\.png/);
  assert.match(style.mid, /treetop\/mid-loop-pair\.png/);
  assert.equal(style.repeat, "repeat-y");
  assert.ok(style.platformCount >= 4);
  assert.match(style.platformImage, /treetop-branch-platform\/prop\.png/);
  const beforeCamera = await l3.evaluate(() => document.querySelector("#map-far-layer").style.backgroundPosition);
  await l3.evaluate(() => window.__mvpTest.setMapOffset({ cameraY:1800 }));
  const afterCamera = await l3.evaluate(() => document.querySelector("#map-far-layer").style.backgroundPosition);
  assert.notEqual(afterCamera, beforeCamera);
  await l3.evaluate(() => window.__mvpTest.setMapOffset({ cameraY:0 }));
  await l3.evaluate(() => window.__mvpTest.advance(8000));
  assert.equal(await l3.evaluate(() => window.__mvpTest.getState().level.phase), "scored_run");
  const safeCloudImage = await l3.evaluate(() => {
    const cloud=document.createElement("span");
    cloud.className="safe-cloud";
    cloud.dataset.safetyCloud="asset-check";
    document.querySelector("#bounce-platform-layer").append(cloud);
    return getComputedStyle(cloud).backgroundImage;
  });
  assert.match(safeCloudImage, /safety-cloud\/prop\.png/);
  await l3.screenshot({ path:path.join(screenshotDir, "L3-treetop-layered-map.png") });
  await l3.close();
  pass("L3 纵向循环背景随 cameraY 位移，踏板与安全云保持独立对象");

  assert.deepEqual(errors, []);
  pass("地图运行态无 404、脚本异常或控制台错误");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
