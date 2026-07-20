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
  "packages/release-readiness",
  "apps/web/src/lib/release-readiness.ts",
  "apps/web/src/app/(console)/system",
  "apps/web/src/app/(console)/backups",
  "apps/web/src/app/api/system",
  "docs/PHASE-72-RELEASE-CANDIDATE.md",
  "scripts/release-check.mjs",
  "docker-compose.release.yml",
  ".env.release.example"
]) {
  copyRecursive(path.join(here, relative), path.join(targetRoot, relative));
}

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
rootPackage.version = "10.0.0-rc.1";
const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/release-readiness";

function appendCommand(scriptName, command) {
  const current = scripts[scriptName] ?? "";
  if (!current.includes(workspace)) {
    scripts[scriptName] = current ? `${current} && ${command}` : command;
  }
}

appendCommand("build:packages", `npm run build -w ${workspace}`);
scripts["test:release-readiness"] = `npm run test -w ${workspace}`;
scripts["typecheck:release-readiness"] = `npm run typecheck -w ${workspace}`;
scripts["release:check"] = "node scripts/release-check.mjs";

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:release-readiness");
appendRunner("typecheck", "typecheck:release-readiness");
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
  path.join(here, "apps/web/src/app/phase-72-system.css"),
  "utf8"
);
const globalsPath = path.join(targetRoot, "apps/web/src/app/globals.css");
if (fs.existsSync(globalsPath)) {
  const currentCss = fs.readFileSync(globalsPath, "utf8");
  if (!currentCss.includes("Phase 72 release candidate")) {
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

console.log("Sentinel Mesh Phase 72 applied successfully.");
console.log("Version: 10.0.0-rc.1");
console.log("Next: npm install");
console.log("Package test: npm run test:release-readiness");
console.log("Full release check: npm run release:check");
console.log("Open: http://localhost:3000/system");
console.log("Open: http://localhost:3000/backups");
