export type ServiceStatus = "healthy" | "degraded" | "unhealthy";

export interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  checkedAt: string;
  message?: string;
}

export interface ServiceHealth {
  status: ServiceStatus;
  checks: ServiceCheck[];
}

export interface SloTarget {
  availabilityPercent: number;
  maxP95LatencyMs: number;
  maxErrorRatePercent: number;
}

export interface SloMeasurement {
  availabilityPercent: number;
  p95LatencyMs: number;
  errorRatePercent: number;
}

export interface SloEvaluation {
  met: boolean;
  violations: string[];
  errorBudgetRemainingPercent: number;
}
