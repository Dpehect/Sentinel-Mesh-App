export type FindingStatus =
  | "open"
  | "triaged"
  | "in-progress"
  | "resolved"
  | "false-positive"
  | "risk-accepted";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface FindingRecord {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  ownerId?: string;
  dueAt?: string;
  riskAcceptedUntil?: string;
  justification?: string;
  updatedAt: string;
}

export interface SlaPolicy {
  criticalHours: number;
  highHours: number;
  mediumHours: number;
  lowHours: number;
}

export interface FindingTransition {
  from: FindingStatus;
  to: FindingStatus;
  actorId: string;
  occurredAt: string;
  justification?: string;
}
