import {describe,expect,it} from "vitest";
import {
  evaluateAttackCoverage,
  evaluateTechniqueCoverage
} from "./index.js";

const techniques = [
  {id:"T1003",name:"OS Credential Dumping",tactic:"credential-access",priority:100},
  {id:"T1071",name:"Application Layer Protocol",tactic:"command-and-control",priority:90}
];

describe("MITRE ATT&CK coverage",()=>{
  it("marks diverse tested controls as covered",()=>{
    const result = evaluateTechniqueCoverage(techniques[0],[
      {
        controlId:"edr-cred",
        controlType:"detection",
        techniques:["T1003"],
        enabled:true,
        tested:true,
        effectiveness:90
      },
      {
        controlId:"isolate-host",
        controlType:"response",
        techniques:["T1003"],
        enabled:true,
        tested:true,
        effectiveness:85
      },
      {
        controlId:"credential-guard",
        controlType:"prevention",
        techniques:["T1003"],
        enabled:true,
        tested:true,
        effectiveness:80
      },
      {
        controlId:"endpoint-telemetry",
        controlType:"visibility",
        techniques:["T1003"],
        enabled:true,
        tested:true,
        effectiveness:90
      }
    ]);

    expect(result.level).toBe("covered");
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("identifies critical uncovered techniques",()=>{
    const report = evaluateAttackCoverage(techniques,[]);
    expect(report.decision).toBe("improve");
    expect(report.priorityGaps[0]).toBe("T1003");
    expect(report.uncoveredTechniques).toBe(2);
  });

  it("returns healthy for strong overall coverage",()=>{
    const controls = techniques.flatMap(technique => [
      {
        controlId:`${technique.id}-d`,
        controlType:"detection" as const,
        techniques:[technique.id],
        enabled:true,
        tested:true,
        effectiveness:95
      },
      {
        controlId:`${technique.id}-p`,
        controlType:"prevention" as const,
        techniques:[technique.id],
        enabled:true,
        tested:true,
        effectiveness:90
      },
      {
        controlId:`${technique.id}-r`,
        controlType:"response" as const,
        techniques:[technique.id],
        enabled:true,
        tested:true,
        effectiveness:90
      },
      {
        controlId:`${technique.id}-v`,
        controlType:"visibility" as const,
        techniques:[technique.id],
        enabled:true,
        tested:true,
        effectiveness:95
      }
    ]);

    expect(evaluateAttackCoverage(techniques,controls).decision).toBe("healthy");
  });
});
