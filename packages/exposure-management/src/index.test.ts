import {describe, expect, it} from "vitest";
import {
  createExposureCampaigns,
  evaluateExposureManagement,
  scoreExposure
} from "./index.js";

const criticalSignal = {
  id:"exp-1",
  tenantId:"org-1",
  assetId:"api-1",
  type:"vulnerability" as const,
  severity:"critical" as const,
  title:"Remote code execution",
  detectedAt:"2026-07-20T00:00:00.000Z",
  status:"open" as const,
  exploitAvailable:true,
  internetExposed:true,
  privilegedPath:true,
  activeThreatMatch:true,
  businessImpact:100,
  confidence:100
};

describe("exposure management", () => {
  it("prioritizes exploitable internet-facing critical exposure", () => {
    const result = scoreExposure(criticalSignal);

    expect(result.riskScore).toBe(100);
    expect(result.priority).toBe("P0");
    expect(result.reasons).toContain("ACTIVE_THREAT_MATCH");
  });

  it("groups related exposures into asset campaigns", () => {
    const first = scoreExposure(criticalSignal);
    const second = scoreExposure({
      ...criticalSignal,
      id:"exp-2",
      type:"secret",
      severity:"high",
      title:"Exposed deployment token",
      exploitAvailable:false,
      activeThreatMatch:false
    });

    const campaigns = createExposureCampaigns([first, second]);

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].exposureIds).toHaveLength(2);
    expect(campaigns[0].priority).toBe("P0");
  });

  it("returns urgent decision for P0 exposure", () => {
    const report = evaluateExposureManagement([criticalSignal]);

    expect(report.decision).toBe("urgent");
    expect(report.p0Count).toBe(1);
  });
});
