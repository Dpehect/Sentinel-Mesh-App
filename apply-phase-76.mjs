#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.cwd();
const rootPackagePath = path.join(target, "package.json");

if (!fs.existsSync(rootPackagePath)) {
  console.error("Run this installer from the Sentinel-Mesh-App repository root.");
  process.exit(1);
}

function copy(source, destination) {
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copy(
        path.join(source, entry),
        path.join(destination, entry)
      );
    }
  } else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

for (const relative of [
  "packages/production-hardening",
  "apps/web/src/lib/production-hardening.ts",
  "apps/web/src/lib/security-middleware.ts",
  "apps/web/src/app/api/security",
  "apps/web/src/app/(console)/security-hardening",
  "docs/PHASE-76-PRODUCTION-HARDENING.md",
  "scripts/phase76-hardening-check.mjs"
]) {
  copy(path.join(here, relative), path.join(target, relative));
}

const rootPackage = JSON.parse(
  fs.readFileSync(rootPackagePath, "utf8")
);
rootPackage.version = "10.1.0";
const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/production-hardening";

const build = scripts["build:packages"] ?? "";
if (!build.includes(workspace)) {
  scripts["build:packages"] = build
    ? `${build} && npm run build -w ${workspace}`
    : `npm run build -w ${workspace}`;
}

scripts["test:production-hardening"] =
  `npm run test -w ${workspace}`;
scripts["typecheck:production-hardening"] =
  `npm run typecheck -w ${workspace}`;
scripts["phase76:check"] =
  "node scripts/phase76-hardening-check.mjs";

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:production-hardening");
appendRunner("typecheck", "typecheck:production-hardening");

rootPackage.scripts = scripts;
fs.writeFileSync(
  rootPackagePath,
  JSON.stringify(rootPackage, null, 2) + "\n"
);

const webPackagePath = path.join(target, "apps/web/package.json");
if (fs.existsSync(webPackagePath)) {
  const webPackage = JSON.parse(
    fs.readFileSync(webPackagePath, "utf8")
  );
  webPackage.dependencies = webPackage.dependencies ?? {};
  webPackage.dependencies[workspace] = "workspace:*";
  fs.writeFileSync(
    webPackagePath,
    JSON.stringify(webPackage, null, 2) + "\n"
  );
}

const cssSource = fs.readFileSync(
  path.join(here, "apps/web/src/app/phase-76-hardening.css"),
  "utf8"
);
const globalsPath = path.join(target, "apps/web/src/app/globals.css");

if (fs.existsSync(globalsPath)) {
  const current = fs.readFileSync(globalsPath, "utf8");
  if (!current.includes("Phase 76 production hardening")) {
    fs.appendFileSync(globalsPath, `\n\n${cssSource}\n`);
  }
}

const navigationPath = path.join(
  target,
  "apps/web/src/lib/navigation.ts"
);

if (fs.existsSync(navigationPath)) {
  let navigation = fs.readFileSync(navigationPath, "utf8");
  if (!navigation.includes('href: "/security-hardening"')) {
    navigation = navigation.replace(
      /(\{\s*href:\s*"\/system"[\s\S]*?group:\s*"platform"\s*\},)/,
      `$1
  {
    href: "/security-hardening",
    label: "Hardening",
    description: "Security controls and audit status",
    group: "platform"
  },`
    );
    fs.writeFileSync(navigationPath, navigation);
  }
}

console.log("Sentinel Mesh Phase 76 applied successfully.");
console.log("Version: 10.1.0");
console.log("Next: npm install");
console.log("Verify: npm run phase76:check");
console.log("Open: http://localhost:3000/security-hardening");
