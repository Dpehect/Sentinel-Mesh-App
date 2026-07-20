#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function uniqueWords(value) {
  return [...new Set(value.trim().split(/\s+/).filter(Boolean))].join(" ");
}

const packagePath = path.join(root, "package.json");
if (!fs.existsSync(packagePath)) {
  console.error("Run from the Sentinel-Mesh-App repository root.");
  process.exit(1);
}

const pkg = readJson(packagePath);
pkg.version = "10.0.1";
pkg.scripts = pkg.scripts ?? {};

for (const scriptName of ["test", "typecheck"]) {
  if (typeof pkg.scripts[scriptName] === "string") {
    pkg.scripts[scriptName] = uniqueWords(pkg.scripts[scriptName]);
  }
}

pkg.scripts["phase75:scan"] = "node scripts/phase75-scan.mjs";
pkg.scripts["phase75:repair"] = "node scripts/phase75-repair.mjs";
pkg.scripts["phase75:verify"] =
  "npm run phase75:scan && npm run typecheck && npm run test && npm run build";

writeJson(packagePath, pkg);

const webPackagePath = path.join(root, "apps/web/package.json");
if (fs.existsSync(webPackagePath)) {
  const web = readJson(webPackagePath);
  web.dependencies = web.dependencies ?? {};

  const expectedWorkspaces = [
    "@sentinel/final-integration",
    "@sentinel/operations-center",
    "@sentinel/release-readiness",
    "@sentinel/rollout-control-plane"
  ];

  for (const name of expectedWorkspaces) {
    web.dependencies[name] = "workspace:*";
  }

  writeJson(webPackagePath, web);
}

const duplicateCandidates = [
  [
    "apps/web/src/app/manifest.ts",
    "apps/web/src/app/manifest.webmanifest/route.ts"
  ],
  [
    "apps/web/src/app/robots.ts",
    "apps/web/src/app/robots.txt/route.ts"
  ]
];

const archive = path.join(root, "archive", "phase75-duplicate-routes");
fs.mkdirSync(archive, { recursive: true });

for (const [preferred, duplicate] of duplicateCandidates) {
  const preferredPath = path.join(root, preferred);
  const duplicatePath = path.join(root, duplicate);

  if (fs.existsSync(preferredPath) && fs.existsSync(duplicatePath)) {
    const target = path.join(
      archive,
      duplicate.replaceAll("/", "__")
    );
    fs.renameSync(duplicatePath, target);
    console.log(`Archived duplicate route: ${duplicate}`);
  }
}

const nextConfigPath = path.join(root, "apps/web/next.config.ts");
if (fs.existsSync(nextConfigPath)) {
  let config = fs.readFileSync(nextConfigPath, "utf8");

  if (!config.includes("outputFileTracingRoot")) {
    config = config.replace(
      /const nextConfig[^=]*=\s*\{/,
      match => `${match}\n  outputFileTracingRoot: process.cwd(),`
    );
    fs.writeFileSync(nextConfigPath, config);
  }
}

console.log("Phase 75 repairs applied.");
console.log("Version: 10.0.1");
