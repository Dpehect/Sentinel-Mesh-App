import { describe, expect, it } from "vitest";
import {
  createFleetPlanSummary,
  planFleetOperation,
  type FleetAgent,
  type FleetPolicy
} from "./index.js";

const agents: FleetAgent[] = [
  { agentId: "a-1", region: "eu-west", status: "healthy", healthScore: 98 },
  { agentId: "a-2", region: "eu-west", status: "healthy", healthScore: 95 },
  { agentId: "a-3", region: "us-east", status: "degraded", healthScore: 82 },
  { agentId: "a-4", region: "us-east", status: "critical", healthScore: 80 },
  { agentId: "a-5", region: "eu-west", status: "offline", healthScore: 91 },
  { agentId: "a-6", region: "ap-south", status: "quarantined", healthScore: 99 }
];

const policy: FleetPolicy = {
  maximumConcurrentAgents: 3,
  maximumConcurrentPerRegion: 1,
  canarySize: 2,
  minimumHealthyScore: 75,
  failureRateStopThreshold: 0.4,
  requireApprovalForCriticalAgents: true,
  includeOfflineAgents: false
};

describe("planFleetOperation", () => {
  it("creates deterministic canary and staged waves", () => {
    const plan = planFleetOperation(
      agents,
      "agent-update",
      [],
      policy,
      new Date("2026-07-20T12:00:00Z")
    );

    expect(plan.decision).toBe("approval-required");
    expect(plan.waves.length).toBeGreaterThan(1);
    expect(plan.waves[0].every(item => item.canary)).toBe(true);
    expect(plan.waves[0].length).toBe(1);
    expect(plan.excludedAgents.map(item => item.agentId)).toEqual(
      expect.arrayContaining(["a-5", "a-6"])
    );
  });

  it("pauses when recent failures reach the stop threshold", () => {
    const plan = planFleetOperation(
      agents,
      "policy-rollout",
      [
        {
          agentId: "a-1",
          operation: "policy-rollout",
          outcome: "failed",
          executedAt: "2026-07-20T10:00:00Z"
        },
        {
          agentId: "a-2",
          operation: "policy-rollout",
          outcome: "succeeded",
          executedAt: "2026-07-20T10:01:00Z"
        }
      ],
      policy
    );

    expect(plan.decision).toBe("paused");
    expect(plan.observedFailureRate).toBe(0.5);
  });

  it("honors maintenance windows", () => {
    const plan = planFleetOperation(
      agents,
      "certificate-rotation",
      [],
      {
        ...policy,
        maintenanceWindow: { startHourUtc: 1, endHourUtc: 3 }
      },
      new Date("2026-07-20T12:00:00Z")
    );

    expect(plan.decision).toBe("paused");
  });

  it("creates a concise operational summary", () => {
    const plan = planFleetOperation(agents, "runtime-reattestation", [], policy);
    expect(createFleetPlanSummary(plan)).toContain("Fleet decision:");
  });
});
