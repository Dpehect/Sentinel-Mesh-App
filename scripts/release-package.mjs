#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const outputRoot = path.join(root, "dist-release");
const sourceRoot = path.join(outputRoot, "sentinel-mesh-10.2.0");

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(sourceRoot, { recursive: true });

const include = [
  "apps",
  "packages",
  "plugins",
  "docs",
  "scripts",
  "release",
  ".github",
  "package.json",
  "package-lock.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "docker-compose.yml",
  "docker-compose.production.yml",
  "docker-compose.release.yml",
  ".env.example",
  ".env.release.example"
];

function copyRecursive(source, destination) {
  if (!fs.existsSync(source)) return;

  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source)) {
      if (["node_modules", ".next", "dist", "coverage", ".sentinel-data"].includes(entry)) {
        continue;
      }

      copyRecursive(
        path.join(source, entry),
        path.join(destination, entry)
      );
    }
  } else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

for (const relative of include) {
  copyRecursive(
    path.join(root, relative),
    path.join(sourceRoot, relative)
  );
}

const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    const stat = fs.statSync(absolute);

    if (stat.isDirectory()) {
      walk(absolute);
    } else {
      const relative = path.relative(sourceRoot, absolute).replaceAll("\\", "/");
      const content = fs.readFileSync(absolute);
      files.push({
        path: relative,
        size: stat.size,
        sha256: createHash("sha256").update(content).digest("hex")
      });
    }
  }
}

walk(sourceRoot);

const manifest = {
  product: "Sentinel Mesh",
  version: "10.2.0",
  generatedAt: new Date().toISOString(),
  files
};

fs.writeFileSync(
  path.join(sourceRoot, "SOURCE-MANIFEST.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(`Release source created: ${sourceRoot}`);
console.log(`Files: ${files.length}`);
