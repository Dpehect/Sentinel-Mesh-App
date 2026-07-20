import {controlCatalog} from "./catalog.js";
import type {
  ComplianceEvidence,
  ComplianceResult,
  Framework
} from "./types.js";

export type {
  ComplianceControl,
  ComplianceEvidence,
  ComplianceResult,
  Framework
} from "./types.js";

export {controlCatalog};

export function evaluateCompliance(
  framework: Framework,
  evidence: ComplianceEvidence[]
): ComplianceResult {
  const controls = controlCatalog.filter(control => control.framework === framework);
  const evidenceTypes = new Set(evidence.map(item => item.type));
  const satisfied = controls.filter(control =>
    control.requiredEvidenceTypes.every(type => evidenceTypes.has(type))
  );

  const matchedEvidenceIds = evidence
    .filter(item => item.controlIds.some(id => controls.some(control => control.id === id)))
    .map(item => item.id);

  return {
    framework,
    totalControls:controls.length,
    satisfiedControls:satisfied.length,
    coveragePercent:controls.length
      ? Math.round((satisfied.length / controls.length) * 100)
      : 0,
    missingControls:controls
      .filter(control => !satisfied.includes(control))
      .map(control => control.id),
    matchedEvidenceIds:[...new Set(matchedEvidenceIds)]
  };
}

export function createComplianceSummary(result: ComplianceResult): string {
  return [
    `${result.framework} coverage: ${result.coveragePercent}%`,
    `Satisfied controls: ${result.satisfiedControls}/${result.totalControls}`,
    `Missing controls: ${result.missingControls.join(", ") || "None"}`
  ].join("\n");
}
