import type {
  AgentFleetHealthReport,
  AgentHealthInput,
  AgentHealthResult,
  AgentHealthWeights
} from "./types.js";

export type {
  AgentFleetHealthReport,
  AgentHealthInput,
  AgentHealthResult,
  AgentHealthStatus,
  AgentHealthWeights
} from "./types.js";

function clamp(value:number):number{
  return Math.max(0,Math.min(100,value));
}

export function scoreAgentHealth(
  input:AgentHealthInput,
  weights:AgentHealthWeights
):AgentHealthResult{
  const pairs = [
    [input.telemetryIntegrityScore,weights.telemetryIntegrity],
    [input.runtimeAttestationScore,weights.runtimeAttestation],
    [input.certificateScore,weights.certificate],
    [input.policyComplianceScore,weights.policyCompliance],
    [input.updateComplianceScore,weights.updateCompliance],
    [input.resourceHealthScore,weights.resourceHealth],
    [input.connectivityScore,weights.connectivity],
    [input.selfProtectionScore,weights.selfProtection]
  ] as const;

  const totalWeight=pairs.reduce((sum,[,weight])=>sum+weight,0);
  const weightedScore=totalWeight>0
    ?pairs.reduce((sum,[score,weight])=>sum+clamp(score)*weight,0)/totalWeight
    :0;

  const penalties:string[]=[];
  let penaltyPoints=0;

  for(const finding of input.criticalFindings){
    penalties.push(finding);
    penaltyPoints+=finding.includes("COMPROMISED")||finding.includes("TAMPER")
      ?25
      :15;
  }

  const score=clamp(Math.round(weightedScore-penaltyPoints));
  const status=score>=80
    ?"healthy"
    :score>=50
      ?"degraded"
      :"critical";

  const recommendations:string[]=[];
  if(input.telemetryIntegrityScore<70)recommendations.push("repair-telemetry-integrity");
  if(input.runtimeAttestationScore<70)recommendations.push("quarantine-and-reattest");
  if(input.certificateScore<70)recommendations.push("rotate-agent-certificate");
  if(input.policyComplianceScore<70)recommendations.push("reapply-agent-policy");
  if(input.updateComplianceScore<70)recommendations.push("schedule-agent-update");
  if(input.resourceHealthScore<60)recommendations.push("reduce-agent-workload");
  if(input.connectivityScore<60)recommendations.push("inspect-agent-connectivity");
  if(input.selfProtectionScore<70)recommendations.push("investigate-agent-tampering");

  return{
    agentId:input.agentId,
    score,
    status,
    penalties,
    recommendations:[...new Set(recommendations)]
  };
}

export function evaluateFleetHealth(
  inputs:AgentHealthInput[],
  weights:AgentHealthWeights
):AgentFleetHealthReport{
  const agents=inputs.map(input=>scoreAgentHealth(input,weights));
  const averageScore=agents.length
    ?Math.round(agents.reduce((sum,item)=>sum+item.score,0)/agents.length)
    :100;

  const healthyAgents=agents.filter(item=>item.status==="healthy").map(item=>item.agentId);
  const degradedAgents=agents.filter(item=>item.status==="degraded").map(item=>item.agentId);
  const criticalAgents=agents.filter(item=>item.status==="critical").map(item=>item.agentId);

  return{
    agents,
    averageScore,
    healthyAgents,
    degradedAgents,
    criticalAgents,
    decision:criticalAgents.length>0
      ?"contain"
      :degradedAgents.length>0 || averageScore<80
        ?"investigate"
        :"healthy"
  };
}

export function createFleetHealthSummary(report:AgentFleetHealthReport):string{
  return[
    `Fleet health decision: ${report.decision}`,
    `Average score: ${report.averageScore}`,
    `Healthy agents: ${report.healthyAgents.length}`,
    `Degraded agents: ${report.degradedAgents.length}`,
    `Critical agents: ${report.criticalAgents.length}`
  ].join("\n");
}
