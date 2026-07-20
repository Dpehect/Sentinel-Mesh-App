export type FleetAgentStatus =
  | "healthy"
  | "degraded"
  | "critical"
  | "offline"
  | "quarantined";

export type FleetOperation =
  | "policy-rollout"
  | "agent-update"
  | "certificate-rotation"
  | "runtime-reattestation"
  | "health-remediation";

export interface FleetAgent {
  agentId: string;
  region: string;
  status: FleetAgentStatus;
  healthScore: number;
  currentVersion?: string;
  targetVersion?: string;
  labels?: string[];
  lastSeenAt?: string;
}

export interface FleetPolicy {
  maximumConcurrentAgents: number;
  maximumConcurrentPerRegion: number;
  canarySize: number;
  minimumHealthyScore: number;
  failureRateStopThreshold: number;
  requireApprovalForCriticalAgents: boolean;
  includeOfflineAgents: boolean;
  maintenanceWindow?: {
    startHourUtc: number;
    endHourUtc: number;
  };
}

export interface FleetOperationHistory {
  agentId: string;
  operation: FleetOperation;
  outcome: "succeeded" | "failed" | "cancelled";
  executedAt: string;
}

export interface FleetPlanItem {
  agentId: string;
  region: string;
  operation: FleetOperation;
  wave: number;
  canary: boolean;
  requiresApproval: boolean;
  reason: string;
}

export interface FleetOrchestrationPlan {
  decision: "proceed" | "approval-required" | "paused" | "none";
  reason: string;
  waves: FleetPlanItem[][];
  excludedAgents: Array<{
    agentId: string;
    reason: string;
  }>;
  observedFailureRate: number;
}
