export type AuditDecision =
  | "accept"
  | "reject"
  | "pause-rollout";

export interface RolloutAuditInput {
  rolloutId: string;
  wave: number;
  action: string;
  actor: string;
  occurredAt: string;
  idempotencyKey: string;
  details?: Record<string, string | number | boolean>;
}

export interface RolloutAuditRecord extends RolloutAuditInput {
  sequence: number;
  previousHash: string;
  payloadHash: string;
  recordHash: string;
  signature: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  decision: AuditDecision;
  verifiedRecords: number;
  firstInvalidSequence: number | null;
  reason: string;
}

export interface AuditChainPolicy {
  requireStrictSequence: boolean;
  rejectDuplicateIdempotencyKeys: boolean;
  pauseOnIntegrityFailure: boolean;
  maximumClockSkewSeconds: number;
}
