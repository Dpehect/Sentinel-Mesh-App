export type CaseSeverity = "critical" | "high" | "medium" | "low";
export type CaseStatus = "open" | "triage" | "investigating" | "contained" | "resolved" | "closed";
export type TaskStatus = "todo" | "in-progress" | "blocked" | "done";

export interface SecurityCaseTask {
  id: string;
  title: string;
  ownerId?: string;
  status: TaskStatus;
  dueAt?: string;
  evidenceIds: string[];
}

export interface SecurityCase {
  id: string;
  tenantId: string;
  title: string;
  severity: CaseSeverity;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  incidentIds: string[];
  findingIds: string[];
  evidenceIds: string[];
  tasks: SecurityCaseTask[];
}

export interface CaseSla {
  acknowledgeMinutes: number;
  resolveMinutes: number;
}

export interface CaseEvaluation {
  overdue: boolean;
  unassigned: boolean;
  blockedTasks: string[];
  overdueTasks: string[];
  completionPercent: number;
  escalationRequired: boolean;
}
