import{describe,expect,it}from"vitest";
import{
  evaluateAgentCommands,
  validateAgentCommand,
  verifyCommandResult
}from"./index.js";

const state={
  tenantId:"org-1",
  agentId:"agent-1",
  lastSequence:0,
  executedCommandIds:[],
  usedNonces:[]
};

const policy={
  trustedSigners:["control-key-1"],
  allowedCommands:[
    "isolate-network",
    "release-isolation",
    "collect-triage",
    "scan-now",
    "rotate-agent-token",
    "refresh-policy"
  ] as const,
  maxLifetimeSeconds:300,
  approvalRequiredFor:["isolate-network","release-isolation"] as const
};

const command={
  id:"cmd-1",
  tenantId:"org-1",
  agentId:"agent-1",
  type:"isolate-network" as const,
  issuedAt:"2026-07-20T10:00:00.000Z",
  expiresAt:"2026-07-20T10:05:00.000Z",
  sequence:1,
  nonce:"nonce-1",
  signerId:"control-key-1",
  signature:"s".repeat(64),
  requiresApproval:true,
  approvedBy:"analyst-1"
};

describe("agent command control",()=>{
  it("accepts approved defensive commands",()=>{
    expect(validateAgentCommand(
      state,command,
      {
        ...policy,
        allowedCommands:[...policy.allowedCommands],
        approvalRequiredFor:[...policy.approvalRequiredFor]
      },
      new Date("2026-07-20T10:01:00.000Z")
    ).accepted).toBe(true);
  });

  it("rejects replayed command identifiers",()=>{
    const decision=validateAgentCommand(
      {...state,executedCommandIds:["cmd-1"]},
      command,
      {
        ...policy,
        allowedCommands:[...policy.allowedCommands],
        approvalRequiredFor:[...policy.approvalRequiredFor]
      },
      new Date("2026-07-20T10:01:00.000Z")
    );
    expect(decision.reason).toBe("COMMAND_REPLAY");
  });

  it("updates command sequence state",()=>{
    const report=evaluateAgentCommands(
      state,[command],
      {
        ...policy,
        allowedCommands:[...policy.allowedCommands],
        approvalRequiredFor:[...policy.approvalRequiredFor]
      },
      new Date("2026-07-20T10:01:00.000Z")
    );
    expect(report.decision).toBe("execute");
    expect(report.nextState.lastSequence).toBe(1);
  });

  it("verifies structured command results",()=>{
    expect(verifyCommandResult({
      commandId:"cmd-1",
      agentId:"agent-1",
      success:true,
      completedAt:"2026-07-20T10:02:00.000Z",
      resultHash:"a".repeat(64)
    },"agent-1","cmd-1")).toBe(true);
  });
});
