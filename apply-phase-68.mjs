#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = process.cwd();

if (!fs.existsSync(path.join(targetRoot, "package.json"))) {
  console.error("ERROR: Run this package from the Sentinel-Mesh-App repository root.");
  process.exit(1);
}

function copyRecursive(source, target) {
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

copyRecursive(
  path.join(here, "packages", "agent-fleet-rollout"),
  path.join(targetRoot, "packages", "agent-fleet-rollout")
);
copyRecursive(
  path.join(here, "docs", "PHASE-68-AGENT-FLEET-ROLLOUT-SAFETY.md"),
  path.join(targetRoot, "docs", "PHASE-68-AGENT-FLEET-ROLLOUT-SAFETY.md")
);

const packagePath = path.join(targetRoot, "package.json");
const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
rootPackage.version = "8.1.0";

const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/agent-fleet-rollout";

function appendBuild(scriptName, command) {
  const current = scripts[scriptName] ?? "";
  if (!current.includes(workspace)) {
    scripts[scriptName] = current ? `${current} && ${command}` : command;
  }
}

appendBuild("build:packages", `npm run build -w ${workspace}`);
scripts["test:agent-fleet-rollout"] = `npm run test -w ${workspace}`;
scripts["typecheck:agent-fleet-rollout"] = `npm run typecheck -w ${workspace}`;

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:agent-fleet-rollout");
appendRunner("typecheck", "typecheck:agent-fleet-rollout");

rootPackage.scripts = scripts;
fs.writeFileSync(packagePath, JSON.stringify(rootPackage, null, 2) + "\n");

console.log("Sentinel Mesh Phase 68 applied successfully.");
console.log("Next: npm install");
console.log("Verify: npm run test:agent-fleet-rollout");
