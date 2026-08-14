import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_BROWSERS_PATH = "~/.cache/pm-workflow/playwright-browsers";

export function expandHome(input) {
  const value = String(input || "").trim();
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value
    .replace(/^\$HOME(?=\/|$)/, os.homedir())
    .replace(/^\$\{HOME\}(?=\/|$)/, os.homedir());
}

export function getBrowsersPath(config = {}) {
  const configured =
    process.env.PM_WORKFLOW_PLAYWRIGHT_BROWSERS_PATH ||
    config.playwright?.browsersPath ||
    DEFAULT_BROWSERS_PATH;
  return path.resolve(expandHome(configured));
}

export function getPlaywrightEnv(config = {}) {
  const browsersPath = getBrowsersPath(config);
  return {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath,
  };
}

export function checkChromium(projectRoot, config = {}) {
  const env = getPlaywrightEnv(config);
  const code = `
    import("playwright")
      .then(async ({ chromium }) => {
        const browser = await chromium.launch({ headless: true });
        await browser.close();
        process.exit(0);
      })
      .catch((error) => {
        console.error(error && error.message ? error.message : String(error));
        process.exit(1);
      });
  `;
  return spawnSync("node", ["-e", code], {
    cwd: projectRoot,
    env,
    encoding: "utf8",
  });
}

export function installChromium(projectRoot, config = {}) {
  const env = getPlaywrightEnv(config);
  fs.mkdirSync(env.PLAYWRIGHT_BROWSERS_PATH, { recursive: true });
  return spawnSync("playwright", ["install", "chromium"], {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
}

export function ensureChromium(projectRoot, config = {}) {
  const browsersPath = getBrowsersPath(config);
  const before = checkChromium(projectRoot, config);
  if (before.status === 0) {
    return { ok: true, installed: false, browsersPath };
  }

  console.log(`Chromium is not ready in shared cache: ${browsersPath}`);
  console.log("Installing Chromium once for all PM workflow projects...");
  const install = installChromium(projectRoot, config);
  if (install.error || install.status !== 0) {
    return {
      ok: false,
      installed: false,
      browsersPath,
      error: install.error?.message || `playwright install exited with ${install.status}`,
    };
  }

  const after = checkChromium(projectRoot, config);
  return {
    ok: after.status === 0,
    installed: true,
    browsersPath,
    error: after.status === 0 ? null : after.stderr || after.stdout || "Chromium launch check failed after install",
  };
}
