export interface AgentUpdateManifest {
  version: string;
  platform: string;
  artifactSha256: string;
  signature: string;
  signerId: string;
  publishedAt: string;
  minimumCurrentVersion?: string;
  rolloutPercent: number;
}

export interface UpdateAgent {
  id: string;
  platform: string;
  version: string;
  tenantId: string;
  stableBucket: number;
  status: "healthy" | "degraded" | "offline";
}

export interface UpdateAttempt {
  agentId: string;
  fromVersion: string;
  toVersion: string;
  success: boolean;
  healthCheckPassed: boolean;
  attemptedAt: string;
}

export interface UpdateDecision {
  eligible: boolean;
  reason?: string;
}

export interface UpdateRolloutReport {
  eligibleAgents: string[];
  skippedAgents: string[];
  failedAgents: string[];
  rollbackAgents: string[];
  successRate: number;
  decision: "continue" | "pause" | "rollback";
}
