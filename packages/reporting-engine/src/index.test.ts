import {describe, expect, it} from "vitest";
import {
  calculateRiskScore,
  createExecutiveReport,
  renderExecutiveSummary
} from "./index.js";

const previous = {
  capturedAt:"2026-07-01T00:00:00.000Z",
  criticalFindings:4,
  highFindings:8,
  openAttackPaths:5,
  blockedPullRequests:1,
  overdueFindings:3,
  complianceCoverage:55
};

const latest = {
  capturedAt:"2026-07-20T00:00:00.000Z",
  criticalFindings:1,
  highFindings:3,
  openAttackPaths:2,
  blockedPullRequests:4,
  overdueFindings:1,
  complianceCoverage:82
};

describe("reporting engine", () => {
  it("calculates bounded risk score", () => {
    expect(calculateRiskScore(latest)).toBeGreaterThanOrEqual(0);
    expect(calculateRiskScore(latest)).toBeLessThanOrEqual(100);
  });

  it("creates an improving executive report", () => {
    const report = createExecutiveReport(previous, latest);
    expect(report.trend).toBe("improving");
    expect(renderExecutiveSummary(report)).toContain("Risk score:");
  });
});
