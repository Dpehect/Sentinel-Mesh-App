export type RolloutControlState =
  | "draft"
  | "awaiting-approval"
  | "approved"
  | "running"
  | "paused"
  | "rolling-back"
  | "completed"
  | "failed";

export type ApprovalDecision = "approve" | "reject";

export interface RolloutWaveSummary {
  wave: number;
  plannedAgents: number;
  succeededAgents: number;
  failedAgents: number;
  skippedAgents: number;
  state: "pending" | "running" | "completed" | "failed";
}

export interface RolloutControlRecord {
  rolloutId: string;
  operation: string;
  state: RolloutControlState;
  activeWave: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  waves: RolloutWaveSummary[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  checkpointId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface RolloutControlEvent {
  eventId: string;
  rolloutId: string;
  type:
    | "created"
    | "approval-requested"
    | "approved"
    | "rejected"
    | "started"
    | "paused"
    | "resumed"
    | "wave-updated"
    | "checkpoint-created"
    | "rollback-requested"
    | "recovered"
    | "completed"
    | "failed";
  actor: string;
  occurredAt: string;
  expectedVersion: number;
  details?: Record<string, string | number | boolean>;
}

export interface RecoveryCheckpoint {
  checkpointId: string;
  rolloutId: string;
  createdAt: string;
  createdBy: string;
  rolloutVersion: number;
  snapshot: RolloutControlRecord;
  checksum: string;
}

export interface ApprovalRequest {
  rolloutId: string;
  actor: string;
  decision: ApprovalDecision;
  expectedVersion: number;
  reason?: string;
}

export interface StoreSnapshot {
  records: RolloutControlRecord[];
  events: RolloutControlEvent[];
  checkpoints: RecoveryCheckpoint[];
}

export interface RolloutStore {
  read(): Promise<StoreSnapshot>;
  write(snapshot: StoreSnapshot): Promise<void>;
}
