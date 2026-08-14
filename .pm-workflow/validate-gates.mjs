#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const results = [];

function result(status, message) {
  results.push({ status, message });
}

function exists(rel) {
  return fs.existsSync(path.join(projectRoot, rel));
}

function read(rel) {
  const target = path.join(projectRoot, rel);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
}

function filesMatching(pattern) {
  if (!fs.existsSync(projectRoot)) return [];
  return fs.readdirSync(projectRoot)
    .filter((name) => pattern.test(name))
    .sort();
}

function hasReviewSlice(rel) {
  const text = read(rel);
  return /^##\s+PM Review Slice\s*$/im.test(text) || /PM Review Slice/i.test(text);
}

function workflowMentionsArtifact(workflow, artifact) {
  const escaped = artifact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i").test(workflow);
}

const workflow = read("workflow-state.md");

console.log("PM workflow gate validation");
console.log(`Project: ${projectRoot}`);

if (!workflow) {
  result("FAIL", "workflow-state.md missing");
} else {
  result("PASS", "workflow-state.md present");
  for (const section of ["Review Gates", "Change Requests", "Source Of Truth Map"]) {
    result(
      new RegExp(`^##\\s+${section}\\s*$`, "im").test(workflow) ? "PASS" : "FAIL",
      `workflow-state.md has ## ${section}`,
    );
  }
}

for (const rel of ["changes/change-log.md", "rules/active-rules.md", "cases/error-cases.md"]) {
  result(exists(rel) ? "PASS" : "FAIL", `${rel} present`);
}

const fixedArtifacts = [
  "01-research.md",
  "01A-competitor-page-experience.md",
  "02-architecture.html",
];

const dynamicArtifacts = [
  ...filesMatching(/^03-feature-.+\.md$/),
  ...filesMatching(/^04A-prototype-spec-.+\.md$/),
  ...filesMatching(/^04B-prototype-.+\.html$/),
  ...filesMatching(/^05A-ai-persona-prototype-review-.+\.md$/),
  ...filesMatching(/^05B-pm-simulation-decision-.+\.md$/),
];

const artifacts = [
  ...fixedArtifacts.filter((rel) => exists(rel)),
  ...dynamicArtifacts,
];

for (const artifact of artifacts) {
  const isHtml = artifact.endsWith(".html");
  const sliceOk = isHtml ? workflowMentionsArtifact(workflow, artifact) : hasReviewSlice(artifact);
  result(
    sliceOk ? "PASS" : "WARN",
    isHtml
      ? `${artifact} has Review Gate trace in workflow-state.md`
      : `${artifact} has ## PM Review Slice`,
  );
}

const has01 = exists("01-research.md");
const has02 = exists("02-architecture.html");
const featureFiles = filesMatching(/^03-feature-.+\.md$/);
const specFiles = filesMatching(/^04A-prototype-spec-.+\.md$/);
const htmlFiles = filesMatching(/^04B-prototype-.+\.html$/);
const aiSimulationReports = filesMatching(/^05A-ai-persona-prototype-review-.+\.md$/);
const aiSimulationFindings = filesMatching(/^05A-ai-persona-findings-.+\.json$/);
const pmSimulationDecisions = filesMatching(/^05B-pm-simulation-decision-.+\.md$/);

if (has02 && !has01) {
  result("FAIL", "02-architecture.html exists before 01-research.md");
}

if (specFiles.length > 0 && featureFiles.length === 0) {
  result("WARN", "04A specs exist but no 03-feature files were found; verify equivalent upstream input was provided");
}

if (htmlFiles.length > 0 && specFiles.length === 0) {
  result("FAIL", "04B HTML prototypes exist before any 04A prototype spec");
}

if ((aiSimulationReports.length > 0 || aiSimulationFindings.length > 0) && htmlFiles.length === 0) {
  result("FAIL", "05A AI simulation artifacts exist before any 04B HTML prototype");
}

if (pmSimulationDecisions.length > 0 && aiSimulationFindings.length === 0) {
  result("FAIL", "05B PM simulation decisions exist before any 05A AI simulation findings JSON");
}

if (featureFiles.length > 0 && !/页面形态决策|Page Archetype|页面类型/i.test(workflow)) {
  result("WARN", "03-feature files exist but workflow-state.md does not mention page archetype / 页面形态决策");
}

if (artifacts.length === 0) {
  result("PASS", "no phase artifacts yet; initialized project gate structure is ready");
}

const hasFail = results.some((item) => item.status === "FAIL");

for (const item of results) {
  console.log(`${item.status} ${item.message}`);
}

process.exit(hasFail ? 1 : 0);
