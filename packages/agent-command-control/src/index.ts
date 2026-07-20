import {createHash} from "node:crypto";
import type {
  AgentCommand,
  AgentCommandDecision,
  AgentCommandPolicy,
  AgentCommandReport,
  AgentCommandResult,
  AgentCommandState
} from "./types.js";

export type {
  AgentCommand,
  AgentCommandDecision,
  AgentCommandPolicy,
  AgentCommandReport,
  AgentCommandResult,
  AgentCommandState,
  AgentCommandType
} from "./types.js";

export function computeCommandDigest(command:AgentCommand):string{
  return createHash("sha256").update([
    command.id,
    command.tenantId,
    command.agentId,
    command.type,
    command.issuedAt,
    command.expiresAt,
    command.sequence,
    command.nonce,
    command.signerId,
    JSON.stringify(command.parameters ?? {})
  ].join("|")).digest("hex");
}

export function validateAgentCommand(
  state:AgentCommandState,
  command:AgentCommand,
  policy:AgentCommandPolicy,
  now=new Date()
):AgentCommandDecision{
  if(command.tenantId!==state.tenantId){
    return{accepted:false,reason:"TENANT_MISMATCH"};
  }
  if(command.agentId!==state.agentId){
    return{accepted:false,reason:"AGENT_MISMATCH"};
  }
  if(!policy.trustedSigners.includes(command.signerId)){
    return{accepted:false,reason:"UNTRUSTED_SIGNER"};
  }
  if(!policy.allowedCommands.includes(command.type)){
    return{accepted:false,reason:"COMMAND_NOT_ALLOWED"};
  }
  if(command.signature.length<32){
    return{accepted:false,reason:"INVALID_SIGNATURE"};
  }
  if(state.executedCommandIds.includes(command.id)){
    return{accepted:false,reason:"COMMAND_REPLAY"};
  }
  if(state.usedNonces.includes(command.nonce)){
    return{accepted:false,reason:"NONCE_REPLAY"};
  }
  if(command.sequence<=state.lastSequence){
    return{accepted:false,reason:"SEQUENCE_REPLAY"};
  }

  const issuedAt=new Date(command.issuedAt).getTime();
  const expiresAt=new Date(command.expiresAt).getTime();
  const current=now.getTime();

  if(current<issuedAt){
    return{accepted:false,reason:"COMMAND_NOT_YET_VALID"};
  }
  if(current>expiresAt){
    return{accepted:false,reason:"COMMAND_EXPIRED"};
  }
  if((expiresAt-issuedAt)/1000>policy.maxLifetimeSeconds){
    return{accepted:false,reason:"COMMAND_LIFETIME_TOO_LONG"};
  }

  const approvalRequired =
    command.requiresApproval ||
    policy.approvalRequiredFor.includes(command.type);

  if(approvalRequired&&!command.approvedBy){
    return{accepted:false,reason:"APPROVAL_REQUIRED"};
  }

  return{accepted:true};
}

export function evaluateAgentCommands(
  state:AgentCommandState,
  commands:AgentCommand[],
  policy:AgentCommandPolicy,
  now=new Date()
):AgentCommandReport{
  const acceptedCommandIds:string[]=[];
  const rejectedCommandIds:string[]=[];
  const findings:string[]=[];
  let lastSequence=state.lastSequence;
  const executed=new Set(state.executedCommandIds);
  const nonces=new Set(state.usedNonces);

  for(const command of [...commands].sort((a,b)=>a.sequence-b.sequence)){
    const decision=validateAgentCommand(
      {...state,lastSequence,executedCommandIds:[...executed],usedNonces:[...nonces]},
      command,
      policy,
      now
    );

    if(decision.accepted){
      acceptedCommandIds.push(command.id);
      lastSequence=command.sequence;
      executed.add(command.id);
      nonces.add(command.nonce);
    }else{
      rejectedCommandIds.push(command.id);
      findings.push(`${command.id}:${decision.reason}`);
    }
  }

  const severe=findings.some(item=>
    /TENANT_MISMATCH|AGENT_MISMATCH|UNTRUSTED_SIGNER|REPLAY|INVALID_SIGNATURE/.test(item)
  );

  return{
    acceptedCommandIds,
    rejectedCommandIds,
    findings,
    nextState:{
      ...state,
      lastSequence,
      executedCommandIds:[...executed],
      usedNonces:[...nonces]
    },
    decision:severe
      ?"reject"
      :rejectedCommandIds.length>0
        ?"review"
        :"execute"
  };
}

export function verifyCommandResult(
  result:AgentCommandResult,
  expectedAgentId:string,
  expectedCommandId:string
):boolean{
  return(
    result.agentId===expectedAgentId &&
    result.commandId===expectedCommandId &&
    /^[a-f0-9]{64}$/i.test(result.resultHash)
  );
}

export function createCommandControlSummary(
  report:AgentCommandReport
):string{
  return[
    `Agent command decision: ${report.decision}`,
    `Accepted commands: ${report.acceptedCommandIds.length}`,
    `Rejected commands: ${report.rejectedCommandIds.length}`,
    `Findings: ${report.findings.length}`
  ].join("\n");
}
