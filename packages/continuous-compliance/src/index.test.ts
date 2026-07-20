import {describe, expect, it} from "vitest";
import {
  createComplianceSnapshot,
  detectComplianceDrift,
  evaluateContinuousCompliance
} from "./index.js";

const controls = [
  {
    id:"SOC2-CC6.1",
    framework:"SOC2" as const,
    title:"Logical access controls",
    description:"Access must be restricted.",
    evidenceTypes:["access-review"],
    required:true
  },
  {
    id:"SOC2-CC7.2",
    framework:"SOC2" as const,
    title:"Security monitoring",
    description:"Security events must be monitored.",
    evidenceTypes:["siem-report"],
    required:true
  }
];

describe("continuous compliance", () => {
  it("marks complete passing evidence as audit ready", () => {
    const snapshot = createComplianceSnapshot("org-1", [
      {
        controlId:"SOC2-CC6.1",
        observedAt:"2026-07-20T00:00:00.000Z",
        status:"pass",
        evidenceIds:["evidence-1"],
        resourceIds:["identity"]
      },
      {
        controlId:"SOC2-CC7.2",
        observedAt:"2026-07-20T00:00:00.000Z",
        status:"pass",
        evidenceIds:["evidence-2"],
        resourceIds:["siem"]
      }
    ], "2026-07-20T00:00:00.000Z");

    const report = evaluateContinuousCompliance("SOC2", controls, snapshot);

    expect(report.score).toBe(100);
    expect(report.auditReady).toBe(true);
  });

  it("detects pass-to-fail drift", () => {
    const previous = createComplianceSnapshot("org-1", [{
      controlId:"SOC2-CC6.1",
      observedAt:"2026-07-19T00:00:00.000Z",
      status:"pass",
      evidenceIds:["e1"],
      resourceIds:["identity"]
    }], "2026-07-19T00:00:00.000Z");

    const current = createComplianceSnapshot("org-1", [{
      controlId:"SOC2-CC6.1",
      observedAt:"2026-07-20T00:00:00.000Z",
      status:"fail",
      evidenceIds:["e2"],
      resourceIds:["identity"]
    }], "2026-07-20T00:00:00.000Z");

    const drift = detectComplianceDrift(previous, current);

    expect(drift).toHaveLength(1);
    expect(drift[0].severity).toBe("high");
  });

  it("fails audit readiness when evidence is missing", () => {
    const snapshot = createComplianceSnapshot("org-1", [{
      controlId:"SOC2-CC6.1",
      observedAt:"2026-07-20T00:00:00.000Z",
      status:"pass",
      evidenceIds:[],
      resourceIds:["identity"]
    }]);

    const report = evaluateContinuousCompliance("SOC2", controls, snapshot);

    expect(report.auditReady).toBe(false);
    expect(report.missingEvidenceControls).toContain("SOC2-CC6.1");
    expect(report.missingEvidenceControls).toContain("SOC2-CC7.2");
  });
});
