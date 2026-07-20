import {createHash} from "node:crypto";
import type {
  ComplianceControl,
  ComplianceDrift,
  ComplianceFramework,
  ComplianceReport,
  ComplianceSnapshot,
  ControlObservation,
  ControlStatus
} from "./types.js";

export type {
  ComplianceControl,
  ComplianceDrift,
  ComplianceFramework,
  ComplianceReport,
  ComplianceSnapshot,
  ControlObservation,
  ControlStatus
} from "./types.js";

export function createComplianceSnapshot(
  tenantId: string,
  observations: ControlObservation[],
  createdAt = new Date().toISOString()
): ComplianceSnapshot {
  const canonical = JSON.stringify({
    tenantId,
    createdAt,
    observations:[...observations].sort((a, b) =>
      a.controlId.localeCompare(b.controlId)
    )
  });

  const checksum = createHash("sha256").update(canonical).digest("hex");

  return {
    id:`compliance_${checksum.slice(0, 16)}`,
    tenantId,
    createdAt,
    observations
  };
}

function driftSeverity(
  previous: ControlStatus,
  current: ControlStatus
): ComplianceDrift["severity"] {
  if (previous === "pass" && current === "fail") return "high";
  if (current === "fail") return "medium";
  return "low";
}

export function detectComplianceDrift(
  previous: ComplianceSnapshot | undefined,
  current: ComplianceSnapshot
): ComplianceDrift[] {
  if (!previous) return [];

  const previousByControl = new Map(
    previous.observations.map(item => [item.controlId, item])
  );

  return current.observations.flatMap(observation => {
    const before = previousByControl.get(observation.controlId);
    if (!before || before.status === observation.status) return [];

    return [{
      controlId:observation.controlId,
      previousStatus:before.status,
      currentStatus:observation.status,
      severity:driftSeverity(before.status, observation.status)
    }];
  });
}

export function evaluateContinuousCompliance(
  framework: ComplianceFramework,
  controls: ComplianceControl[],
  current: ComplianceSnapshot,
  previous?: ComplianceSnapshot
): ComplianceReport {
  const applicableControls = controls.filter(control =>
    control.framework === framework
  );
  const observationByControl = new Map(
    current.observations.map(item => [item.controlId, item])
  );

  let passed = 0;
  let failed = 0;
  let warnings = 0;
  const missingEvidenceControls: string[] = [];

  for (const control of applicableControls) {
    const observation = observationByControl.get(control.id);

    if (!observation) {
      if (control.required) {
        failed += 1;
        missingEvidenceControls.push(control.id);
      }
      continue;
    }

    if (observation.status === "pass") passed += 1;
    if (observation.status === "fail") failed += 1;
    if (observation.status === "warning") warnings += 1;

    if (
      control.required &&
      observation.status !== "not-applicable" &&
      observation.evidenceIds.length === 0
    ) {
      missingEvidenceControls.push(control.id);
    }
  }

  const denominator = Math.max(
    1,
    passed + failed + warnings
  );
  const score = Math.max(0, Math.min(100, Math.round(
    ((passed + warnings * 0.5) / denominator) * 100
  )));

  const drift = detectComplianceDrift(previous, current);
  const highDrift = drift.some(item => item.severity === "high");

  return {
    framework,
    score,
    passed,
    failed,
    warnings,
    missingEvidenceControls:[...new Set(missingEvidenceControls)],
    drift,
    auditReady:
      failed === 0 &&
      missingEvidenceControls.length === 0 &&
      !highDrift
  };
}

export function createComplianceSummary(
  report: ComplianceReport
): string {
  return [
    `Framework: ${report.framework}`,
    `Compliance score: ${report.score}/100`,
    `Passed: ${report.passed}`,
    `Failed: ${report.failed}`,
    `Warnings: ${report.warnings}`,
    `Audit ready: ${report.auditReady ? "yes" : "no"}`
  ].join("\n");
}
