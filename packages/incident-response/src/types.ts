export type IncidentSeverity = "sev-1" | "sev-2" | "sev-3" | "sev-4";
export type IncidentStatus =
  | "declared"
  | "investigating"
  | "contained"
  | "eradicated"
  | "recovered"
  | "closed";

export interface SecurityIncident {
  id: string;
  tenantId: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  declaredAt: string;
  acknowledgedAt?: string;
  containedAt?: string;
  recoveredAt?: string;
  ownerId?: string;
}

export interface IncidentSla {
  acknowledgeMinutes: number;
  containMinutes: number;
  recoverMinutes: number;
}

export interface IncidentEvaluation {
  acknowledgementMet: boolean;
  containmentMet: boolean;
  recoveryMet: boolean;
  overdueActions: string[];
}
