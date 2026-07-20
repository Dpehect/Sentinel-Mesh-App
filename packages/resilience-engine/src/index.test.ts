import {describe, expect, it} from "vitest";
import {
  calculateRetryDelay,
  createIdempotencyKey,
  evaluateCircuit,
  recordCircuitFailure,
  shouldRetry
} from "./index.js";

describe("resilience engine", () => {
  it("calculates bounded exponential retry delays", () => {
    expect(calculateRetryDelay(1)).toBe(500);
    expect(calculateRetryDelay(4)).toBe(4000);
    expect(calculateRetryDelay(20)).toBe(30000);
  });

  it("does not retry permanent security failures", () => {
    expect(shouldRetry(1, "TENANT_ACCESS_DENIED")).toBe(false);
    expect(shouldRetry(1, "NETWORK_TIMEOUT")).toBe(true);
  });

  it("opens and later half-opens the circuit", () => {
    let snapshot = {state:"closed" as const, failureCount:4};
    snapshot = recordCircuitFailure(snapshot, 1000);

    expect(snapshot.state).toBe("open");
    expect(evaluateCircuit(snapshot, 61000).state).toBe("half-open");
  });

  it("creates stable idempotency keys", () => {
    expect(createIdempotencyKey(["ORG-1", "SCAN-9"])).toBe("org-1:scan-9");
  });
});
