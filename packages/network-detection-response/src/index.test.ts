import {describe,expect,it} from "vitest";
import {analyzeNetworkFlows,createNdrSummary} from "./index.js";

describe("network detection and response",()=>{
  it("detects lateral movement",()=>{
    const flows = [1,2,3,4].map((n)=>({
      id:`f${n}`,tenantId:"org-1",
      timestamp:`2026-07-20T10:0${n}:00.000Z`,
      sourceIp:"10.0.0.10",destinationIp:`10.0.0.${n+20}`,
      destinationPort:445,protocol:"smb" as const,
      bytesSent:1000,bytesReceived:500,durationSeconds:2,
      internalSource:true,internalDestination:true
    }));
    const report = analyzeNetworkFlows(flows);
    expect(report.decision).toBe("contain");
    expect(report.detections.some(item=>item.ruleId==="NDR-LATERAL-001")).toBe(true);
  });

  it("detects DNS tunneling",()=>{
    const report = analyzeNetworkFlows([{
      id:"dns-1",tenantId:"org-1",timestamp:"2026-07-20T10:00:00.000Z",
      sourceIp:"10.0.0.5",destinationIp:"8.8.8.8",destinationPort:53,
      protocol:"dns",bytesSent:200,bytesReceived:100,durationSeconds:1,
      dnsQuery:`${"a".repeat(50)}.example.com`,internalSource:true
    }]);
    expect(report.detections.some(item=>item.ruleId==="NDR-DNS-001")).toBe(true);
  });

  it("contains malicious destination traffic",()=>{
    const report = analyzeNetworkFlows([{
      id:"c2-1",tenantId:"org-1",timestamp:"2026-07-20T10:00:00.000Z",
      sourceIp:"10.0.0.7",destinationIp:"203.0.113.50",destinationPort:443,
      protocol:"https",bytesSent:1200,bytesReceived:800,durationSeconds:4,
      internalSource:true,destinationReputation:"malicious"
    }]);
    expect(report.decision).toBe("contain");
    expect(report.isolatedSources).toEqual(["10.0.0.7"]);
  });

  it("creates a compact summary",()=>{
    expect(createNdrSummary(analyzeNetworkFlows([]))).toContain("NDR decision:");
  });
});
