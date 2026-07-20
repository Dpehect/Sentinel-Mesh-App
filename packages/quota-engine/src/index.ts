import type {
  QuotaDecision,
  TenantQuotaPolicy,
  TenantUsageSnapshot
} from "./types.js";

export type {
  QuotaDecision,
  TenantQuotaPolicy,
  TenantUsageSnapshot
} from "./types.js";

export const defaultTenantQuotaPolicy: TenantQuotaPolicy = {
  maxConcurrentScans: 4,
  maxScansPerHour: 30,
  maxRepositoryBytesPerScan: 250 * 1024 * 1024,
  maxMonthlyScanMinutes: 10000
};

export function evaluateTenantQuota(
  usage: TenantUsageSnapshot,
  policy: TenantQuotaPolicy = defaultTenantQuotaPolicy
): QuotaDecision {
  if (usage.activeScans >= policy.maxConcurrentScans) {
    return {
      allowed:false,
      reason:"CONCURRENCY_LIMIT",
      retryAfterSeconds:60
    };
  }

  if (usage.scansStartedInCurrentHour >= policy.maxScansPerHour) {
    return {
      allowed:false,
      reason:"HOURLY_SCAN_LIMIT",
      retryAfterSeconds:3600
    };
  }

  if (usage.repositoryBytesRequested > policy.maxRepositoryBytesPerScan) {
    return {
      allowed:false,
      reason:"REPOSITORY_SIZE_LIMIT"
    };
  }

  if (usage.monthlyScanMinutesUsed >= policy.maxMonthlyScanMinutes) {
    return {
      allowed:false,
      reason:"MONTHLY_SCAN_BUDGET"
    };
  }

  return {allowed:true};
}

export function calculateUsagePercent(
  used: number,
  limit: number
): number {
  if (limit <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

export function shouldThrottleTenant(
  usagePercent: number,
  threshold = 85
): boolean {
  return usagePercent >= threshold;
}
