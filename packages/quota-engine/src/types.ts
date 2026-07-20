export interface TenantQuotaPolicy {
  maxConcurrentScans: number;
  maxScansPerHour: number;
  maxRepositoryBytesPerScan: number;
  maxMonthlyScanMinutes: number;
}

export interface TenantUsageSnapshot {
  activeScans: number;
  scansStartedInCurrentHour: number;
  repositoryBytesRequested: number;
  monthlyScanMinutesUsed: number;
}

export interface QuotaDecision {
  allowed: boolean;
  reason?:
    | "CONCURRENCY_LIMIT"
    | "HOURLY_SCAN_LIMIT"
    | "REPOSITORY_SIZE_LIMIT"
    | "MONTHLY_SCAN_BUDGET";
  retryAfterSeconds?: number;
}
