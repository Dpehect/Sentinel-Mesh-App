#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "docker-compose.release.yml",
  ".env.release.example",
  "apps/web/src/app/(console)/command-center/page.tsx",
  "apps/web/src/app/(console)/operations/page.tsx",
  "apps/web/src/app/(console)/rollouts/page.tsx",
  "apps/web/src/app/(console)/system/page.tsx",
  "apps/web/src/app/(console)/security-hardening/page.tsx",
  "release/release-manifest.json",
  "release/PRODUCTION-CHECKLIST.md",
  "release/RELEASE-NOTES.md"
];

const missing = requiredFiles.filter(
  file => !fs.existsSync(path.join(root, file))
);

if (missing.length > 0) {
  console.error("Release verification failed. Missing files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const commands = [
  ["npm", ["run", "phase75:scan"]],
  ["npm", ["run", "phase76:check"]],
  ["npm", ["run", "verify:final-layout"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "test"]],
  ["npm", ["run", "build"]]
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
}

console.log("\nSentinel Mesh 10.2.0 release verification passed.");
