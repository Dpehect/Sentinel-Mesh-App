#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const commands = [
  ["npm", ["run", "verify:static"]],
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

console.log("\nSentinel Mesh release checks passed.");
