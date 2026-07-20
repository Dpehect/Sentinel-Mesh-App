import type {
  AgentUpdateManifest,
  UpdateAgent,
  UpdateAttempt,
  UpdateDecision,
  UpdateRolloutReport
} from "./types.js";

export type {
  AgentUpdateManifest,
  UpdateAgent,
  UpdateAttempt,
  UpdateDecision,
  UpdateRolloutReport
} from "./types.js";

function parseVersion(version:string):number[]{
  return version.split(".").map(part=>Number.parseInt(part,10)||0);
}

export function compareVersions(left:string,right:string):number{
  const a=parseVersion(left), b=parseVersion(right);
  const length=Math.max(a.length,b.length);
  for(let i=0;i<length;i+=1){
    const av=a[i]??0,bv=b[i]??0;
    if(av>bv)return 1;
    if(av<bv)return -1;
  }
  return 0;
}

export function validateUpdateManifest(
  manifest:AgentUpdateManifest,
  trustedSigners:string[]
):string[]{
  const errors:string[]=[];
  if(!/^[a-f0-9]{64}$/i.test(manifest.artifactSha256)){
    errors.push("INVALID_SHA256");
  }
  if(!manifest.signature || manifest.signature.length<32){
    errors.push("INVALID_SIGNATURE");
  }
  if(!trustedSigners.includes(manifest.signerId)){
    errors.push("UNTRUSTED_SIGNER");
  }
  if(manifest.rolloutPercent<0 || manifest.rolloutPercent>100){
    errors.push("INVALID_ROLLOUT_PERCENT");
  }
  return errors;
}

export function evaluateAgentUpdate(
  agent:UpdateAgent,
  manifest:AgentUpdateManifest
):UpdateDecision{
  if(agent.platform!==manifest.platform){
    return{eligible:false,reason:"PLATFORM_MISMATCH"};
  }
  if(agent.status!=="healthy"){
    return{eligible:false,reason:"AGENT_NOT_HEALTHY"};
  }
  if(compareVersions(agent.version,manifest.version)>=0){
    return{eligible:false,reason:"VERSION_NOT_NEWER"};
  }
  if(
    manifest.minimumCurrentVersion &&
    compareVersions(agent.version,manifest.minimumCurrentVersion)<0
  ){
    return{eligible:false,reason:"CURRENT_VERSION_TOO_OLD"};
  }
  if(agent.stableBucket>=manifest.rolloutPercent){
    return{eligible:false,reason:"OUTSIDE_ROLLOUT_BUCKET"};
  }
  return{eligible:true};
}

export function evaluateRollout(
  agents:UpdateAgent[],
  manifest:AgentUpdateManifest,
  attempts:UpdateAttempt[]
):UpdateRolloutReport{
  const eligibleAgents:string[]=[];
  const skippedAgents:string[]=[];

  for(const agent of agents){
    const decision=evaluateAgentUpdate(agent,manifest);
    (decision.eligible?eligibleAgents:skippedAgents).push(agent.id);
  }

  const relevant=attempts.filter(item=>item.toVersion===manifest.version);
  const failedAgents=[...new Set(
    relevant.filter(item=>!item.success).map(item=>item.agentId)
  )];
  const rollbackAgents=[...new Set(
    relevant.filter(item=>item.success&&!item.healthCheckPassed).map(item=>item.agentId)
  )];

  const successful=relevant.filter(
    item=>item.success&&item.healthCheckPassed
  ).length;
  const successRate=relevant.length
    ? Math.round(successful/relevant.length*100)
    : 100;

  const decision=rollbackAgents.length>0 || successRate<70
    ?"rollback"
    : failedAgents.length>0 || successRate<90
      ?"pause"
      :"continue";

  return{
    eligibleAgents,
    skippedAgents,
    failedAgents,
    rollbackAgents,
    successRate,
    decision
  };
}

export function verifyArtifactChecksum(
  expectedSha256:string,
  actualSha256:string
):boolean{
  return expectedSha256.toLowerCase()===actualSha256.toLowerCase();
}

export function createUpdateSummary(report:UpdateRolloutReport):string{
  return[
    `Update rollout decision: ${report.decision}`,
    `Eligible agents: ${report.eligibleAgents.length}`,
    `Skipped agents: ${report.skippedAgents.length}`,
    `Failed agents: ${report.failedAgents.length}`,
    `Rollback agents: ${report.rollbackAgents.length}`,
    `Success rate: ${report.successRate}%`
  ].join("\n");
}
