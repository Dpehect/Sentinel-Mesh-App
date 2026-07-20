import type {
  AgentPolicyBundle,
  PolicyAgent,
  PolicyApplication,
  PolicyDecision,
  PolicyDistributionReport
} from "./types.js";

export type {
  AgentPolicyBundle,
  PolicyAgent,
  PolicyApplication,
  PolicyDecision,
  PolicyDistributionReport
} from "./types.js";

export function validatePolicyBundle(
  bundle:AgentPolicyBundle,
  trustedSigners:string[]
):string[]{
  const errors:string[]=[];
  if(!/^[a-f0-9]{64}$/i.test(bundle.checksumSha256)){
    errors.push("INVALID_CHECKSUM");
  }
  if(!bundle.signature || bundle.signature.length<32){
    errors.push("INVALID_SIGNATURE");
  }
  if(!trustedSigners.includes(bundle.signerId)){
    errors.push("UNTRUSTED_SIGNER");
  }
  if(Object.keys(bundle.settings).length===0){
    errors.push("EMPTY_POLICY");
  }
  return errors;
}

export function evaluatePolicyTarget(
  agent:PolicyAgent,
  bundle:AgentPolicyBundle
):PolicyDecision{
  if(agent.tenantId!==bundle.tenantId){
    return{eligible:false,reason:"TENANT_MISMATCH"};
  }
  if(agent.status!=="active"){
    return{eligible:false,reason:"AGENT_NOT_ACTIVE"};
  }
  if(
    bundle.targetPlatforms.length>0 &&
    !bundle.targetPlatforms.includes(agent.platform)
  ){
    return{eligible:false,reason:"PLATFORM_NOT_TARGETED"};
  }
  if(
    bundle.targetTags.length>0 &&
    !bundle.targetTags.every(tag=>agent.tags.includes(tag))
  ){
    return{eligible:false,reason:"TAG_NOT_TARGETED"};
  }
  if(agent.currentPolicyVersion===bundle.version){
    return{eligible:false,reason:"POLICY_ALREADY_CURRENT"};
  }
  return{eligible:true};
}

export function detectPolicyDrift(
  agents:PolicyAgent[],
  bundle:AgentPolicyBundle
):string[]{
  return agents
    .filter(agent =>
      agent.tenantId===bundle.tenantId &&
      agent.currentPolicyVersion===bundle.version &&
      agent.currentPolicyChecksum?.toLowerCase()!==
        bundle.checksumSha256.toLowerCase()
    )
    .map(agent=>agent.id);
}

export function evaluatePolicyDistribution(
  agents:PolicyAgent[],
  bundle:AgentPolicyBundle,
  applications:PolicyApplication[]
):PolicyDistributionReport{
  const eligibleAgents:string[]=[];
  const skippedAgents:string[]=[];

  for(const agent of agents){
    const decision=evaluatePolicyTarget(agent,bundle);
    (decision.eligible?eligibleAgents:skippedAgents).push(agent.id);
  }

  const relevant=applications.filter(item=>
    item.policyId===bundle.id && item.version===bundle.version
  );

  const failedAgents=[...new Set(
    relevant.filter(item=>!item.applied).map(item=>item.agentId)
  )];

  const rollbackAgents=[...new Set(
    relevant
      .filter(item=>item.applied&&!item.healthCheckPassed)
      .map(item=>item.agentId)
  )];

  const driftedAgents=detectPolicyDrift(agents,bundle);

  const decision=rollbackAgents.length>0
    ?"rollback"
    : failedAgents.length>0 || driftedAgents.length>0
      ?"pause"
      :"continue";

  return{
    eligibleAgents,
    skippedAgents,
    driftedAgents,
    failedAgents,
    rollbackAgents,
    decision
  };
}

export function createPolicyDistributionSummary(
  report:PolicyDistributionReport
):string{
  return[
    `Policy distribution decision: ${report.decision}`,
    `Eligible agents: ${report.eligibleAgents.length}`,
    `Skipped agents: ${report.skippedAgents.length}`,
    `Drifted agents: ${report.driftedAgents.length}`,
    `Failed agents: ${report.failedAgents.length}`,
    `Rollback agents: ${report.rollbackAgents.length}`
  ].join("\n");
}
