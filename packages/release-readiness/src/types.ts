export type ReadinessStatus = "pass" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  required: boolean;
  message: string;
}

export interface ReadinessReport {
  ready: boolean;
  score: number;
  generatedAt: string;
  checks: ReadinessCheck[];
}

export interface BackupManifest {
  backupId: string;
  createdAt: string;
  createdBy: string;
  files: Array<{
    relativePath: string;
    sizeBytes: number;
    sha256: string;
  }>;
  checksum: string;
}

export interface BackupBundle {
  manifest: BackupManifest;
  payloads: Record<string, string>;
}

export interface RestoreResult {
  restoredFiles: string[];
  skippedFiles: string[];
  verified: boolean;
}

export interface DiagnosticReport {
  generatedAt: string;
  nodeVersion: string;
  platform: string;
  architecture: string;
  memoryMb: number;
  uptimeSeconds: number;
  writableDataDirectory: boolean;
  environment: Record<string, boolean>;
}
