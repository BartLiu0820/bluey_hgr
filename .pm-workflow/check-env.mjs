#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkChromium, ensureChromium, expandHome, getBrowsersPath } from "./playwright-shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "config.json");

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function exists(relOrAbs) {
  return fs.existsSync(relOrAbs);
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function canImport(moduleName) {
  const result = spawnSync("node", ["-e", `import(${JSON.stringify(moduleName)}).then(()=>process.exit(0)).catch(()=>process.exit(1))`], {
    cwd: projectRoot,
    stdio: "ignore",
  });
  return result.status === 0;
}

function checkSkill(name, skillPath, requiredFiles) {
  const issues = [];
  if (!exists(skillPath)) {
    issues.push(`missing skill dir: ${skillPath}`);
    return issues;
  }
  for (const rel of requiredFiles) {
    const target = path.join(skillPath, rel);
    if (!exists(target)) issues.push(`missing ${name}/${rel}`);
  }
  return issues;
}

const config = readConfig();
const required = Object.fromEntries(
  Object.entries(config.requiredSkills || {}).map(([name, skillPath]) => [name, expandHome(skillPath)]),
);
const installBrowsers = process.argv.includes("--install-browsers");

const checks = [
  ["product-research", ["SKILL.md"]],
  ["product-architecture", ["SKILL.md", "scripts/generate_architecture.py"]],
  ["product-detail", ["SKILL.md"]],
  ["prototype-spec-writer", ["SKILL.md", "templates/prototype-spec.md", "templates/screen-spec.md", "references/spec-quality.md", "scripts/validate-spec.mjs"]],
  ["html-prototype-builder", ["SKILL.md", "scripts/check-prototype.mjs", "references/test-protocol.md", "references/ui-ux-pro-max/scripts/search.py", "assets/prototype-starter/index.html"]],
  ["ai-persona-prototype-review", ["SKILL.md", "design.md", "templates/05A-ai-persona-prototype-review.md", "templates/05A-ai-persona-findings.json", "templates/05B-pm-simulation-decision.md", "references/ai-simulation-method.md"]],
  ["pm-review-gate", ["SKILL.md", "scripts/render-review-console.mjs", "templates/review-console-data.json"]],
  ["pm-change-router", ["SKILL.md"]],
];

const failures = [];
console.log("PM workflow environment check");
console.log(`Project: ${projectRoot}`);
console.log(`Skills root: ${expandHome(config.skillsRoot)}`);
console.log(`Shared Playwright browsers: ${getBrowsersPath(config)}`);

const projectFiles = [
  "workflow-state.md",
  "CLAUDE.md",
  "AGENTS.md",
  "00-input/brief.md",
  "cases/error-cases.md",
  "rules/authority-sources.md",
  "rules/rule-candidates.md",
  "rules/active-rules.md",
  "changes/change-log.md",
];

for (const rel of projectFiles) {
  const target = path.join(projectRoot, rel);
  const ok = exists(target);
  console.log(`${ok ? "PASS" : "FAIL"} project file ${rel}`);
  if (!ok) failures.push(`missing project file: ${rel}`);
}

for (const [name, files] of checks) {
  const skillPath = required[name];
  const issues = checkSkill(name, skillPath, files);
  if (issues.length === 0) {
    console.log(`PASS ${name}: ${skillPath}`);
  } else {
    console.log(`FAIL ${name}: ${skillPath || "(not configured)"}`);
    for (const issue of issues) console.log(`  - ${issue}`);
    failures.push(...issues);
  }
}

const toolChecks = [
  ["node", true],
  ["python3", true],
  ["npm", false],
];

for (const [tool, requiredTool] of toolChecks) {
  const ok = commandExists(tool);
  console.log(`${ok ? "PASS" : requiredTool ? "FAIL" : "WARN"} command ${tool}`);
  if (!ok && requiredTool) failures.push(`missing command: ${tool}`);
}

const playwrightReady = canImport("playwright");
console.log(`${playwrightReady ? "PASS" : "WARN"} optional Playwright browser checks`);
if (!playwrightReady) {
  console.log("  - Static prototype checks still work.");
  console.log("  - For browser checks, run: npm install && npm run workflow:ensure-browsers");
} else if (installBrowsers) {
  const ensured = ensureChromium(projectRoot, config);
  console.log(`${ensured.ok ? "PASS" : "FAIL"} shared Chromium${ensured.installed ? " installed" : " ready"}`);
  if (!ensured.ok) failures.push(ensured.error || "shared Chromium unavailable");
} else {
  const chromium = checkChromium(projectRoot, config);
  console.log(`${chromium.status === 0 ? "PASS" : "WARN"} shared Chromium launch check`);
  if (chromium.status !== 0) {
    console.log("  - Browser checks need Chromium in the shared cache.");
    console.log("  - Run: npm run workflow:ensure-browsers");
  }
}

if (failures.length > 0) {
  console.log("");
  console.log("Install the full skill directories, not just SKILL.md. Required skill folders:");
  for (const name of Object.keys(required)) {
    console.log(`- ${name}`);
  }
  process.exit(1);
}

console.log("");
console.log("Environment is ready for the PM workflow.");
