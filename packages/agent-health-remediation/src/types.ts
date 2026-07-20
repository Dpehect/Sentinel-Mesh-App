export type RemediationAction =
  | "refresh-policy"
  | "rotate-certificate"
  | "schedule-update"
  | "restart-telemetry"
  | "reduce-workload"
  | "collect-triage"
  | "reattest-runtime"
  | "isolate-network";

export interface AgentHealthSnapshot {
  agentId: string;
  score: number;
  status: "healthy" | "degraded" | "critical";
  recommendations: string[];
  criticalFindings: string[];
  observedAt: string;
}

export interface RemediationHistoryItem {
  agentId: string;
  action: RemediationAction;
  executedAt: string;
  success: boolean;
}

export interface RemediationPolicy {
  automaticActions: RemediationAction[];
  approvalRequiredActions: RemediationAction[];
  cooldownMinutes: number;
  maximumActionsPerAgent: number;
  containmentScoreThreshold: number;
}

export interface RemediationPlanItem {
  agentId: string;
  action: RemediationAction;
  priority: number;
  requiresApproval: boolean;
  reason: string;
}

export interface AgentRemediationPlan {
  actions: RemediationPlanItem[];
  deferredActions: RemediationPlanItem[];
  skippedAgents: string[];
  decision: "none" | "remediate" | "contain";
}
