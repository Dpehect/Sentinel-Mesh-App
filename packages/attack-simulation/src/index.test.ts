import {describe, expect, it} from "vitest";
import {
  createSimulationSummary,
  runAttackSimulation,
  simulateScenario
} from "./index.js";

const controls = [
  {id:"secret-scan", name:"Secret scanning", techniques:["credential-exposure"] as const},
  {id:"runtime-detection", name:"Runtime detection", techniques:["lateral-movement"] as const}
];

describe("attack simulation", () => {
  it("marks scenarios blocked when a prevention control works", () => {
    const result = simulateScenario({
      id:"scenario-1",
      name:"Leaked credential",
      technique:"credential-exposure",
      requiredControls:["secret-scan"],
      assetIds:["repo-1"],
      businessImpact:80
    }, controls, [{
      controlId:"secret-scan",
      outcome:"prevented",
      observedAt:"2026-07-20T00:00:00.000Z",
      evidenceIds:["evidence-1"]
    }]);

    expect(result.outcome).toBe("blocked");
    expect(result.evidenceIds).toEqual(["evidence-1"]);
  });

  it("identifies control gaps across scenarios", () => {
    const report = runAttackSimulation([{
      id:"scenario-2",
      name:"Lateral movement",
      technique:"lateral-movement",
      requiredControls:["runtime-detection"],
      assetIds:["service-1","database-1"],
      businessImpact:90
    }], controls, {
      "scenario-2":[{
        controlId:"runtime-detection",
        outcome:"missed",
        observedAt:"2026-07-20T00:00:00.000Z"
      }]
    });

    expect(report.successful).toBe(1);
    expect(report.priorityGaps).toEqual(["runtime-detection"]);
  });

  it("creates a compact simulation summary", () => {
    const report = runAttackSimulation([], controls, {});
    expect(createSimulationSummary(report)).toContain("Attack-simulation resilience:");
  });
});
