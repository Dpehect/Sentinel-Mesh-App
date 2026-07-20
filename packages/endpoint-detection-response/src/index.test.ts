import {describe,expect,it} from "vitest";
import {analyzeEndpointEvents,createEdrSummary} from "./index.js";

describe("endpoint detection and response",()=>{
  it("isolates credential dumping activity",()=>{
    const report = analyzeEndpointEvents([{
      id:"e1",tenantId:"org-1",endpointId:"host-1",
      timestamp:"2026-07-20T10:00:00.000Z",
      type:"process-start",processId:"100",process:"procdump.exe",
      commandLine:"procdump.exe -ma lsass.exe",path:"C:\\Temp\\procdump.exe",
      signed:false
    }]);

    expect(report.decision).toBe("contain");
    expect(report.detections.some(item=>item.ruleId==="EDR-CRED-001")).toBe(true);
  });

  it("detects Office child-process abuse",()=>{
    const report = analyzeEndpointEvents([
      {
        id:"p1",tenantId:"org-1",endpointId:"host-2",
        timestamp:"2026-07-20T10:00:00.000Z",
        type:"process-start",processId:"10",process:"winword.exe"
      },
      {
        id:"p2",tenantId:"org-1",endpointId:"host-2",
        timestamp:"2026-07-20T10:00:01.000Z",
        type:"process-start",processId:"11",parentProcessId:"10",
        process:"powershell.exe",commandLine:"powershell -enc AAA"
      }
    ]);

    expect(report.detections.some(item=>item.ruleId==="EDR-PROCTREE-001")).toBe(true);
    expect(report.decision).toBe("contain");
  });

  it("detects ransomware-style file writes",()=>{
    const events = [1,2,3,4,5].map(n=>({
      id:`f${n}`,tenantId:"org-1",endpointId:"host-3",
      timestamp:`2026-07-20T10:00:0${n}.000Z`,
      type:"file-write" as const,path:`C:\\Data\\file${n}.locked`
    }));
    const report = analyzeEndpointEvents(events);
    expect(report.detections.some(item=>item.ruleId==="EDR-RANSOM-001")).toBe(true);
  });

  it("creates a compact summary",()=>{
    expect(createEdrSummary(analyzeEndpointEvents([]))).toContain("EDR decision:");
  });
});
