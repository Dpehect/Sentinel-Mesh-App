import{describe,expect,it}from"vitest";
import{planAgentRemediation}from"./index.js";

const policy={
  automaticActions:[
    "refresh-policy",
    "rotate-certificate",
    "schedule-update",
    "restart-telemetry",
    "reduce-workload",
    "collect-triage",
    "reattest-runtime"
  ] as const,
  approvalRequiredActions:["isolate-network"] as const,
  cooldownMinutes:30,
  maximumActionsPerAgent:3,
  containmentScoreThreshold:35
};

describe("agent health remediation",()=>{
  it("maps health recommendations to safe actions",()=>{
    const plan=planAgentRemediation([{
      agentId:"agent-1",
      score:65,
      status:"degraded",
      recommendations:["rotate-agent-certificate","reapply-agent-policy"],
      criticalFindings:[],
      observedAt:"2026-07-20T10:00:00.000Z"
    }],[],{
      ...policy,
      automaticActions:[...policy.automaticActions],
      approvalRequiredActions:[...policy.approvalRequiredActions]
    });

    expect(plan.decision).toBe("remediate");
    expect(plan.actions.map(item=>item.action)).toContain("rotate-certificate");
    expect(plan.actions.map(item=>item.action)).toContain("refresh-policy");
  });

  it("requires containment for compromised critical agents",()=>{
    const plan=planAgentRemediation([{
      agentId:"agent-2",
      score:20,
      status:"critical",
      recommendations:["investigate-agent-tampering"],
      criticalFindings:["KEY_COMPROMISED"],
      observedAt:"2026-07-20T10:00:00.000Z"
    }],[],{
      ...policy,
      automaticActions:[...policy.automaticActions],
      approvalRequiredActions:[...policy.approvalRequiredActions]
    });

    expect(plan.decision).toBe("contain");
    expect(plan.actions.some(item=>
      item.action==="isolate-network"&&item.requiresApproval
    )).toBe(true);
  });

  it("defers actions during cooldown",()=>{
    const plan=planAgentRemediation([{
      agentId:"agent-1",
      score:60,
      status:"degraded",
      recommendations:["schedule-agent-update"],
      criticalFindings:[],
      observedAt:"2026-07-20T10:00:00.000Z"
    }],[{
      agentId:"agent-1",
      action:"schedule-update",
      executedAt:"2026-07-20T09:50:00.000Z",
      success:true
    }],{
      ...policy,
      automaticActions:[...policy.automaticActions],
      approvalRequiredActions:[...policy.approvalRequiredActions]
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(plan.actions).toHaveLength(0);
    expect(plan.deferredActions).toHaveLength(1);
  });

  it("skips healthy agents",()=>{
    const plan=planAgentRemediation([{
      agentId:"agent-healthy",
      score:95,
      status:"healthy",
      recommendations:[],
      criticalFindings:[],
      observedAt:"2026-07-20T10:00:00.000Z"
    }],[],{
      ...policy,
      automaticActions:[...policy.automaticActions],
      approvalRequiredActions:[...policy.approvalRequiredActions]
    });

    expect(plan.skippedAgents).toEqual(["agent-healthy"]);
    expect(plan.decision).toBe("none");
  });
});
