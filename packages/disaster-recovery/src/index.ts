import {createHash} from "node:crypto";
import type {
  BackupManifest,
  RecoveryEvaluation,
  RecoveryTarget
} from "./types.js";

export type {
  BackupManifest,
  RecoveryEvaluation,
  RecoveryTarget
} from "./types.js";

function checksum(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createBackupManifest(
  input: Omit<BackupManifest, "id" | "totalBytes" | "checksum">
): BackupManifest {
  const files = [...input.files].sort((a, b) => a.path.localeCompare(b.path));
  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
  const canonical = JSON.stringify({
    createdAt:input.createdAt,
    sourceVersion:input.sourceVersion,
    files,
    totalBytes
  });
  const manifestChecksum = checksum(canonical);

  return {
    ...input,
    files,
    totalBytes,
    checksum:manifestChecksum,
    id:`backup_${manifestChecksum.slice(0, 16)}`
  };
}

export function verifyBackupManifest(manifest: BackupManifest): boolean {
  const rebuilt = createBackupManifest({
    createdAt:manifest.createdAt,
    sourceVersion:manifest.sourceVersion,
    files:manifest.files
  });

  return rebuilt.checksum === manifest.checksum &&
    rebuilt.totalBytes === manifest.totalBytes &&
    rebuilt.id === manifest.id;
}

export function evaluateRecovery(
  backupCreatedAt: string,
  incidentStartedAt: string,
  restoredAt: string,
  target: RecoveryTarget
): RecoveryEvaluation {
  const backupTime = new Date(backupCreatedAt).getTime();
  const incidentTime = new Date(incidentStartedAt).getTime();
  const restoredTime = new Date(restoredAt).getTime();

  const rpoMinutes = Math.max(0, (incidentTime - backupTime) / 60000);
  const rtoMinutes = Math.max(0, (restoredTime - incidentTime) / 60000);

  const rpoMet = rpoMinutes <= target.rpoMinutes;
  const rtoMet = rtoMinutes <= target.rtoMinutes;
  const reasons: string[] = [];

  if (!rpoMet) reasons.push("RPO_TARGET_MISSED");
  if (!rtoMet) reasons.push("RTO_TARGET_MISSED");

  return {
    rpoMet,
    rtoMet,
    recoverable:rpoMet && rtoMet,
    reasons
  };
}
