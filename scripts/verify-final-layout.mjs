#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "apps/web/src/app/(console)/command-center/page.tsx",
  "apps/web/src/app/(console)/rollouts/page.tsx",
  "apps/web/src/app/(console)/operations/page.tsx",
  "apps/web/src/app/(console)/team/page.tsx",
  "apps/web/src/app/(console)/system/page.tsx",
  "apps/web/src/app/(console)/backups/page.tsx",
  "packages/agent-fleet-orchestration/package.json",
  "packages/agent-fleet-rollout/package.json",
  "packages/agent-rollout-audit-chain/package.json",
  "packages/rollout-control-plane/package.json",
  "packages/operations-center/package.json",
  "packages/release-readiness/package.json",
  "packages/final-integration/package.json"
];

const missing = required.filter(
  relative => !fs.existsSync(path.join(root, relative))
);

const legacy = [
  "app",
  "data",
  "START-MAC.command",
  "START-WINDOWS.bat",
  "STOP-MAC.command"
].filter(relative => fs.existsSync(path.join(root, relative)));

if (missing.length > 0) {
  console.error("Final layout verification failed.");
  console.error("Missing:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

if (legacy.length > 0) {
  console.warn("Legacy static demo entries remain at repository root:");
  for (const item of legacy) console.warn(`- ${item}`);
  console.warn("Run the Phase 73 installer again to archive them.");
}

console.log("Sentinel Mesh final layout verified.");
console.log(`Required artifacts: ${required.length}`);
