#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = process.cwd();
const packagePath = path.join(targetRoot, "package.json");

if (!fs.existsSync(packagePath)) {
  console.error("ERROR: Run this installer from the Sentinel-Mesh-App repository root.");
  process.exit(1);
}

function copyRecursive(source, target) {
  if (fs.statSync(source).isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

const copyPaths = [
  "packages/final-integration",
  "apps/web/src/lib/navigation.ts",
  "apps/web/src/lib/final-status.ts",
  "apps/web/src/components/final-console-navigation.tsx",
  "apps/web/src/app/(console)/command-center",
  "apps/web/src/app/api/final",
  "docs/PHASE-73-FINAL-INTEGRATION.md",
  "scripts/verify-final-layout.mjs",
  "scripts/final-verify.mjs",
  ".github/workflows/final-release.yml"
];

for (const relative of copyPaths) {
  copyRecursive(
    path.join(here, relative),
    path.join(targetRoot, relative)
  );
}

const legacyEntries = [
  "app",
  "data",
  "START-MAC.command",
  "START-WINDOWS.bat",
  "STOP-MAC.command"
];

const archiveRoot = path.join(
  targetRoot,
  "archive",
  "legacy-phase-10-static-demo"
);

const detectedLegacy =
  fs.existsSync(path.join(targetRoot, "app")) &&
  fs.existsSync(path.join(targetRoot, "data"));

if (detectedLegacy) {
  fs.mkdirSync(archiveRoot, { recursive: true });

  for (const entry of legacyEntries) {
    const source = path.join(targetRoot, entry);
    if (!fs.existsSync(source)) continue;

    const target = path.join(archiveRoot, entry);
    if (fs.existsSync(target)) {
      const timestamped = `${target}.${Date.now()}`;
      fs.renameSync(source, timestamped);
    } else {
      fs.renameSync(source, target);
    }
  }

  console.log("Legacy static Phase 10 demo archived.");
}

const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
rootPackage.version = "10.0.0";
const scripts = rootPackage.scripts ?? {};
const workspace = "@sentinel/final-integration";

const buildCurrent = scripts["build:packages"] ?? "";
if (!buildCurrent.includes(workspace)) {
  scripts["build:packages"] = buildCurrent
    ? `${buildCurrent} && npm run build -w ${workspace}`
    : `npm run build -w ${workspace}`;
}

scripts["test:final-integration"] = `npm run test -w ${workspace}`;
scripts["typecheck:final-integration"] =
  `npm run typecheck -w ${workspace}`;
scripts["verify:final-layout"] = "node scripts/verify-final-layout.mjs";
scripts["final:verify"] = "node scripts/final-verify.mjs";

function appendRunner(scriptName, childScript) {
  const current = scripts[scriptName] ?? "";
  if (!current.split(/\s+/).includes(childScript)) {
    scripts[scriptName] = current
      ? `${current} ${childScript}`
      : `npm-run-all ${childScript}`;
  }
}

appendRunner("test", "test:final-integration");
appendRunner("typecheck", "typecheck:final-integration");

rootPackage.scripts = scripts;
fs.writeFileSync(
  packagePath,
  JSON.stringify(rootPackage, null, 2) + "\n"
);

const webPackagePath = path.join(targetRoot, "apps/web/package.json");
if (fs.existsSync(webPackagePath)) {
  const webPackage = JSON.parse(
    fs.readFileSync(webPackagePath, "utf8")
  );
  webPackage.dependencies = webPackage.dependencies ?? {};
  webPackage.dependencies[workspace] = "workspace:*";
  fs.writeFileSync(
    webPackagePath,
    JSON.stringify(webPackage, null, 2) + "\n"
  );
}

const cssSource = fs.readFileSync(
  path.join(here, "apps/web/src/app/phase-73-final.css"),
  "utf8"
);
const globalsPath = path.join(
  targetRoot,
  "apps/web/src/app/globals.css"
);
if (fs.existsSync(globalsPath)) {
  const currentCss = fs.readFileSync(globalsPath, "utf8");
  if (!currentCss.includes("Phase 73 final integration")) {
    fs.appendFileSync(globalsPath, `\n\n${cssSource}\n`);
  }
}

const README = fs.readFileSync(
  path.join(here, "README.final.md"),
  "utf8"
);
fs.writeFileSync(path.join(targetRoot, "README.md"), README);

const changelog = fs.readFileSync(
  path.join(here, "CHANGELOG.final.md"),
  "utf8"
);
const changelogPath = path.join(targetRoot, "CHANGELOG.md");
const currentChangelog = fs.existsSync(changelogPath)
  ? fs.readFileSync(changelogPath, "utf8")
  : "";

if (!currentChangelog.includes("## 10.0.0")) {
  fs.writeFileSync(
    changelogPath,
    changelog + "\n" + currentChangelog
  );
}

const consoleLayoutPath = path.join(
  targetRoot,
  "apps/web/src/app/(console)/layout.tsx"
);

if (fs.existsSync(consoleLayoutPath)) {
  const currentLayout = fs.readFileSync(consoleLayoutPath, "utf8");
  if (!currentLayout.includes("FinalConsoleNavigation")) {
    const backupPath = `${consoleLayoutPath}.pre-phase-73`;
    fs.copyFileSync(consoleLayoutPath, backupPath);

    fs.writeFileSync(
      consoleLayoutPath,
`import type { ReactNode } from "react";
import { FinalConsoleNavigation } from "@/components/final-console-navigation";

export default function ConsoleLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="console-layout">
      <FinalConsoleNavigation />
      <div className="console-content">{children}</div>
    </div>
  );
}
`
    );
  }
}

console.log("Sentinel Mesh Phase 73 applied successfully.");
console.log("Final version: 10.0.0");
console.log("Next: npm install");
console.log("Verify: npm run final:verify");
console.log("Open: http://localhost:3000/command-center");
