#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.cwd();
const packagePath = path.join(target, "package.json");

if (!fs.existsSync(packagePath)) {
  console.error("Run this installer from the Sentinel-Mesh-App repository root.");
  process.exit(1);
}

function copyRecursive(source, destination) {
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source)) {
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

for (const relative of [
  "release",
  "scripts/release-verify.mjs",
  "scripts/release-package.mjs",
  "docs/PHASE-77-FINAL-RELEASE.md",
  ".github/workflows/stable-release.yml"
]) {
  copyRecursive(
    path.join(here, relative),
    path.join(target, relative)
  );
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "10.2.0";
pkg.scripts = pkg.scripts ?? {};
pkg.scripts["release:verify"] = "node scripts/release-verify.mjs";
pkg.scripts["release:package"] = "node scripts/release-package.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

const readmePath = path.join(target, "README.md");
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, "utf8");
  readme = readme.replace(/`10\\.0\\.0`/g, "`10.2.0`");

  if (!readme.includes("## Stable release")) {
    readme += `

## Stable release

Sentinel Mesh stable version: \`10.2.0\`

\`\`\`bash
npm run release:verify
npm run release:package
\`\`\`
`;
  }

  fs.writeFileSync(readmePath, readme);
}

const changelogPath = path.join(target, "CHANGELOG.md");
const releaseNotes = `# Changelog

## 10.2.0

### Added
- stable release verification
- reproducible production source packaging
- SHA-256 source manifest
- production delivery checklist
- final stable CI workflow
- release artifact generation

### Changed
- normalized stable version to 10.2.0
- completed production delivery workflow

`;

const currentChangelog = fs.existsSync(changelogPath)
  ? fs.readFileSync(changelogPath, "utf8")
  : "";

if (!currentChangelog.includes("## 10.2.0")) {
  fs.writeFileSync(
    changelogPath,
    releaseNotes + currentChangelog
  );
}

console.log("Sentinel Mesh Phase 77 applied successfully.");
console.log("Stable version: 10.2.0");
console.log("Next: npm install");
console.log("Verify: npm run release:verify");
console.log("Package: npm run release:package");
