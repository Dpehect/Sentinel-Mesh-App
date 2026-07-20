import type {
  AgentEnrollmentRequest,
  AgentFleetPolicy,
  AgentFleetReport,
  AgentRecord,
  EnrollmentDecision,
  EnrollmentToken
} from "./types.js";

export type {
  AgentEnrollmentRequest,
  AgentFleetPolicy,
  AgentFleetReport,
  AgentRecord,
  AgentStatus,
  EnrollmentDecision,
  EnrollmentToken
} from "./types.js";

function parseVersion(version: string): number[] {
  return version.split(".").map(part => {
    const value = Number.parseInt(part, 10);
    return Number.isFinite(value) ? value : 0;
  });
}

export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = a[index] ?? 0;
    const rightPart = b[index] ?? 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

export function validateEnrollment(
  token: EnrollmentToken | undefined,
  request: AgentEnrollmentRequest,
  now = new Date()
): EnrollmentDecision {
  if (!token) return {allowed:false, reason:"TOKEN_NOT_FOUND"};
  if (token.revoked) return {allowed:false, reason:"TOKEN_REVOKED"};
  if (token.tenantId !== request.tenantId) {
    return {allowed:false, reason:"TENANT_MISMATCH"};
  }
  if (token.tokenHash !== request.tokenHash) {
    return {allowed:false, reason:"TOKEN_HASH_MISMATCH"};
  }
  if (token.uses >= token.maxUses) {
    return {allowed:false, reason:"TOKEN_USE_LIMIT_REACHED"};
  }
  if (now.getTime() > new Date(token.expiresAt).getTime()) {
    return {allowed:false, reason:"TOKEN_EXPIRED"};
  }
  if (
    token.allowedPlatforms.length > 0 &&
    !token.allowedPlatforms.includes(request.platform)
  ) {
    return {allowed:false, reason:"PLATFORM_NOT_ALLOWED"};
  }
  if (!/^[A-Fa-f0-9:]{32,}$/.test(request.certificateFingerprint)) {
    return {allowed:false, reason:"INVALID_CERTIFICATE_FINGERPRINT"};
  }

  return {
    allowed:true,
    agent:{
      id:request.agentId,
      tenantId:request.tenantId,
      platform:request.platform,
      version:request.version,
      certificateFingerprint:request.certificateFingerprint.toUpperCase(),
      status:"active",
      enrolledAt:request.requestedAt,
      lastHeartbeatAt:request.requestedAt
    }
  };
}

export function consumeEnrollmentToken(
  token: EnrollmentToken
): EnrollmentToken {
  if (token.revoked || token.uses >= token.maxUses) {
    throw new Error("TOKEN_NOT_CONSUMABLE");
  }

  return {...token, uses:token.uses + 1};
}

export function evaluateAgentFleet(
  agents: AgentRecord[],
  policy: AgentFleetPolicy,
  now = new Date()
): AgentFleetReport {
  const staleAgents:string[] = [];
  const outdatedAgents:string[] = [];
  const quarantinedAgents:string[] = [];
  const healthyAgents:string[] = [];

  const fingerprintMap = new Map<string,string[]>();

  for (const agent of agents) {
    const fingerprint = agent.certificateFingerprint.toUpperCase();
    fingerprintMap.set(
      fingerprint,
      [...(fingerprintMap.get(fingerprint) ?? []), agent.id]
    );

    const stale =
      now.getTime() - new Date(agent.lastHeartbeatAt).getTime() >
      policy.heartbeatTimeoutSeconds * 1000;

    const minimumVersion = policy.minimumVersions[agent.platform];
    const outdated = minimumVersion
      ? compareVersions(agent.version, minimumVersion) < 0
      : false;

    const fingerprintAllowed =
      !policy.allowedCertificateFingerprints ||
      policy.allowedCertificateFingerprints
        .map(value=>value.toUpperCase())
        .includes(fingerprint);

    if (agent.status === "quarantined" || !fingerprintAllowed) {
      quarantinedAgents.push(agent.id);
    }
    if (stale) staleAgents.push(agent.id);
    if (outdated) outdatedAgents.push(agent.id);

    if (
      agent.status === "active" &&
      !stale &&
      !outdated &&
      fingerprintAllowed
    ) {
      healthyAgents.push(agent.id);
    }
  }

  const duplicateFingerprints = [...fingerprintMap.entries()]
    .filter(([,agentIds]) => agentIds.length > 1)
    .map(([fingerprint]) => fingerprint);

  const blocking =
    duplicateFingerprints.length > 0 ||
    quarantinedAgents.length > 0;

  return {
    totalAgents:agents.length,
    healthyAgents,
    staleAgents,
    outdatedAgents,
    duplicateFingerprints,
    quarantinedAgents,
    decision:blocking
      ? "block"
      : staleAgents.length > 0 || outdatedAgents.length > 0
        ? "degraded"
        : "healthy"
  };
}

export function createAgentFleetSummary(
  report: AgentFleetReport
): string {
  return [
    `Agent fleet decision: ${report.decision}`,
    `Total agents: ${report.totalAgents}`,
    `Healthy agents: ${report.healthyAgents.length}`,
    `Stale agents: ${report.staleAgents.length}`,
    `Outdated agents: ${report.outdatedAgents.length}`,
    `Duplicate fingerprints: ${report.duplicateFingerprints.length}`
  ].join("\n");
}
