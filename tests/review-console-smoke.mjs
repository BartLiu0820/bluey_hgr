import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const relativeTarget = process.argv[2] || "reviews/phase-3-core-loop-review.html";
const target = path.resolve(projectRoot, relativeTarget);
assert.equal(target.startsWith(projectRoot), true, "review target must stay inside project");
assert.equal(fs.existsSync(target), true, `missing review target: ${relativeTarget}`);
const dataTarget = target.replace(/\.html$/i, "-data.json");
const expectedDecisionCards = fs.existsSync(dataTarget)
  ? JSON.parse(fs.readFileSync(dataTarget, "utf8")).decision_cards.length
  : null;

const qaDir = path.join(projectRoot, "prototype-qa");
fs.mkdirSync(qaDir, { recursive: true });
const screenshotName = `${path.basename(target, ".html")}-desktop.png`;
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 700 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(pathToFileURL(target).href, { waitUntil: "load" });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      decisionCards: document.querySelectorAll(".decision-card").length,
      materialCards: document.querySelectorAll(".material-card").length,
      feedbackFields: document.querySelectorAll("[data-feedback-field]").length,
      hasDirectFeedback: Boolean(document.querySelector("[data-direct-feedback], #direct-feedback, #directFeedback"))
    }));
    assert.equal(metrics.scrollWidth <= metrics.innerWidth, true, `${viewport.width} viewport overflows horizontally`);
    if (expectedDecisionCards === null) assert.equal(metrics.decisionCards >= 1, true, "expected PM decision cards");
    else assert.equal(metrics.decisionCards, expectedDecisionCards, "decision cards must match review data");
    assert.equal(metrics.materialCards >= 3, true, "expected source material cards");
    assert.equal(metrics.feedbackFields >= metrics.decisionCards, true, "expected feedback controls for every decision");
    assert.equal(metrics.hasDirectFeedback, true, "expected direct feedback control");
    assert.deepEqual(errors, [], errors.join(" | "));
    if (viewport.width === 1440) await page.screenshot({ path: path.join(qaDir, screenshotName), fullPage: true });
    console.log(`PASS ${relativeTarget} ${viewport.width}x${viewport.height}: ${metrics.decisionCards} decisions, ${metrics.materialCards} materials, no overflow/errors`);
    await page.close();
  }
} finally {
  await browser.close();
}
