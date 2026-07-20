export interface ScanLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxPathLength: number;
  timeoutMs: number;
  allowedExtensions: string[];
}

export interface ScanCandidate {
  path: string;
  sizeBytes: number;
  isSymbolicLink?: boolean;
}

export interface ScanGuardResult {
  accepted: ScanCandidate[];
  rejected: Array<{
    candidate: ScanCandidate;
    reason: string;
  }>;
  totalBytes: number;
}
