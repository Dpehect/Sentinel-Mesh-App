import {describe,expect,it} from "vitest";
import {
  matchesCondition,
  runThreatHunt
} from "./index.js";

const events = [
  {
    id:"e1",tenantId:"org-1",timestamp:"2026-07-20T10:00:00.000Z",
    source:"endpoint",type:"process-start",entityId:"user-1",assetId:"host-1",
    fields:{process:"powershell.exe",commandLine:"powershell -enc AAA"},
    evidenceIds:["ev-1"]
  },
  {
    id:"e2",tenantId:"org-1",timestamp:"2026-07-20T10:02:00.000Z",
    source:"network",type:"connection",entityId:"user-1",assetId:"host-1",
    fields:{destinationReputation:"malicious",bytesSent:1200},
    evidenceIds:["ev-2"]
  }
];

describe("threat hunting",()=>{
  it("evaluates deterministic query conditions",()=>{
    expect(matchesCondition(events[0],{
      field:"process",operator:"equals",value:"powershell.exe"
    })).toBe(true);
  });

  it("confirms multi-source compromise hypotheses",()=>{
    const report = runThreatHunt([{
      id:"hunt-1",
      name:"Encoded execution or malicious egress",
      hypothesis:"A compromised endpoint executed obfuscated code and contacted malicious infrastructure.",
      sources:["endpoint","network"],
      conditions:[
        {field:"commandLine",operator:"contains",value:"-enc"},
        {field:"destinationReputation",operator:"equals",value:"malicious"}
      ],
      conditionMode:"any",
      minimumMatches:2,
      mitreTechniques:["T1059.001","T1071"]
    }],events);

    expect(report.matches).toHaveLength(1);
    expect(report.decision).toBe("escalate");
    expect(report.matches[0].evidenceIds).toEqual(["ev-1","ev-2"]);
  });

  it("returns no findings for unmatched queries",()=>{
    const report = runThreatHunt([{
      id:"hunt-2",name:"Linux persistence",hypothesis:"Persistence exists.",
      sources:["endpoint"],
      conditions:[{field:"path",operator:"starts-with",value:"/etc/systemd"}],
      conditionMode:"all"
    }],events);

    expect(report.decision).toBe("no-findings");
  });
});
