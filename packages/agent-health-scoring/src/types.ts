export type AgentHealthStatus = "healthy" | "degraded" | "critical";

export interface AgentHealthInput {
  agentId: string;
  telemetryIntegrityScore: number;
  runtimeAttestationScore: number;
  certificateScore: number;
  policyComplianceScore: number;
  updateComplianceScore: number;
  resourceHealthScore: number;
  connectivityScore: number;
  selfProtectionScore: number;
  criticalFindings: string[];
}

export interface AgentHealthWeights {
  telemetryIntegrity: number;
  runtimeAttestation: number;
  certificate: number;
  policyCompliance: number;
  updateCompliance: number;
  resourceHealth: number;
  connectivity: number;
  selfProtection: number;
}

export interface AgentHealthResult {
  agentId: string;
  score: number;
  status: AgentHealthStatus;
  penalties: string[];
  recommendations: string[];
}

export interface AgentFleetHealthReport {
  agents: AgentHealthResult[];
  averageScore: number;
  healthyAgents: string[];
  degradedAgents: string[];
  criticalAgents: string[];
  decision: "healthy" | "investigate" | "contain";
}
