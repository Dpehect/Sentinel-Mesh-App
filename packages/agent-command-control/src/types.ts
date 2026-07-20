export type AgentCommandType =
  | "isolate-network"
  | "release-isolation"
  | "collect-triage"
  | "scan-now"
  | "rotate-agent-token"
  | "refresh-policy";

export interface AgentCommand {
  id: string;
  tenantId: string;
  agentId: string;
  type: AgentCommandType;
  issuedAt: string;
  expiresAt: string;
  sequence: number;
  nonce: string;
  signerId: string;
  signature: string;
  requiresApproval: boolean;
  approvedBy?: string;
  parameters?: Record<string, string | number | boolean>;
}

export interface AgentCommandState {
  tenantId: string;
  agentId: string;
  lastSequence: number;
  executedCommandIds: string[];
  usedNonces: string[];
}

export interface AgentCommandPolicy {
  trustedSigners: string[];
  allowedCommands: AgentCommandType[];
  maxLifetimeSeconds: number;
  approvalRequiredFor: AgentCommandType[];
}

export interface AgentCommandDecision {
  accepted: boolean;
  reason?: string;
}

export interface AgentCommandResult {
  commandId: string;
  agentId: string;
  success: boolean;
  completedAt: string;
  resultHash: string;
  message?: string;
}

export interface AgentCommandReport {
  acceptedCommandIds: string[];
  rejectedCommandIds: string[];
  findings: string[];
  nextState: AgentCommandState;
  decision: "execute" | "review" | "reject";
}
