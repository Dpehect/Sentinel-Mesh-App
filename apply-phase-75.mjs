#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.cwd();

if (!fs.existsSync(path.join(target, "package.json"))) {
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
  "scripts/phase75-repair.mjs",
  "scripts/phase75-scan.mjs",
  "docs/PHASE-75-BUG-FIX-SPRINT.md",
  "apps/web/src/lib/api-response.ts",
  "apps/web/src/lib/runtime-guards.ts",
  "apps/web/src/components/safe-panel.tsx",
  "apps/web/src/app/api/diagnostics/self-test",
  "apps/web/src/app/(console)/self-test"
]) {
  copy(path.join(here, relative), path.join(target, relative));
}

const cssPath = path.join(
  target,
  "apps/web/src/app/globals.css"
);
const cssFragment = fs.readFileSync(
  path.join(here, "apps/web/src/app/phase-75-fixes.css"),
  "utf8"
);

if (fs.existsSync(cssPath)) {
  const current = fs.readFileSync(cssPath, "utf8");
  if (!current.includes("Phase 75 bug-fix resilience layer")) {
    fs.appendFileSync(cssPath, `\n\n${cssFragment}\n`);
  }
}

await import(path.join(target, "scripts/phase75-repair.mjs"));

console.log("Phase 75 installed.");
console.log("Next: npm install");
console.log("Verify: npm run phase75:verify");
console.log("Open: http://localhost:3000/self-test");
