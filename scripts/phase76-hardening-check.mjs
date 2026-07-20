#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "packages/production-hardening/package.json",
  "apps/web/src/lib/production-hardening.ts",
  "apps/web/src/lib/security-middleware.ts",
  "apps/web/src/app/api/security/health/route.ts",
  "apps/web/src/app/api/security/audit/route.ts",
  "apps/web/src/app/(console)/security-hardening/page.tsx"
];

const missing = required.filter(
  file => !fs.existsSync(path.join(root, file))
);

if (missing.length > 0) {
  console.error("Phase 76 hardening check failed.");
  for (const item of missing) console.error(`- Missing ${item}`);
  process.exit(1);
}

const envExample = path.join(root, ".env.release.example");
if (fs.existsSync(envExample)) {
  const env = fs.readFileSync(envExample, "utf8");
  if (!env.includes("SENTINEL_SESSION_SECRET")) {
    console.warn("SENTINEL_SESSION_SECRET is not documented.");
  }
}

console.log("Phase 76 production hardening check passed.");
