import type {
  FleetAgent,
  FleetOperation,
  FleetOperationHistory,
  FleetOrchestrationPlan,
  FleetPlanItem,
  FleetPolicy
} from "./types.js";

export type {
  FleetAgent,
  FleetAgentStatus,
  FleetOperation,
  FleetOperationHistory,
  FleetOrchestrationPlan,
  FleetPlanItem,
  FleetPolicy
} from "./types.js";

function isInsideMaintenanceWindow(
  policy: FleetPolicy,
  now: Date
): boolean {
  const window = policy.maintenanceWindow;
  if (!window) return true;

  const hour = now.getUTCHours();
  if (window.startHourUtc === window.endHourUtc) return true;

  if (window.startHourUtc < window.endHourUtc) {
    return hour >= window.startHourUtc && hour < window.endHourUtc;
  }

  return hour >= window.startHourUtc || hour < window.endHourUtc;
}

function observedFailureRate(
  history: FleetOperationHistory[],
  operation: FleetOperation
): number {
  const relevant = history.filter(item => item.operation === operation);
  if (relevant.length === 0) return 0;
  const failures = relevant.filter(item => item.outcome === "failed").length;
  return failures / relevant.length;
}

function eligibleReason(
  agent: FleetAgent,
  policy: FleetPolicy
): string | null {
  if (agent.status === "quarantined") return "Agent is quarantined";
  if (agent.status === "offline" && !policy.includeOfflineAgents) {
    return "Offline agents are excluded by policy";
  }
  if (agent.healthScore < policy.minimumHealthyScore) {
    return "Health score is below rollout threshold";
  }
  return null;
}

function sortAgents(agents: FleetAgent[]): FleetAgent[] {
  return [...agents].sort((a, b) => {
    if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore;
    const region = a.region.localeCompare(b.region);
    return region !== 0 ? region : a.agentId.localeCompare(b.agentId);
  });
}

export function planFleetOperation(
  agents: FleetAgent[],
  operation: FleetOperation,
  history: FleetOperationHistory[],
  policy: FleetPolicy,
  now = new Date()
): FleetOrchestrationPlan {
  const failureRate = observedFailureRate(history, operation);
  const excludedAgents: FleetOrchestrationPlan["excludedAgents"] = [];

  if (!isInsideMaintenanceWindow(policy, now)) {
    return {
      decision: "paused",
      reason: "Outside the configured maintenance window",
      waves: [],
      excludedAgents,
      observedFailureRate: failureRate
    };
  }

  if (failureRate >= policy.failureRateStopThreshold && history.length > 0) {
    return {
      decision: "paused",
      reason: "Observed failure rate reached the automatic stop threshold",
      waves: [],
      excludedAgents,
      observedFailureRate: failureRate
    };
  }

  const eligible: FleetAgent[] = [];
  for (const agent of agents) {
    const reason = eligibleReason(agent, policy);
    if (reason) excludedAgents.push({ agentId: agent.agentId, reason });
    else eligible.push(agent);
  }

  if (eligible.length === 0) {
    return {
      decision: "none",
      reason: "No eligible agents",
      waves: [],
      excludedAgents,
      observedFailureRate: failureRate
    };
  }

  const ordered = sortAgents(eligible);
  const canaryCount = Math.min(
    Math.max(1, policy.canarySize),
    ordered.length,
    Math.max(1, policy.maximumConcurrentAgents)
  );

  const items: FleetPlanItem[] = ordered.map((agent, index) => ({
    agentId: agent.agentId,
    region: agent.region,
    operation,
    wave: 0,
    canary: index < canaryCount,
    requiresApproval:
      policy.requireApprovalForCriticalAgents && agent.status === "critical",
    reason:
      index < canaryCount
        ? "Selected for deterministic canary wave"
        : "Eligible for staged fleet rollout"
  }));

  const waves: FleetPlanItem[][] = [];
  let remaining = [...items];
  let waveNumber = 1;

  while (remaining.length > 0) {
    const regionCounts = new Map<string, number>();
    const wave: FleetPlanItem[] = [];
    const deferred: FleetPlanItem[] = [];

    for (const item of remaining) {
      const regionCount = regionCounts.get(item.region) ?? 0;
      const canJoin =
        wave.length < policy.maximumConcurrentAgents &&
        regionCount < policy.maximumConcurrentPerRegion &&
        (waveNumber !== 1 || item.canary);

      if (canJoin) {
        item.wave = waveNumber;
        wave.push(item);
        regionCounts.set(item.region, regionCount + 1);
      } else {
        deferred.push(item);
      }
    }

    if (wave.length === 0) {
      const next = deferred.shift();
      if (!next) break;
      next.wave = waveNumber;
      wave.push(next);
    }

    waves.push(wave);
    remaining = deferred.filter(item => !wave.includes(item));
    waveNumber += 1;
  }

  const approvalRequired = items.some(item => item.requiresApproval);

  return {
    decision: approvalRequired ? "approval-required" : "proceed",
    reason: approvalRequired
      ? "One or more critical agents require human approval"
      : "Fleet operation can proceed in controlled waves",
    waves,
    excludedAgents,
    observedFailureRate: failureRate
  };
}

export function createFleetPlanSummary(
  plan: FleetOrchestrationPlan
): string {
  const planned = plan.waves.reduce((total, wave) => total + wave.length, 0);
  return [
    `Fleet decision: ${plan.decision}`,
    `Planned agents: ${planned}`,
    `Waves: ${plan.waves.length}`,
    `Excluded agents: ${plan.excludedAgents.length}`,
    `Observed failure rate: ${(plan.observedFailureRate * 100).toFixed(1)}%`
  ].join("\n");
}
