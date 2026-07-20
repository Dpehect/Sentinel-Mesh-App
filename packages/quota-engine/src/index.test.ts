import {describe, expect, it} from "vitest";
import {
  calculateUsagePercent,
  evaluateTenantQuota,
  shouldThrottleTenant
} from "./index.js";

describe("quota engine", () => {
  it("blocks tenants exceeding concurrent scan limits", () => {
    const result = evaluateTenantQuota({
      activeScans:4,
      scansStartedInCurrentHour:2,
      repositoryBytesRequested:1000,
      monthlyScanMinutesUsed:100
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("CONCURRENCY_LIMIT");
  });

  it("allows normal usage", () => {
    const result = evaluateTenantQuota({
      activeScans:1,
      scansStartedInCurrentHour:2,
      repositoryBytesRequested:1000,
      monthlyScanMinutesUsed:100
    });

    expect(result.allowed).toBe(true);
  });

  it("calculates usage and throttling thresholds", () => {
    expect(calculateUsagePercent(85, 100)).toBe(85);
    expect(shouldThrottleTenant(85)).toBe(true);
  });
});
