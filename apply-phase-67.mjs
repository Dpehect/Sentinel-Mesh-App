#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = here;
const targetRoot = process.cwd();

if (!fs.existsSync(path.join(targetRoot, "package.json"))) {
  console.error("ERROR: Extract this Phase 67 package into the Sentinel-Mesh-App repository root, then run again.");
  process.exit(1);
}

function copyRecursive(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
  } else {
    fs.copyFileSync(source, target);
  }
}

copyRecursive(
  path.join(sourceRoot, "packages", "agent-fleet-orchestration"),
  path.join(targetRoot, "packages", "agent-fleet-orchestration")
);
copyRecursive(
  path.join(sourceRoot, "docs", "PHASE-67-AGENT-FLEET-ORCHESTRATION.md"),
  path.join(targetRoot, "docs", "PHASE-67-AGENT-FLEET-ORCHESTRATION.md")
);

const packagePath = path.join(targetRoot, "package.json");
const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
rootPackage.version = "8.0.0";

const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/agent-fleet-orchestration";

function appendBuild(scriptName, command) {
  const current = scripts[scriptName] ?? "";
  if (!current.includes(workspace)) {
    scripts[scriptName] = current ? `${current} && ${command}` : command;
  }
}

appendBuild("build:packages", `npm run build -w ${workspace}`);

for (const [name, command] of [
  ["test:agent-fleet-orchestration", `npm run test -w ${workspace}`],
  ["typecheck:agent-fleet-orchestration", `npm run typecheck -w ${workspace}`]
]) {
  scripts[name] = command;
}

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:agent-fleet-orchestration");
appendRunner("typecheck", "typecheck:agent-fleet-orchestration");

rootPackage.scripts = scripts;
fs.writeFileSync(packagePath, JSON.stringify(rootPackage, null, 2) + "\n");

console.log("Sentinel Mesh Phase 67 applied successfully.");
console.log("Next: npm install");
console.log("Verify: npm run test:agent-fleet-orchestration");
