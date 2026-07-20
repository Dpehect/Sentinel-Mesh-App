import { describe, expect, it } from "vitest";
import {
  appendAuditRecord,
  verifyAuditChain,
  type AuditChainPolicy,
  type RolloutAuditRecord
} from "./index.js";

const key = "local-test-signing-key";

const policy: AuditChainPolicy = {
  requireStrictSequence: true,
  rejectDuplicateIdempotencyKeys: true,
  pauseOnIntegrityFailure: true,
  maximumClockSkewSeconds: 60
};

function createChain(): RolloutAuditRecord[] {
  const first = appendAuditRecord([], {
    rolloutId: "rollout-1",
    wave: 1,
    action: "start-wave",
    actor: "operator",
    occurredAt: "2026-07-20T12:00:00.000Z",
    idempotencyKey: "start-wave-1"
  }, key);

  const second = appendAuditRecord([first], {
    rolloutId: "rollout-1",
    wave: 1,
    action: "complete-wave",
    actor: "operator",
    occurredAt: "2026-07-20T12:05:00.000Z",
    idempotencyKey: "complete-wave-1"
  }, key);

  return [first, second];
}

describe("rollout audit chain", () => {
  it("verifies a valid signed chain", () => {
    const result = verifyAuditChain(
      createChain(),
      key,
      policy,
      new Date("2026-07-20T12:05:30.000Z")
    );

    expect(result.valid).toBe(true);
    expect(result.decision).toBe("accept");
  });

  it("pauses rollout when a payload is changed", () => {
    const chain = createChain();
    chain[1] = {
      ...chain[1],
      action: "rollback-wave"
    };

    const result = verifyAuditChain(
      chain,
      key,
      policy,
      new Date("2026-07-20T12:05:30.000Z")
    );

    expect(result.valid).toBe(false);
    expect(result.decision).toBe("pause-rollout");
    expect(result.firstInvalidSequence).toBe(2);
  });

  it("rejects duplicate idempotency keys", () => {
    const chain = createChain();
    chain[1] = {
      ...chain[1],
      idempotencyKey: chain[0].idempotencyKey
    };

    const result = verifyAuditChain(
      chain,
      key,
      policy,
      new Date("2026-07-20T12:05:30.000Z")
    );

    expect(result.reason).toContain("Duplicate");
  });

  it("detects an invalid signature", () => {
    const chain = createChain();
    chain[0] = {
      ...chain[0],
      signature: "00".repeat(32)
    };

    const result = verifyAuditChain(
      chain,
      key,
      policy,
      new Date("2026-07-20T12:05:30.000Z")
    );

    expect(result.reason).toContain("signature");
  });
});
