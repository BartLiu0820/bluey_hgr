import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const baseUrl = process.argv[2] || 'http://127.0.0.1:36721/04B-prototype-%E6%89%8B%E5%8A%BF%E5%B0%8F%E7%8B%97%E6%8E%A2%E9%99%A9MVP.html';
const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless:true, executablePath });
const page = await browser.newPage({ viewport:{ width:1440, height:900 }, deviceScaleFactor:1 });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error)));
const supportedViewports = [
  { width:1440, height:900 },
  { width:1280, height:720 },
  { width:1219, height:681 },
  { width:1024, height:700 },
  { width:919, height:843 }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function startLevel(levelId) {
  await page.evaluate(id => {
    window.__mvpTest.selectLevel(id);
    document.querySelector('#launch-start').click();
    window.__mvpTest.advance(3100);
    window.__mvpTest.advance(8100);
  }, levelId);
  const state = await page.evaluate(() => window.__mvpTest.getState());
  assert(state.screen === 'LV-02', `${levelId} did not enter gameplay`);
  assert(state.level.phase === 'scored_run', `${levelId} did not finish tutorial`);
  return state;
}

async function setProgress(meters) {
  await page.evaluate(value => window.__mvpTest.setProgressMeters(value), meters);
  await page.waitForTimeout(350);
  return page.evaluate(() => window.__mvpTest.getState());
}

async function layoutSnapshot() {
  return page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { left:value.left, top:value.top, right:value.right, bottom:value.bottom, width:value.width, height:value.height, zIndex:Number(getComputedStyle(element).zIndex) || 0 };
    };
    const intersects = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const overlay = rect('#milestone-overlay');
    const coach = rect('#game-coach');
    const dog = rect('#level-dog-wrap');
    const hudPanel = rect('#milestone-hud');
    const actionCue = rect('#target-cue');
    const overlayCoachOverlap = intersects(overlay, coach);
    const overlayDogOverlap = intersects(overlay, dog);
    const hudActionOverlap = actionCue.height > 0 && intersects(hudPanel, actionCue);
    return { viewport:{ width:innerWidth, height:innerHeight }, overlay, coach, dog, hudPanel, actionCue, hudActionOverlap, overlayCoachOverlap, overlayDogOverlap, overlayCoachBlocks:overlayCoachOverlap && overlay.zIndex >= coach.zIndex, overlayDogBlocks:overlayDogOverlap && overlay.zIndex >= dog.zIndex };
  });
}

async function validateSupportedViewports(levelId) {
  const results = [];
  for (const viewport of supportedViewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(35);
    const layout = await layoutSnapshot();
    const inside = box => box && box.left >= -2 && box.top >= -2 && box.right <= viewport.width + 2 && box.bottom <= viewport.height + 2;
    assert(inside(layout.hudPanel), `${levelId} HUD panel clipped at ${viewport.width}x${viewport.height}`);
    assert(inside(layout.overlay), `${levelId} milestone panel clipped at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout.overlay)}`);
    assert(!layout.hudActionOverlap, `${levelId} HUD panel overlaps action cue at ${viewport.width}x${viewport.height}`);
    assert(!layout.overlayCoachBlocks && !layout.overlayDogBlocks, `${levelId} milestone panel blocks gameplay at ${viewport.width}x${viewport.height}`);
    results.push({ viewport, hudPanel:layout.hudPanel, overlay:layout.overlay });
  }
  await page.setViewportSize({ width:1440, height:900 });
  return results;
}

await page.goto(baseUrl, { waitUntil:'networkidle' });
await page.evaluate(() => window.__mvpTest.startWithMode('keyboard_full'));
const report = { pageErrors, levels:{} };

await startLevel('L1');
let state = await setProgress(100);
assert(state.level.milestoneTier === 1, 'L1 100m tier mismatch');
assert(Math.abs(state.level.speedMultiplier - 1.12) < .001, 'L1 100m speed mismatch');
const l1Viewports = await validateSupportedViewports('L1');
let layout = await layoutSnapshot();
assert(!layout.overlayCoachBlocks && !layout.overlayDogBlocks, 'L1 milestone overlay blocks gameplay');
await page.screenshot({ path:'qa/endless-L1-100m.png', fullPage:false });
state = await setProgress(1000);
assert(state.level.milestoneTier === 5 && state.level.endlessSegment === 1, 'L1 endless segment mismatch');
report.levels.L1 = { tier1Speed:1.12, endless:state.level.endlessSegment, viewports:l1Viewports.length, layout };

await startLevel('L2');
state = await setProgress(450);
assert(state.level.milestoneTier === 3, 'L2 450m tier mismatch');
const l2Viewports = await validateSupportedViewports('L2');
await page.evaluate(() => window.__mvpTest.previewMapObject('reed'));
const reedSkin = await page.locator('#world-object').getAttribute('data-skin');
assert(reedSkin === 'reed', 'L2 reed obstacle skin missing');
layout = await layoutSnapshot();
assert(!layout.overlayCoachBlocks && !layout.overlayDogBlocks, 'L2 milestone overlay blocks gameplay');
await page.screenshot({ path:'qa/endless-L2-450m.png', fullPage:false });
report.levels.L2 = { tier:state.level.milestoneTier, obstacleSkin:reedSkin, viewports:l2Viewports.length, layout };

await startLevel('L3');
state = await setProgress(20);
assert(state.level.milestoneTier === 1, 'L3 20m tier mismatch');
assert(Math.abs(state.level.bounceTempoMultiplier - 1.06) < .001, 'L3 20m tempo mismatch');
const l3Viewports = await validateSupportedViewports('L3');
layout = await layoutSnapshot();
assert(!layout.overlayCoachBlocks && !layout.overlayDogBlocks, `L3 milestone overlay blocks gameplay: ${JSON.stringify(layout)}`);
await page.screenshot({ path:'qa/endless-L3-20m.png', fullPage:false });
state = await setProgress(200);
assert(state.level.milestoneTier === 5 && state.level.endlessSegment === 1, 'L3 endless segment mismatch');
report.levels.L3 = { tier1Tempo:1.06, endless:state.level.endlessSegment, viewports:l3Viewports.length, layout };

assert(pageErrors.length === 0, `page errors: ${pageErrors.join('; ')}`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
