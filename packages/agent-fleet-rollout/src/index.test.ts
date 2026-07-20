import { describe, expect, it } from "vitest";
import {
  createRolloutEvent,
  decideRolloutState,
  type RolloutPlan,
  type RolloutSafetyPolicy
} from "./index.js";

const plan: RolloutPlan = {
  rolloutId: "rollout-1",
  operation: "agent-update",
  waves: [
    {
      wave: 1,
      agents: [
        { agentId: "a-1", region: "eu-west", requiresApproval: false },
        { agentId: "a-2", region: "us-east", requiresApproval: false }
      ]
    },
    {
      wave: 2,
      agents: [
        { agentId: "a-3", region: "eu-west", requiresApproval: false }
      ]
    }
  ]
};

const policy: RolloutSafetyPolicy = {
  maximumFailureRate: 0.25,
  minimumSuccessCountForCanary: 1,
  requireApprovalBeforeNextWave: true,
  automaticRollback: true
};

describe("fleet rollout safety", () => {
  it("starts from pending state", () => {
    const decision = decideRolloutState(plan, [], [], policy);
    expect(decision.nextAction).toBe("start-first-wave");
  });

  it("requests rollback when failure rate exceeds threshold", () => {
    const events = [
      createRolloutEvent({
        rolloutId: "rollout-1",
        wave: 1,
        action: "start-wave",
        actor: "operator",
        idempotencyKey: "start-1"
      })
    ];

    const decision = decideRolloutState(
      plan,
      events,
      [{
        rolloutId: "rollout-1",
        wave: 1,
        observedAt: "2026-07-20T12:00:00Z",
        results: [
          { agentId: "a-1", outcome: "failed" },
          { agentId: "a-2", outcome: "succeeded" }
        ]
      }],
      policy
    );

    expect(decision.nextAction).toBe("rollback-current-wave");
    expect(decision.failureRate).toBe(0.5);
  });

  it("waits for approval before starting next wave", () => {
    const events = [
      createRolloutEvent({
        rolloutId: "rollout-1",
        wave: 1,
        action: "start-wave",
        actor: "operator",
        idempotencyKey: "start-1"
      }),
      createRolloutEvent({
        rolloutId: "rollout-1",
        wave: 1,
        action: "complete-wave",
        actor: "operator",
        idempotencyKey: "complete-1"
      })
    ];

    const decision = decideRolloutState(
      plan,
      events,
      [{
        rolloutId: "rollout-1",
        wave: 1,
        observedAt: "2026-07-20T12:00:00Z",
        results: [
          { agentId: "a-1", outcome: "succeeded" },
          { agentId: "a-2", outcome: "succeeded" }
        ]
      }],
      policy
    );

    expect(decision.nextAction).toBe("await-approval");
  });

  it("ignores duplicate idempotency keys", () => {
    const first = createRolloutEvent({
      rolloutId: "rollout-1",
      wave: 1,
      action: "start-wave",
      actor: "operator",
      idempotencyKey: "same"
    });
    const second = { ...first, eventId: "duplicate-event" };

    const decision = decideRolloutState(plan, [first, second], [], policy);
    expect(decision.duplicateEvents).toEqual(["duplicate-event"]);
  });
});
