import {describe, expect, it} from "vitest";
import {createComplianceSummary, evaluateCompliance} from "./index.js";

describe("compliance engine", () => {
  it("calculates framework coverage from evidence", () => {
    const result = evaluateCompliance("SOC2", [
      {
        id:"e1",
        type:"tenant-isolation",
        source:"audit-engine",
        collectedAt:"2026-07-20T00:00:00.000Z",
        controlIds:["SOC2-CC6.1"]
      },
      {
        id:"e2",
        type:"rbac",
        source:"enterprise-core",
        collectedAt:"2026-07-20T00:00:00.000Z",
        controlIds:["SOC2-CC6.1"]
      },
      {
        id:"e3",
        type:"audit-log",
        source:"audit-engine",
        collectedAt:"2026-07-20T00:00:00.000Z",
        controlIds:["SOC2-CC6.1","SOC2-CC7.2"]
      }
    ]);

    expect(result.totalControls).toBe(2);
    expect(result.satisfiedControls).toBe(1);
    expect(result.coveragePercent).toBe(50);
  });

  it("creates a compact compliance summary", () => {
    const result = evaluateCompliance("NIST-CSF", []);
    expect(createComplianceSummary(result)).toContain("NIST-CSF coverage:");
  });
});
