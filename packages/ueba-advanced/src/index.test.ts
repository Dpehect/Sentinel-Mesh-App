import {describe,expect,it} from "vitest";
import {
  analyzeAdvancedBehavior,
  createAdvancedUebaSummary
} from "./index.js";

const profile = {
  entityId:"user-1",
  peerGroup:"finance",
  lastActiveAt:"2026-04-01T00:00:00.000Z",
  usualCountries:["TR"],
  usualActions:["login","read-report"],
  averageDailyEvents:10,
  averageDataTransferMb:20,
  privileged:true
};

describe("UEBA 2.0",()=>{
  it("contains dormant privileged account activity",()=>{
    const report = analyzeAdvancedBehavior([profile],[{
      id:"e1",entityId:"user-1",peerGroup:"finance",
      timestamp:"2026-07-20T10:00:00.000Z",
      action:"login",country:"TR",success:true
    }],[],new Date("2026-07-20T10:00:00.000Z"));

    expect(report.decision).toBe("contain");
    expect(report.findings.some(item=>item.ruleId==="UEBA2-DORMANT-001")).toBe(true);
  });

  it("detects impossible travel",()=>{
    const activeProfile = {...profile,lastActiveAt:"2026-07-19T00:00:00.000Z"};
    const report = analyzeAdvancedBehavior([activeProfile],[
      {
        id:"a",entityId:"user-1",peerGroup:"finance",
        timestamp:"2026-07-20T10:00:00.000Z",
        action:"login",country:"TR",latitude:41.0082,longitude:28.9784,success:true
      },
      {
        id:"b",entityId:"user-1",peerGroup:"finance",
        timestamp:"2026-07-20T11:00:00.000Z",
        action:"login",country:"US",latitude:40.7128,longitude:-74.0060,success:true
      }
    ],[],new Date("2026-07-20T12:00:00.000Z"));

    expect(report.findings.some(item=>item.ruleId==="UEBA2-TRAVEL-001")).toBe(true);
    expect(report.decision).toBe("contain");
  });

  it("detects suspicious authentication sequence",()=>{
    const activeProfile = {...profile,lastActiveAt:"2026-07-19T00:00:00.000Z"};
    const events = [
      ...[1,2,3].map(n=>({
        id:`f${n}`,entityId:"user-1",peerGroup:"finance",
        timestamp:`2026-07-20T10:0${n}:00.000Z`,
        action:"login",success:false
      })),
      {
        id:"success",entityId:"user-1",peerGroup:"finance",
        timestamp:"2026-07-20T10:05:00.000Z",
        action:"login",success:true
      },
      {
        id:"priv",entityId:"user-1",peerGroup:"finance",
        timestamp:"2026-07-20T10:10:00.000Z",
        action:"data-export",success:true,privileged:true
      }
    ];

    const report = analyzeAdvancedBehavior([activeProfile],events,[]);
    expect(report.findings.some(item=>item.ruleId==="UEBA2-SEQUENCE-001")).toBe(true);
  });

  it("creates a compact summary",()=>{
    expect(createAdvancedUebaSummary(
      analyzeAdvancedBehavior([],[],[])
    )).toContain("UEBA 2.0 decision:");
  });
});
