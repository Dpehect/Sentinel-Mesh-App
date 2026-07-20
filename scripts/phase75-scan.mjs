#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function requireFile(relative) {
  if (!fs.existsSync(path.join(root, relative))) {
    failures.push(`Missing: ${relative}`);
  }
}

[
  "package.json",
  "apps/web/package.json",
  "apps/worker/package.json",
  "apps/web/src/app/(console)/command-center/page.tsx",
  "apps/web/src/app/(console)/operations/page.tsx",
  "apps/web/src/app/(console)/rollouts/page.tsx",
  "apps/web/src/app/(console)/system/page.tsx",
  "packages/final-integration/package.json"
].forEach(requireFile);

const duplicateGroups = [
  [
    "apps/web/src/app/manifest.ts",
    "apps/web/src/app/manifest.webmanifest/route.ts"
  ],
  [
    "apps/web/src/app/robots.ts",
    "apps/web/src/app/robots.txt/route.ts"
  ]
];

for (const group of duplicateGroups) {
  const existing = group.filter(relative =>
    fs.existsSync(path.join(root, relative))
  );

  if (existing.length > 1) {
    failures.push(`Duplicate route candidates: ${existing.join(", ")}`);
  }
}

const rootPackage = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8")
);

for (const [name, script] of Object.entries(rootPackage.scripts ?? {})) {
  if (
    typeof script === "string" &&
    /\b(test:[^ ]+)(?:\s+\1)+\b/.test(script)
  ) {
    warnings.push(`Possible duplicate script token in ${name}`);
  }
}

if (
  fs.existsSync(path.join(root, "app")) &&
  fs.existsSync(path.join(root, "data"))
) {
  warnings.push("Legacy root static demo still exists");
}

if (warnings.length > 0) {
  console.warn("\nWarnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length > 0) {
  console.error("\nPhase 75 scan failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nPhase 75 repository scan passed.");
