import {
  createHash,
  randomUUID
} from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  stat,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  BackupBundle,
  BackupManifest,
  DiagnosticReport,
  ReadinessCheck,
  ReadinessReport,
  RestoreResult
} from "./types.js";

export type {
  BackupBundle,
  BackupManifest,
  DiagnosticReport,
  ReadinessCheck,
  ReadinessReport,
  ReadinessStatus,
  RestoreResult
} from "./types.js";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

export async function createBackupBundle(
  dataRoot: string,
  relativeFiles: string[],
  createdBy: string,
  now = new Date()
): Promise<BackupBundle> {
  const payloads: Record<string, string> = {};
  const files: BackupManifest["files"] = [];

  for (const relativePath of [...new Set(relativeFiles)].sort()) {
    const safePath = relativePath.replaceAll("\\", "/");
    if (
      safePath.startsWith("/") ||
      safePath.includes("../") ||
      safePath.includes("..\\")
    ) {
      throw new Error(`Unsafe backup path: ${relativePath}`);
    }

    const absolute = path.join(dataRoot, safePath);

    try {
      const content = await readFile(absolute, "utf8");
      const info = await stat(absolute);

      payloads[safePath] = content;
      files.push({
        relativePath: safePath,
        sizeBytes: info.size,
        sha256: sha256(content)
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }

  const manifestWithoutChecksum = {
    backupId: randomUUID(),
    createdAt: now.toISOString(),
    createdBy,
    files
  };

  const manifest: BackupManifest = {
    ...manifestWithoutChecksum,
    checksum: sha256(canonical(manifestWithoutChecksum))
  };

  return { manifest, payloads };
}

export function verifyBackupBundle(bundle: BackupBundle): boolean {
  const manifestWithoutChecksum = {
    backupId: bundle.manifest.backupId,
    createdAt: bundle.manifest.createdAt,
    createdBy: bundle.manifest.createdBy,
    files: bundle.manifest.files
  };

  if (
    sha256(canonical(manifestWithoutChecksum)) !==
    bundle.manifest.checksum
  ) {
    return false;
  }

  for (const file of bundle.manifest.files) {
    const payload = bundle.payloads[file.relativePath];
    if (payload === undefined || sha256(payload) !== file.sha256) {
      return false;
    }
  }

  return true;
}

export async function restoreBackupBundle(
  dataRoot: string,
  bundle: BackupBundle,
  overwrite: boolean
): Promise<RestoreResult> {
  if (!verifyBackupBundle(bundle)) {
    throw new Error("Backup integrity verification failed");
  }

  const restoredFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of bundle.manifest.files) {
    const relativePath = file.relativePath.replaceAll("\\", "/");
    if (
      relativePath.startsWith("/") ||
      relativePath.includes("../")
    ) {
      throw new Error(`Unsafe restore path: ${relativePath}`);
    }

    const absolute = path.join(dataRoot, relativePath);

    try {
      await access(absolute);
      if (!overwrite) {
        skippedFiles.push(relativePath);
        continue;
      }
    } catch {
      // file does not exist
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bundle.payloads[relativePath], {
      encoding: "utf8",
      mode: 0o600
    });
    restoredFiles.push(relativePath);
  }

  return {
    restoredFiles,
    skippedFiles,
    verified: true
  };
}

export function buildReadinessReport(
  checks: ReadinessCheck[],
  now = new Date()
): ReadinessReport {
  const requiredFailures = checks.filter(
    check => check.required && check.status === "fail"
  );

  const weights: Record<ReadinessCheck["status"], number> = {
    pass: 1,
    warn: 0.5,
    fail: 0
  };

  const score = checks.length === 0
    ? 0
    : Math.round(
        checks.reduce(
          (total, check) => total + weights[check.status],
          0
        ) / checks.length * 100
      );

  return {
    ready: requiredFailures.length === 0,
    score,
    generatedAt: now.toISOString(),
    checks
  };
}

export async function collectDiagnostics(
  dataDirectory: string,
  environmentNames: string[]
): Promise<DiagnosticReport> {
  let writableDataDirectory = true;

  try {
    await mkdir(dataDirectory, { recursive: true });
    const probe = path.join(
      dataDirectory,
      `.probe-${process.pid}-${Date.now()}`
    );
    await writeFile(probe, "ok", { mode: 0o600 });
  } catch {
    writableDataDirectory = false;
  }

  return {
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memoryMb: Math.round(os.totalmem() / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
    writableDataDirectory,
    environment: Object.fromEntries(
      environmentNames.map(name => [
        name,
        Boolean(process.env[name]?.trim())
      ])
    )
  };
}

export function defaultReadinessChecks(input: {
  nodeVersion: string;
  writableDataDirectory: boolean;
  sessionSecretConfigured: boolean;
  productionMode: boolean;
  healthStatus: "healthy" | "degraded" | "critical";
  backupVerified: boolean;
}): ReadinessCheck[] {
  const major = Number(
    input.nodeVersion.replace(/^v/, "").split(".")[0]
  );

  return [
    {
      id: "node-version",
      label: "Node.js runtime",
      status: major >= 20 ? "pass" : "fail",
      required: true,
      message: major >= 20
        ? "Supported Node.js runtime detected"
        : "Node.js 20 or newer is required"
    },
    {
      id: "data-directory",
      label: "Data directory",
      status: input.writableDataDirectory ? "pass" : "fail",
      required: true,
      message: input.writableDataDirectory
        ? "Local data directory is writable"
        : "Local data directory is not writable"
    },
    {
      id: "session-secret",
      label: "Session secret",
      status: input.sessionSecretConfigured ? "pass" : "warn",
      required: input.productionMode,
      message: input.sessionSecretConfigured
        ? "Session secret is configured"
        : "Configure SENTINEL_SESSION_SECRET before production use"
    },
    {
      id: "platform-health",
      label: "Platform health",
      status: input.healthStatus === "healthy"
        ? "pass"
        : input.healthStatus === "degraded"
          ? "warn"
          : "fail",
      required: true,
      message: `Platform health is ${input.healthStatus}`
    },
    {
      id: "verified-backup",
      label: "Verified backup",
      status: input.backupVerified ? "pass" : "warn",
      required: false,
      message: input.backupVerified
        ? "A verified local backup is available"
        : "Create and verify a backup before release"
    }
  ];
}
