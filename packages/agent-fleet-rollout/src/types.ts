export type RolloutOperation =
  | "policy-rollout"
  | "agent-update"
  | "certificate-rotation"
  | "runtime-reattestation"
  | "health-remediation";

export type RolloutAction =
  | "start-wave"
  | "pause-rollout"
  | "resume-rollout"
  | "complete-wave"
  | "rollback-wave"
  | "complete-rollout";

export type RolloutState =
  | "pending"
  | "running"
  | "paused"
  | "rolling-back"
  | "completed"
  | "failed";

export interface PlannedWaveAgent {
  agentId: string;
  region: string;
  requiresApproval: boolean;
}

export interface PlannedWave {
  wave: number;
  agents: PlannedWaveAgent[];
}

export interface RolloutPlan {
  rolloutId: string;
  operation: RolloutOperation;
  waves: PlannedWave[];
}

export interface RolloutEvent {
  eventId: string;
  rolloutId: string;
  wave: number;
  action: RolloutAction;
  occurredAt: string;
  actor: string;
  idempotencyKey: string;
  details?: Record<string, string | number | boolean>;
}

export interface AgentExecutionResult {
  agentId: string;
  outcome: "succeeded" | "failed" | "skipped";
  reason?: string;
}

export interface WaveExecutionReport {
  rolloutId: string;
  wave: number;
  results: AgentExecutionResult[];
  observedAt: string;
}

export interface RolloutSafetyPolicy {
  maximumFailureRate: number;
  minimumSuccessCountForCanary: number;
  requireApprovalBeforeNextWave: boolean;
  automaticRollback: boolean;
}

export interface RolloutDecision {
  state: RolloutState;
  nextAction:
    | "start-first-wave"
    | "await-wave-results"
    | "await-approval"
    | "start-next-wave"
    | "rollback-current-wave"
    | "complete-rollout"
    | "none";
  reason: string;
  activeWave: number | null;
  completedWaves: number[];
  failureRate: number;
  duplicateEvents: string[];
}
