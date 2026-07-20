export interface AgentPolicyBundle {
  id: string;
  tenantId: string;
  version: string;
  checksumSha256: string;
  signature: string;
  signerId: string;
  publishedAt: string;
  targetPlatforms: string[];
  targetTags: string[];
  settings: Record<string, string | number | boolean>;
}

export interface PolicyAgent {
  id: string;
  tenantId: string;
  platform: string;
  tags: string[];
  currentPolicyVersion?: string;
  currentPolicyChecksum?: string;
  status: "active" | "offline" | "quarantined";
}

export interface PolicyApplication {
  agentId: string;
  policyId: string;
  version: string;
  applied: boolean;
  healthCheckPassed: boolean;
  appliedAt: string;
}

export interface PolicyDecision {
  eligible: boolean;
  reason?: string;
}

export interface PolicyDistributionReport {
  eligibleAgents: string[];
  skippedAgents: string[];
  driftedAgents: string[];
  failedAgents: string[];
  rollbackAgents: string[];
  decision: "continue" | "pause" | "rollback";
}
