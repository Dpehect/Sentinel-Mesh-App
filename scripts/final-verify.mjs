#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const steps = [
  ["node", ["scripts/verify-final-layout.mjs"]],
  ["npm", ["run", "verify:static"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "test"]],
  ["npm", ["run", "build"]]
];

for (const [command, args] of steps) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
}

console.log("\nSentinel Mesh 10.0.0 final verification passed.");
