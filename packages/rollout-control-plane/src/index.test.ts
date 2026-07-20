import { describe, expect, it } from "vitest";
import {
  MemoryRolloutStore,
  RolloutControlPlane
} from "./index.js";

function input() {
  return {
    rolloutId: "rollout-70",
    operation: "agent-update",
    activeWave: null,
    createdBy: "owner@example.local",
    waves: [
      {
        wave: 1,
        plannedAgents: 2,
        succeededAgents: 0,
        failedAgents: 0,
        skippedAgents: 0,
        state: "pending" as const
      }
    ],
    approvalRequired: true,
    metadata: { environment: "production" }
  };
}

describe("rollout control plane", () => {
  it("enforces approval and optimistic concurrency", async () => {
    const plane = new RolloutControlPlane(new MemoryRolloutStore());
    const created = await plane.create(input());

    expect(created.state).toBe("awaiting-approval");

    const approved = await plane.decideApproval({
      rolloutId: created.rolloutId,
      actor: "security@example.local",
      decision: "approve",
      expectedVersion: created.version
    });

    expect(approved.state).toBe("approved");

    await expect(
      plane.transition(
        approved.rolloutId,
        "start",
        "operator@example.local",
        created.version
      )
    ).rejects.toThrow("Version conflict");
  });

  it("creates and verifies a recovery checkpoint", async () => {
    const plane = new RolloutControlPlane(new MemoryRolloutStore());
    const created = await plane.create({
      ...input(),
      approvalRequired: false
    });

    const checkpoint = await plane.createCheckpoint(
      created.rolloutId,
      "operator@example.local",
      created.version
    );

    const afterCheckpoint = await plane.get(created.rolloutId);
    const started = await plane.transition(
      created.rolloutId,
      "start",
      "operator@example.local",
      afterCheckpoint.record.version
    );

    const recovered = await plane.recover(
      created.rolloutId,
      checkpoint.checkpointId,
      "security@example.local",
      started.version
    );

    expect(recovered.state).toBe("paused");
    expect(recovered.checkpointId).toBe(checkpoint.checkpointId);
  });

  it("rejects invalid state transitions", async () => {
    const plane = new RolloutControlPlane(new MemoryRolloutStore());
    const created = await plane.create(input());

    await expect(
      plane.transition(
        created.rolloutId,
        "complete",
        "operator@example.local",
        created.version
      )
    ).rejects.toThrow("not allowed");
  });
});
