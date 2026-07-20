import {
  buildFinalProductStatus,
  finalCapabilityCatalog,
  mergeChecks,
  type FinalCheck
} from "@sentinel/final-integration";
import { getReadinessReport } from "@/lib/release-readiness";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";
import {
  ensureDemoRollout,
  rolloutControlPlane
} from "@/lib/rollout-control";

export async function getFinalStatus() {
  await Promise.all([
    ensureOperationsDemo(),
    ensureDemoRollout()
  ]);

  const [readiness, health, operations, rollouts] =
    await Promise.all([
      getReadinessReport(),
      operationsCenter.healthSummary(),
      operationsCenter.overview(),
      rolloutControlPlane.list()
    ]);

  const integrationChecks: FinalCheck[] = [
    {
      id: "release-readiness",
      label: "Release readiness",
      status: readiness.ready ? "pass" : "fail",
      category: "release",
      message: readiness.ready
        ? `Release checks passed with score ${readiness.score}`
        : "One or more required release checks failed",
      blocking: true
    },
    {
      id: "operations-health",
      label: "Operations health",
      status: health.overall === "healthy"
        ? "pass"
        : health.overall === "degraded"
          ? "warn"
          : "fail",
      category: "operations",
      message: `Operations health is ${health.overall}`,
      blocking: health.overall === "critical"
    },
    {
      id: "operations-data",
      label: "Operations data",
      status: operations.members.length > 0 ? "pass" : "warn",
      category: "operations",
      message: `${operations.members.length} members and ${operations.incidents.length} incidents`,
      blocking: false
    },
    {
      id: "rollout-control",
      label: "Rollout control",
      status: rollouts.length > 0 ? "pass" : "warn",
      category: "runtime",
      message: `${rollouts.length} rollout records available`,
      blocking: false
    }
  ];

  const readinessChecks: FinalCheck[] = readiness.checks.map(check => ({
    id: `readiness-${check.id}`,
    label: check.label,
    status: check.status,
    category: check.id === "session-secret"
      ? "security"
      : "release",
    message: check.message,
    blocking: check.required
  }));

  return buildFinalProductStatus(
    "10.0.0",
    mergeChecks(integrationChecks, readinessChecks),
    finalCapabilityCatalog()
  );
}
