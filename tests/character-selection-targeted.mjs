import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const prototypeName = "04B-prototype-手势小狗探险MVP.html";
const actions = ["idle", "run", "jump", "hover", "hurt", "bump", "celebrate"];
const characters = [
  ["bluey", "布鲁伊"],
  ["bingo", "宾果"],
  ["grey-puppy", "麦麦"],
  ["blue-heeler-dad", "班底特"],
  ["garden-girl", "悠悠"],
  ["lilac-girl", "棉棉"]
];
const roster = JSON.parse(fs.readFileSync(path.join(projectRoot, "assets/characters/character-roster.json"), "utf8"));
assert.deepEqual(roster.characters.map(({ id, displayName }) => [id, displayName]), characters);
const screenshotDir = process.env.CHARACTER_SELECTION_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive:true });
const spritePaths = characters.flatMap(([character]) => actions.flatMap(action =>
  Array.from({ length:4 }, (_, index) => `assets/characters/${character}/${action}/${action}-${index + 1}.png`)
));
const mimeTypes = { ".css":"text/css", ".html":"text/html; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".png":"image/png", ".mp3":"audio/mpeg", ".woff2":"font/woff2", ".wasm":"application/wasm", ".task":"application/octet-stream" };

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  if (pathname === "/favicon.ico") { response.writeHead(204); response.end(); return; }
  const requested = path.resolve(projectRoot, `.${pathname}`);
  if (!requested.startsWith(`${projectRoot}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type":mimeTypes[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(prototypeName)}`;
const browser = await chromium.launch({
  headless:true,
  executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const errors = [];
let passCount = 0;
function pass(message) { passCount += 1; console.log(`PASS ${message}`); }

try {
  const assetPage = await browser.newPage({ viewport:{ width:1440, height:900 } });
  assetPage.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  assetPage.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await assetPage.goto(url, { waitUntil:"load" });
  const loaded = await assetPage.evaluate(paths => Promise.all(paths.map(src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve({ src, ok:image.naturalWidth === 256 && image.naturalHeight === 256 });
    image.onerror = () => resolve({ src, ok:false });
    image.src = src;
  }))), spritePaths);
  assert.deepEqual(loaded.filter(item => !item.ok), []);
  assert.deepEqual(await assetPage.evaluate(() => window.__mvpTest.characters().map(({ id, displayName }) => [id, displayName])), characters);
  pass("六角色名单与运行时一致；42 组共 168 张 256×256 动作帧全部可加载");
  await assetPage.close();

  for (const viewport of [{ width:1440, height:900 }, { width:1280, height:720 }, { width:1219, height:681 }, { width:1024, height:700 }, { width:919, height:843 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(`${viewport.width}x${viewport.height} pageerror: ${error.message}`));
    page.on("console", message => { if (message.type() === "error") errors.push(`${viewport.width}x${viewport.height} console: ${message.text()}`); });
    await page.goto(url, { waitUntil:"load" });
    const state = await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
    assert.equal(state.screen, "CH-01");
    assert.equal(await page.locator("#ch01.screen.active").count(), 1);
    assert.deepEqual(await page.locator(".character-card strong").allTextContents(), characters.map(([, name]) => name));
    assert.equal(await page.locator('.character-card[aria-checked="true"]').count(), 1);
    assert.equal(await page.locator('.character-card[data-character-id="bluey"]').getAttribute("aria-checked"), "true");
    const layout = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll(".character-card")].map(node => node.getBoundingClientRect().toJSON());
      const inside = boxes.every(box => box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight);
      const overlap = boxes.some((a, index) => boxes.slice(index + 1).some(b => Math.min(a.right,b.right) > Math.max(a.left,b.left) && Math.min(a.bottom,b.bottom) > Math.max(a.top,b.top)));
      const namesFit = [...document.querySelectorAll(".character-card strong")].every(node => {
        const name = node.getBoundingClientRect(), card = node.parentElement.getBoundingClientRect();
        return name.left >= card.left && name.right <= card.right && name.top >= card.top && name.bottom <= card.bottom;
      });
      const confirm = document.querySelector("#character-confirm").getBoundingClientRect();
      const confirmVisible = confirm.top >= 0 && confirm.bottom <= innerHeight;
      return { inside, overlap, namesFit, confirmVisible, scrollWidth:document.documentElement.scrollWidth, scrollHeight:document.documentElement.scrollHeight, innerWidth, innerHeight };
    });
    assert.equal(layout.inside, true);
    assert.equal(layout.overlap, false);
    assert.equal(layout.namesFit, true);
    assert.equal(layout.confirmVisible, true);
    assert.equal(layout.scrollWidth, layout.innerWidth);
    assert.equal(layout.scrollHeight, layout.innerHeight);
    await page.locator('.character-card[data-character-id="bluey"]').focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('.character-card[data-character-id="bingo"]').getAttribute("aria-checked"), "true");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowDown");
    const verticalId = viewport.width <= 1050 && viewport.height >= 720 ? "blue-heeler-dad" : "bingo";
    assert.equal(await page.locator(`.character-card[data-character-id="${verticalId}"]`).getAttribute("aria-checked"), "true");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await page.getByRole("radio", { name:"棉棉，已选中", exact:true }).getAttribute("aria-checked"), "true");
    assert.equal(await page.locator('.character-card[tabindex="0"]').count(), 1);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => [...document.fonts].some(font => font.family === "Little Tail Xiaolai" && font.unicodeRange.toUpperCase() === "U+68C9" && font.status === "loaded")), true);
    if (screenshotDir) await page.screenshot({ path:path.join(screenshotDir, `selection-${viewport.width}x${viewport.height}.png`) });
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('.character-card[data-character-id="bluey"]').getAttribute("aria-checked"), "true");
    pass(`${viewport.width}×${viewport.height} 六卡单屏、名字与按钮可见、棉字已加载，行列方向键与首尾循环有效`);
    await page.close();
  }

  const page = await browser.newPage({ viewport:{ width:1219, height:681 } });
  page.on("pageerror", error => errors.push(`flow pageerror: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") errors.push(`flow console: ${message.text()}`); });
  await page.goto(url, { waitUntil:"load" });
  await page.evaluate(() => window.__mvpTest.startWithMode("camera_full"));
  assert.equal((await page.evaluate(() => window.__mvpTest.getState())).screen, "CH-01");
  if (process.env.CHARACTER_SELECTION_SCREENSHOT) await page.screenshot({ path:process.env.CHARACTER_SELECTION_SCREENSHOT, fullPage:false });
  await page.click('.character-card[data-character-id="grey-puppy"]');
  assert.equal((await page.evaluate(() => window.__mvpTest.getState())).pendingCharacterId, "grey-puppy");
  await page.click("#character-confirm");
  let state = await page.evaluate(() => window.__mvpTest.getState());
  assert.equal(state.screen, "LV-00");
  assert.equal(state.selectedCharacterId, "grey-puppy");
  assert.equal(await page.locator("#level-card-L1 .dog-art").getAttribute("data-character"), "grey-puppy");
  await page.click("#level-card-L1");
  assert.equal(await page.locator(".launch-dogs .dog-art").first().getAttribute("data-character"), "grey-puppy");
  await page.click("#launch-start");
  await page.evaluate(() => window.__mvpTest.advance(3000));
  state = await page.evaluate(() => window.__mvpTest.getState());
  assert.equal(state.level.currentCharacterId, "grey-puppy");
  assert.match(await page.locator("#level-dog").getAttribute("src"), /\/grey-puppy\/run\/run-[1-4]\.png$/);
  await page.evaluate(() => window.__mvpTest.enterLevelMap());
  state = await page.evaluate(() => window.__mvpTest.getState());
  assert.equal(state.selectedCharacterId, "grey-puppy");
  assert.equal(await page.locator("#level-card-L2 .dog-art").getAttribute("data-character"), "grey-puppy");
  pass("模拟摄像头就绪→麦麦→大厅→L1→换玩法全程保持 selectedCharacterId（非实摄验收）");
  await page.close();

  for (const [levelId, expectedAction] of [["L1", "run"], ["L2", "hover"], ["L3", "jump"]]) {
    const game = await browser.newPage({ viewport:{ width:1280, height:720 } });
    game.on("pageerror", error => errors.push(`${levelId} pageerror: ${error.message}`));
    game.on("console", message => { if (message.type() === "error") errors.push(`${levelId} console: ${message.text()}`); });
    await game.goto(url, { waitUntil:"load" });
    await game.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
    await game.getByRole("radio", { name:"棉棉", exact:true }).click();
    await game.click("#character-confirm");
    assert.equal((await game.evaluate(() => window.__mvpTest.getState())).selectedCharacterId, "lilac-girl");
    assert.deepEqual(await game.locator('.level-card .dog-art').evaluateAll(nodes => nodes.map(node => node.dataset.character)), ["lilac-girl", "lilac-girl", "lilac-girl", "lilac-girl"]);
    await game.click(`#level-card-${levelId}`);
    assert.equal(await game.locator(".launch-dogs .dog-art").first().getAttribute("data-character"), "lilac-girl");
    await game.click("#launch-start");
    await game.evaluate(() => window.__mvpTest.advance(3000));
    const assertAction = async action => assert.match(await game.locator("#level-dog").getAttribute("src"), new RegExp(`/lilac-girl/${action}/${action}-[1-4]\\.png$`));
    assert.equal((await game.evaluate(() => window.__mvpTest.getState())).level.currentCharacterId, "lilac-girl");
    assert.equal(await game.locator("#character-dot").getAttribute("aria-label"), "棉棉");
    await assertAction(expectedAction);
    if (screenshotDir) await game.screenshot({ path:path.join(screenshotDir, `mianmian-${levelId}.png`) });
    if (levelId === "L1") {
      await game.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
      await game.evaluate(() => window.__mvpTest.advance(420));
      await assertAction("jump");
      await game.evaluate(() => window.__mvpTest.advance(4200));
      await game.evaluate(() => window.__mvpTest.triggerCollision());
      await game.evaluate(() => window.__mvpTest.advance(220));
      await assertAction("bump");
      await game.evaluate(() => window.__mvpTest.advance(2200));
      await game.evaluate(() => { window.__mvpTest.setL1Target({ type:"pit", worldX:10000 }); window.__mvpTest.triggerCollision(); });
      await game.evaluate(() => window.__mvpTest.advance(120));
      await assertAction("hurt");
    }
    await game.evaluate(() => window.__mvpTest.completeLevel());
    const result = await game.evaluate(() => window.__mvpTest.getState());
    assert.equal(result.screen, "LV-03");
    assert.equal(result.completionSummary.finalCharacterId, "lilac-girl");
    assert.match(await game.locator(".run-memory-dogs .dog-art").first().getAttribute("src"), /\/lilac-girl\/celebrate\/celebrate-[1-4]\.png$/);
    await game.click("#play-again");
    await game.click("#launch-start");
    await game.evaluate(() => window.__mvpTest.advance(3000));
    assert.equal((await game.evaluate(() => window.__mvpTest.getState())).level.currentCharacterId, "lilac-girl");
    await assertAction(expectedAction);
    await game.evaluate(() => window.__mvpTest.completeLevel());
    await game.click("#return-map");
    assert.equal((await game.evaluate(() => window.__mvpTest.getState())).selectedCharacterId, "lilac-girl");
    pass(`棉棉 ${levelId} 选择→大厅→玩法动作→结算→重玩→换玩法贯通${levelId === "L1" ? "，跳跃/碰撞/救援动作通过" : ""}`);
    await game.close();
  }
  assert.deepEqual(errors, []);
  pass("六角色选择专项无脚本错误、控制台错误或资源错误");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log(`Character selection targeted QA complete: ${passCount}/${passCount} PASS`);
