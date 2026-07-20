import {describe, expect, it} from "vitest";
import {
  aggregateServiceHealth,
  evaluateSlo,
  shouldAlert
} from "./index.js";

describe("observability engine", () => {
  it("marks aggregate health unhealthy when a dependency fails", () => {
    const health = aggregateServiceHealth([
      {name:"database", status:"healthy", latencyMs:20, checkedAt:"2026-07-20T00:00:00.000Z"},
      {name:"queue", status:"unhealthy", latencyMs:0, checkedAt:"2026-07-20T00:00:00.000Z"}
    ]);

    expect(health.status).toBe("unhealthy");
  });

  it("detects SLO violations and alert conditions", () => {
    const health = aggregateServiceHealth([
      {name:"api", status:"healthy", latencyMs:100, checkedAt:"2026-07-20T00:00:00.000Z"}
    ]);
    const slo = evaluateSlo({
      availabilityPercent:99.5,
      p95LatencyMs:1800,
      errorRatePercent:1.5
    });

    expect(slo.met).toBe(false);
    expect(shouldAlert(health, slo)).toBe(true);
  });
});
