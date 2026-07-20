import type {
  ServiceCheck,
  ServiceHealth,
  SloEvaluation,
  SloMeasurement,
  SloTarget
} from "./types.js";

export type {
  ServiceCheck,
  ServiceHealth,
  ServiceStatus,
  SloEvaluation,
  SloMeasurement,
  SloTarget
} from "./types.js";

export const defaultSloTarget: SloTarget = {
  availabilityPercent:99.9,
  maxP95LatencyMs:1500,
  maxErrorRatePercent:1
};

export function aggregateServiceHealth(checks: ServiceCheck[]): ServiceHealth {
  const status = checks.some(check => check.status === "unhealthy")
    ? "unhealthy"
    : checks.some(check => check.status === "degraded")
      ? "degraded"
      : "healthy";

  return {status, checks};
}

export function evaluateSlo(
  measurement: SloMeasurement,
  target: SloTarget = defaultSloTarget
): SloEvaluation {
  const violations: string[] = [];

  if (measurement.availabilityPercent < target.availabilityPercent) {
    violations.push("AVAILABILITY_SLO_VIOLATED");
  }

  if (measurement.p95LatencyMs > target.maxP95LatencyMs) {
    violations.push("LATENCY_SLO_VIOLATED");
  }

  if (measurement.errorRatePercent > target.maxErrorRatePercent) {
    violations.push("ERROR_RATE_SLO_VIOLATED");
  }

  const allowedDowntime = Math.max(0.0001, 100 - target.availabilityPercent);
  const consumedDowntime = Math.max(0, 100 - measurement.availabilityPercent);
  const remaining = 100 - (consumedDowntime / allowedDowntime) * 100;

  return {
    met:violations.length === 0,
    violations,
    errorBudgetRemainingPercent:Math.max(0, Math.min(100, Math.round(remaining)))
  };
}

export function shouldAlert(
  health: ServiceHealth,
  slo: SloEvaluation
): boolean {
  return health.status === "unhealthy" || !slo.met;
}

export function renderHealthSummary(
  health: ServiceHealth,
  slo: SloEvaluation
): string {
  return [
    `Service status: ${health.status}`,
    `SLO met: ${slo.met ? "yes" : "no"}`,
    `Error budget remaining: ${slo.errorBudgetRemainingPercent}%`,
    `Violations: ${slo.violations.join(", ") || "None"}`
  ].join("\n");
}
