import{describe,expect,it}from"vitest";
import{evaluateSelfProtection}from"./index.js";

const policy={
  trustedActorSigners:["sentinel-release"],
  protectedPaths:["/opt/sentinel","C:\\Program Files\\Sentinel"],
  maximumWatchdogGapSeconds:120
};

describe("agent self protection",()=>{
  it("quarantines unauthorized service stops",()=>{
    const report=evaluateSelfProtection([{
      id:"e1",tenantId:"org-1",agentId:"agent-1",
      timestamp:"2026-07-20T10:00:00.000Z",
      type:"service-stop",actorProcess:"systemctl"
    }],[],policy);

    expect(report.decision).toBe("quarantine");
    expect(report.quarantineAgents).toEqual(["agent-1"]);
  });

  it("requests restoration after protected binary deletion",()=>{
    const report=evaluateSelfProtection([{
      id:"e1",tenantId:"org-1",agentId:"agent-1",
      timestamp:"2026-07-20T10:00:00.000Z",
      type:"binary-delete",targetPath:"/opt/sentinel/agent",
      actorSigner:"unknown"
    }],[],policy);

    expect(report.decision).toBe("repair");
    expect(report.restoreTargets).toEqual(["/opt/sentinel/agent"]);
  });

  it("allows approved maintenance events",()=>{
    const report=evaluateSelfProtection([{
      id:"e1",tenantId:"org-1",agentId:"agent-1",
      timestamp:"2026-07-20T10:05:00.000Z",
      type:"service-stop",authorizedMaintenanceId:"mw-1"
    }],[{
      id:"mw-1",tenantId:"org-1",agentIds:["agent-1"],
      startsAt:"2026-07-20T10:00:00.000Z",
      endsAt:"2026-07-20T10:10:00.000Z",
      allowedEventTypes:["service-stop"],
      approvedBy:"admin-1"
    }],policy);

    expect(report.decision).toBe("healthy");
    expect(report.authorizedEvents).toEqual(["e1"]);
  });

  it("quarantines debugger attachment attempts",()=>{
    const report=evaluateSelfProtection([{
      id:"e1",tenantId:"org-1",agentId:"agent-1",
      timestamp:"2026-07-20T10:00:00.000Z",
      type:"debugger-attach",actorProcess:"gdb"
    }],[],policy);

    expect(report.findings[0].code).toBe("DEBUGGER_ATTACHED_TO_AGENT");
  });
});
