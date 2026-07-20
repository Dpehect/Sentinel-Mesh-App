import { access, readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const required = [
  "package.json",
  ".env.example",
  "apps/web/package.json",
  "apps/worker/package.json",
  "packages/security-core/package.json",
  "packages/scanner-runner/package.json",
  "packages/db/migrations/001_initial.sql",
  "docker-compose.yml",
];
const failures = [];
for (const file of required) {
  try { await access(join(root, file)); } catch { failures.push(`Missing required file: ${file}`); }
}

const forbidden = new Set(["node_modules", ".next", "dist", ".git", "coverage"]);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (forbidden.has(entry.name)) failures.push(`Forbidden generated directory included: ${relative(root, join(dir, entry.name))}`);
    if (entry.isDirectory() && !forbidden.has(entry.name)) await walk(join(dir, entry.name));
    if (entry.isFile() && (await stat(join(dir, entry.name))).size > 5_000_000) failures.push(`Unexpected large source file: ${relative(root, join(dir, entry.name))}`);
  }
}
await walk(root);

const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
for (const script of ["dev", "build", "test", "typecheck", "verify"]) {
  if (!pkg.scripts?.[script]) failures.push(`Missing root script: ${script}`);
}
const env = await readFile(join(root, ".env.example"), "utf8");
for (const key of ["DEMO_MODE", "DATABASE_URL", "REDIS_URL", "WORKER_URL", "AUTH_SECRET"]) {
  if (!env.includes(`${key}=`)) failures.push(`Missing environment template key: ${key}`);
}
if (failures.length) {
  console.error(`Static verification failed:\n${failures.map(x => `- ${x}`).join("\n")}`);
  process.exit(1);
}
console.log("Static verification passed.");
