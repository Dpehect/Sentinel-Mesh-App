import {describe, expect, it} from "vitest";
import {analyzeBehavior, createUebaSummary} from "./index.js";

const baseline = {
  entityId:"user-1",
  entityType:"user" as const,
  usualHours:[8,9,10,11,12,13,14,15,16,17],
  usualCountries:["TR"],
  usualActions:["login","read-report"],
  averageEventsPerHour:5,
  averageDataTransferMb:10
};

describe("UEBA engine", () => {
  it("contains critical unusual privileged behavior", () => {
    const report = analyzeBehavior([baseline], [{
      entityId:"user-1",
      entityType:"user",
      timestamp:"2026-07-20T02:00:00.000Z",
      action:"export-database",
      country:"US",
      sourceIp:"203.0.113.9",
      success:true,
      dataTransferMb:150,
      privileged:true
    }]);

    expect(report.decision).toBe("contain");
    expect(report.anomalies.some(item => item.ruleId === "UEBA-GEO-001")).toBe(true);
    expect(report.anomalies.some(item => item.ruleId === "UEBA-DATA-001")).toBe(true);
  });

  it("allows normal behavior", () => {
    const report = analyzeBehavior([baseline], [{
      entityId:"user-1",
      entityType:"user",
      timestamp:"2026-07-20T10:00:00.000Z",
      action:"login",
      country:"TR",
      success:true,
      dataTransferMb:2
    }]);

    expect(report.decision).toBe("allow");
    expect(report.anomalies).toHaveLength(0);
  });

  it("creates a compact summary", () => {
    expect(createUebaSummary(
      analyzeBehavior([], [])
    )).toContain("UEBA decision:");
  });
});
