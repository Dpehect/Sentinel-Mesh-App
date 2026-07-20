#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = process.cwd();
const rootPackagePath = path.join(targetRoot, "package.json");

if (!fs.existsSync(rootPackagePath)) {
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

for (const relative of [
  "packages/operations-center",
  "docs/PHASE-71-OPERATIONS-CENTER.md",
  "apps/web/src/lib/operations-center.ts",
  "apps/web/src/app/(console)/operations",
  "apps/web/src/app/(console)/team",
  "apps/web/src/app/api/operations"
]) {
  copyRecursive(path.join(here, relative), path.join(targetRoot, relative));
}

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
rootPackage.version = "9.5.0";
const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/operations-center";

function appendCommand(scriptName, command) {
  const current = scripts[scriptName] ?? "";
  if (!current.includes(workspace)) {
    scripts[scriptName] = current ? `${current} && ${command}` : command;
  }
}

appendCommand("build:packages", `npm run build -w ${workspace}`);
scripts["test:operations-center"] = `npm run test -w ${workspace}`;
scripts["typecheck:operations-center"] = `npm run typecheck -w ${workspace}`;

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:operations-center");
appendRunner("typecheck", "typecheck:operations-center");
rootPackage.scripts = scripts;
fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2) + "\n");

const webPackagePath = path.join(targetRoot, "apps/web/package.json");
if (fs.existsSync(webPackagePath)) {
  const webPackage = JSON.parse(fs.readFileSync(webPackagePath, "utf8"));
  webPackage.dependencies = webPackage.dependencies ?? {};
  webPackage.dependencies[workspace] = "workspace:*";
  fs.writeFileSync(webPackagePath, JSON.stringify(webPackage, null, 2) + "\n");
}

const cssSource = fs.readFileSync(
  path.join(here, "apps/web/src/app/phase-71-operations.css"),
  "utf8"
);
const globalsPath = path.join(targetRoot, "apps/web/src/app/globals.css");
if (fs.existsSync(globalsPath)) {
  const currentCss = fs.readFileSync(globalsPath, "utf8");
  if (!currentCss.includes("Phase 71 operations center")) {
    fs.appendFileSync(globalsPath, `\n\n${cssSource}\n`);
  }
}

const gitignorePath = path.join(targetRoot, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const current = fs.readFileSync(gitignorePath, "utf8");
  if (!current.split(/\r?\n/).includes(".sentinel-data/")) {
    fs.appendFileSync(gitignorePath, "\n.sentinel-data/\n");
  }
}

console.log("Sentinel Mesh Phase 71 applied successfully.");
console.log("Version: 9.5.0");
console.log("Next: npm install");
console.log("Verify: npm run test:operations-center");
console.log("Open: http://localhost:3000/operations");
