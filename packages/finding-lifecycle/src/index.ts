import type {
  FindingRecord,
  FindingStatus,
  FindingTransition,
  SlaPolicy
} from "./types.js";

export type {
  FindingRecord,
  FindingSeverity,
  FindingStatus,
  FindingTransition,
  SlaPolicy
} from "./types.js";

const allowedTransitions: Record<FindingStatus, FindingStatus[]> = {
  open:["triaged","false-positive","risk-accepted"],
  triaged:["in-progress","false-positive","risk-accepted"],
  "in-progress":["resolved","risk-accepted"],
  resolved:["open"],
  "false-positive":["open"],
  "risk-accepted":["open","in-progress","resolved"]
};

export const defaultSlaPolicy: SlaPolicy = {
  criticalHours:24,
  highHours:72,
  mediumHours:168,
  lowHours:336
};

export function canTransition(from: FindingStatus, to: FindingStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionFinding(
  finding: FindingRecord,
  transition: FindingTransition
): FindingRecord {
  if (finding.status !== transition.from) {
    throw new Error("FINDING_STATE_MISMATCH");
  }

  if (!canTransition(transition.from, transition.to)) {
    throw new Error("INVALID_FINDING_TRANSITION");
  }

  if (
    (transition.to === "false-positive" || transition.to === "risk-accepted") &&
    !transition.justification?.trim()
  ) {
    throw new Error("JUSTIFICATION_REQUIRED");
  }

  return {
    ...finding,
    status:transition.to,
    justification:transition.justification ?? finding.justification,
    updatedAt:transition.occurredAt
  };
}

export function calculateDueAt(
  severity: FindingRecord["severity"],
  createdAt: string,
  policy: SlaPolicy = defaultSlaPolicy
): string | undefined {
  if (severity === "info") return undefined;

  const hours = {
    critical:policy.criticalHours,
    high:policy.highHours,
    medium:policy.mediumHours,
    low:policy.lowHours
  }[severity];

  return new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isFindingOverdue(
  finding: FindingRecord,
  now = new Date()
): boolean {
  if (!finding.dueAt || finding.status === "resolved" || finding.status === "false-positive") {
    return false;
  }

  if (
    finding.status === "risk-accepted" &&
    finding.riskAcceptedUntil &&
    new Date(finding.riskAcceptedUntil) > now
  ) {
    return false;
  }

  return new Date(finding.dueAt) < now;
}
