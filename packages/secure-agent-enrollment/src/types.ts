export type AgentStatus = "pending" | "active" | "quarantined" | "revoked" | "offline";

export interface EnrollmentToken {
  id: string;
  tenantId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  allowedPlatforms: string[];
  revoked: boolean;
}

export interface AgentEnrollmentRequest {
  tenantId: string;
  tokenHash: string;
  agentId: string;
  platform: string;
  version: string;
  certificateFingerprint: string;
  requestedAt: string;
}

export interface AgentRecord {
  id: string;
  tenantId: string;
  platform: string;
  version: string;
  certificateFingerprint: string;
  status: AgentStatus;
  enrolledAt: string;
  lastHeartbeatAt: string;
}

export interface EnrollmentDecision {
  allowed: boolean;
  reason?: string;
  agent?: AgentRecord;
}

export interface AgentFleetPolicy {
  minimumVersions: Record<string, string>;
  heartbeatTimeoutSeconds: number;
  allowedCertificateFingerprints?: string[];
}

export interface AgentFleetReport {
  totalAgents: number;
  healthyAgents: string[];
  staleAgents: string[];
  outdatedAgents: string[];
  duplicateFingerprints: string[];
  quarantinedAgents: string[];
  decision: "healthy" | "degraded" | "block";
}
