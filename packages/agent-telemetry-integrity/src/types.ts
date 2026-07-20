export interface TelemetryEnvelope {
  id: string;
  tenantId: string;
  agentId: string;
  sequence: number;
  timestamp: string;
  payloadHash: string;
  previousEnvelopeHash?: string;
  envelopeHash: string;
  nonce: string;
}

export interface AgentTelemetryState {
  tenantId: string;
  agentId: string;
  lastSequence: number;
  lastEnvelopeHash?: string;
  seenNonces: string[];
  lastTimestamp?: string;
}

export interface TelemetryIntegrityPolicy {
  maxClockSkewSeconds: number;
  maxSequenceGap: number;
}

export interface TelemetryIntegrityFinding {
  envelopeId: string;
  code:
    | "TENANT_MISMATCH"
    | "AGENT_MISMATCH"
    | "SEQUENCE_REPLAY"
    | "SEQUENCE_GAP"
    | "NONCE_REPLAY"
    | "HASH_CHAIN_BROKEN"
    | "INVALID_HASH"
    | "CLOCK_SKEW";
}

export interface TelemetryIntegrityReport {
  acceptedEnvelopeIds: string[];
  rejectedEnvelopeIds: string[];
  findings: TelemetryIntegrityFinding[];
  nextState: AgentTelemetryState;
  decision: "accept" | "review" | "reject";
}
