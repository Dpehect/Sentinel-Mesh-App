#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = process.cwd();

if (!fs.existsSync(path.join(targetRoot, "package.json"))) {
  console.error("ERROR: Run this installer from the Sentinel-Mesh-App repository root.");
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
  path.join(here, "packages", "agent-rollout-audit-chain"),
  path.join(targetRoot, "packages", "agent-rollout-audit-chain")
);

copyRecursive(
  path.join(here, "docs", "PHASE-69-ROLLOUT-AUDIT-CHAIN.md"),
  path.join(targetRoot, "docs", "PHASE-69-ROLLOUT-AUDIT-CHAIN.md")
);

const packagePath = path.join(targetRoot, "package.json");
const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
rootPackage.version = "8.2.0";

const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/agent-rollout-audit-chain";

function appendBuild(scriptName, command) {
  const current = scripts[scriptName] ?? "";
  if (!current.includes(workspace)) {
    scripts[scriptName] = current ? `${current} && ${command}` : command;
  }
}

appendBuild("build:packages", `npm run build -w ${workspace}`);
scripts["test:agent-rollout-audit-chain"] =
  `npm run test -w ${workspace}`;
scripts["typecheck:agent-rollout-audit-chain"] =
  `npm run typecheck -w ${workspace}`;

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:agent-rollout-audit-chain");
appendRunner("typecheck", "typecheck:agent-rollout-audit-chain");

rootPackage.scripts = scripts;
fs.writeFileSync(
  packagePath,
  JSON.stringify(rootPackage, null, 2) + "\n"
);

console.log("Sentinel Mesh Phase 69 applied successfully.");
console.log("Next: npm install");
console.log("Verify: npm run test:agent-rollout-audit-chain");
