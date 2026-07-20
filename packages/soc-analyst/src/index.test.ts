import {describe,expect,it} from "vitest";
import {analyzeSocSignals,createAnalystBrief} from "./index.js";

describe("SOC analyst",()=>{
  it("contains high-confidence critical compromise",()=>{
    const result = analyzeSocSignals([
      {
        id:"e1",source:"endpoint",severity:"critical",
        title:"Credential dumping",timestamp:"2026-07-20T10:00:00.000Z",
        confidence:95,evidenceIds:["ev-1"],mitreTechniques:["T1003"]
      },
      {
        id:"e2",source:"network",severity:"high",
        title:"C2 traffic",timestamp:"2026-07-20T10:02:00.000Z",
        confidence:90,evidenceIds:["ev-2"],mitreTechniques:["T1071"]
      }
    ]);

    expect(result.decision).toBe("contain");
    expect(result.recommendations.some(item=>
      item.action==="isolate-affected-entity"
    )).toBe(true);
    expect(result.evidenceIds).toEqual(["ev-1","ev-2"]);
  });

  it("investigates high severity signals",()=>{
    const result = analyzeSocSignals([{
      id:"e1",source:"identity",severity:"high",
      title:"Impossible travel",timestamp:"2026-07-20T10:00:00.000Z",
      confidence:70
    }]);

    expect(result.decision).toBe("investigate");
    expect(result.recommendations.some(item=>
      item.action==="revoke-active-sessions"
    )).toBe(true);
  });

  it("creates a compact analyst brief",()=>{
    expect(createAnalystBrief(
      analyzeSocSignals([])
    )).toContain("Decision:");
  });
});
