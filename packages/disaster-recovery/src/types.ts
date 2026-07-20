export interface BackupManifest {
  id: string;
  createdAt: string;
  sourceVersion: string;
  files: Array<{
    path: string;
    sizeBytes: number;
    checksum: string;
  }>;
  totalBytes: number;
  checksum: string;
}

export interface RecoveryTarget {
  rpoMinutes: number;
  rtoMinutes: number;
}

export interface RecoveryEvaluation {
  rpoMet: boolean;
  rtoMet: boolean;
  recoverable: boolean;
  reasons: string[];
}
