#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ensureChromium, expandHome, getBrowsersPath, getPlaywrightEnv } from "./playwright-shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

const tool = process.argv[2];
const args = process.argv.slice(3);

function skillPath(name, ...parts) {
  const base = expandHome(config.requiredSkills?.[name]);
  if (!base) throw new Error(`Skill path is not configured: ${name}`);
  return path.join(base, ...parts);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, ...options.env },
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

try {
  if (tool === "design-search") {
    run("python3", [skillPath("html-prototype-builder", "references/ui-ux-pro-max/scripts/search.py"), ...args]);
  } else if (tool === "check-prototype") {
    run("node", [skillPath("html-prototype-builder", "scripts/check-prototype.mjs"), ...args]);
  } else if (tool === "check-prototype-browser") {
    run("node", [skillPath("html-prototype-builder", "scripts/check-prototype.mjs"), "--browser", ...args], {
      env: getPlaywrightEnv(config),
    });
  } else if (tool === "ensure-browsers") {
    const result = ensureChromium(projectRoot, config);
    if (result.ok) {
      console.log(`${result.installed ? "INSTALLED" : "PASS"} shared Chromium: ${result.browsersPath}`);
      process.exit(0);
    }
    console.error(`FAIL shared Chromium: ${result.browsersPath}`);
    if (result.error) console.error(result.error);
    process.exit(1);
  } else if (tool === "playwright-install") {
    console.log(`Installing Chromium into shared cache: ${getBrowsersPath(config)}`);
    run("playwright", ["install", "chromium"], {
      env: getPlaywrightEnv(config),
    });
  } else if (tool === "validate-spec") {
    run("node", [skillPath("prototype-spec-writer", "scripts/validate-spec.mjs"), ...args]);
  } else if (tool === "render-review-console") {
    run("node", [skillPath("pm-review-gate", "scripts/render-review-console.mjs"), ...args]);
  } else if (tool === "architecture") {
    run("python3", [skillPath("product-architecture", "scripts/generate_architecture.py"), ...args]);
  } else {
    console.error(`Unknown workflow tool: ${tool || "(missing)"}`);
    console.error("Available: design-search, check-prototype, check-prototype-browser, ensure-browsers, playwright-install, validate-spec, render-review-console, architecture");
    process.exit(2);
  }
} catch (error) {
  console.error(`[workflow tool] ${error.message}`);
  process.exit(1);
}
