import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const prototypeName = "04B-prototype-手势小狗探险MVP.html";
const actions = ["idle", "run", "jump", "hover", "hurt", "bump", "celebrate"];
const characters = ["bluey", "bingo"];
const spritePaths = characters.flatMap(character => actions.flatMap(action => Array.from({ length: 4 }, (_, index) => `assets/characters/${character}/${action}/${action}-${index + 1}.png`)));
const mimeTypes = { ".html":"text/html; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".png":"image/png", ".wasm":"application/wasm", ".task":"application/octet-stream" };

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = path.resolve(projectRoot, `.${pathname}`);
  if (!requested.startsWith(`${projectRoot}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(prototypeName)}`;
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
const errors = [];
page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

function pass(message) { console.log(`PASS ${message}`); }
async function advance(ms) { await page.evaluate(value => window.__mvpTest.advance(value), ms); }
async function levelDogSource() { return page.locator("#level-dog").getAttribute("src"); }

try {
  await page.goto(url, { waitUntil:"load" });
  const loaded = await page.evaluate(paths => Promise.all(paths.map(src => new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve({ src, ok:image.naturalWidth > 0 && image.naturalHeight > 0 }); image.onerror = () => resolve({ src, ok:false }); image.src = src;
  }))), spritePaths);
  assert.deepEqual(loaded.filter(item => !item.ok), []);
  pass("双角色十四组 56 张透明动作帧全部可加载");

  assert.equal(await page.locator('use[href="#dog"]').count(), 0);
  assert.equal(await page.locator(".dog-art").evaluateAll(nodes => nodes.every(node => node instanceof HTMLImageElement && node.naturalWidth > 0)), true);
  pass("页面可见角色实例已从旧 SVG 占位图切换为生成图片");

  await page.evaluate(() => window.__mvpTest.startWithMode("keyboard_full"));
  await page.evaluate(() => window.__mvpTest.selectLevel("L1"));
  await page.click("#launch-start");
  await advance(3000);
  await page.evaluate(() => window.__mvpTest.setCharacter("orange_dog"));
  await advance(240);
  assert.match(await levelDogSource(), /\/bingo\/run\/run-[1-4]\.png$/);
  await page.evaluate(() => window.__mvpTest.emit("JUMP", "child_keyboard"));
  await advance(420);
  assert.match(await levelDogSource(), /\/bingo\/jump\/jump-[1-4]\.png$/);
  await advance(4200);
  await page.evaluate(() => window.__mvpTest.triggerCollision());
  await advance(220);
  assert.match(await levelDogSource(), /\/bingo\/bump\/bump-[1-4]\.png$/);
  pass("伙伴角色在 L1 奔跑、跳跃、温和受挫时切换自己的动作帧");

  await page.evaluate(() => window.__mvpTest.enterLevelMap());
  await page.evaluate(() => window.__mvpTest.selectLevel("L2"));
  await page.click("#launch-start");
  await advance(3000);
  await page.evaluate(() => window.__mvpTest.setCharacter("orange_dog"));
  await advance(240);
  assert.match(await levelDogSource(), /\/bingo\/hover\/hover-[1-4]\.png$/);
  pass("伙伴角色在 L2 上下跟手玩法使用自己的悬浮动作帧");

  await page.evaluate(() => window.__mvpTest.enterLevelMap());
  await page.evaluate(() => window.__mvpTest.selectLevel("L3"));
  await page.click("#launch-start");
  await advance(3000);
  await page.evaluate(() => window.__mvpTest.setCharacter("orange_dog"));
  await advance(240);
  assert.match(await levelDogSource(), /\/bingo\/jump\/jump-[1-4]\.png$/);
  pass("伙伴角色在 L3 自动弹跳玩法使用自己的跳跃动作帧");

  assert.equal(await page.locator('[data-screen-id="GI-06"]').count(), 0);
  assert.match(await page.locator(".launch-dogs .partner-dog").getAttribute("src"), /\/bingo\/idle\/idle-[1-4]\.png$/);
  assert.match(await page.locator(".run-memory-dogs .partner-dog").getAttribute("src"), /\/bingo\/celebrate\/celebrate-[1-4]\.png$/);
  assert.deepEqual(errors, []);
  pass("已移除冗余按键确认层；开局与成绩页面显示真实伙伴待机/庆祝素材，且无脚本或资源错误");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log("Two-character sprite targeted QA complete: 6/6 PASS");
