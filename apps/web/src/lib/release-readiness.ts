import path from "node:path";
import {
  buildReadinessReport,
  collectDiagnostics,
  createBackupBundle,
  defaultReadinessChecks,
  restoreBackupBundle,
  verifyBackupBundle,
  type BackupBundle
} from "@sentinel/release-readiness";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

const dataRoot =
  process.env.SENTINEL_DATA_ROOT ??
  path.join(process.cwd(), ".sentinel-data");

const backupFile = path.join(dataRoot, "latest-backup.json");

export async function getSystemDiagnostics() {
  return collectDiagnostics(dataRoot, [
    "SENTINEL_SESSION_SECRET",
    "DATABASE_URL",
    "REDIS_URL",
    "GITHUB_APP_ID",
    "GITHUB_WEBHOOK_SECRET"
  ]);
}

export async function createSystemBackup(
  actor = "local-owner"
): Promise<BackupBundle> {
  const bundle = await createBackupBundle(
    dataRoot,
    ["rollouts.json", "operations.json"],
    actor
  );

  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(dataRoot, { recursive: true });
  await writeFile(
    backupFile,
    JSON.stringify(bundle, null, 2) + "\n",
    { mode: 0o600 }
  );

  return bundle;
}

export async function loadLatestBackup(): Promise<BackupBundle | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(backupFile, "utf8");
    return JSON.parse(raw) as BackupBundle;
  } catch {
    return null;
  }
}

export async function restoreLatestBackup(overwrite = false) {
  const bundle = await loadLatestBackup();
  if (!bundle) throw new Error("No local backup is available");
  return restoreBackupBundle(dataRoot, bundle, overwrite);
}

export async function getReadinessReport() {
  await ensureOperationsDemo();
  const diagnostics = await getSystemDiagnostics();
  const health = await operationsCenter.healthSummary();
  const backup = await loadLatestBackup();

  const checks = defaultReadinessChecks({
    nodeVersion: diagnostics.nodeVersion,
    writableDataDirectory: diagnostics.writableDataDirectory,
    sessionSecretConfigured:
      diagnostics.environment.SENTINEL_SESSION_SECRET,
    productionMode: process.env.NODE_ENV === "production",
    healthStatus: health.overall,
    backupVerified: backup ? verifyBackupBundle(backup) : false
  });

  return buildReadinessReport(checks);
}
