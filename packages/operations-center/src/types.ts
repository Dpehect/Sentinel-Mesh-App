export type OperationsRole =
  | "owner"
  | "security-admin"
  | "analyst"
  | "operator"
  | "viewer";

export type IncidentSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type IncidentStatus =
  | "open"
  | "investigating"
  | "contained"
  | "resolved";

export interface TeamMember {
  memberId: string;
  email: string;
  displayName: string;
  role: OperationsRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityIncident {
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string;
  description: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
}

export interface NotificationRule {
  ruleId: string;
  name: string;
  enabled: boolean;
  severities: IncidentSeverity[];
  channels: Array<"in-app" | "email" | "webhook">;
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface HealthSnapshot {
  component: string;
  status: "healthy" | "degraded" | "critical";
  latencyMs: number;
  checkedAt: string;
  details?: string;
}

export interface OperationsSnapshot {
  members: TeamMember[];
  incidents: SecurityIncident[];
  rules: NotificationRule[];
  health: HealthSnapshot[];
}

export interface OperationsStore {
  read(): Promise<OperationsSnapshot>;
  write(snapshot: OperationsSnapshot): Promise<void>;
}
