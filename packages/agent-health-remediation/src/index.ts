import type {
  AgentHealthSnapshot,
  AgentRemediationPlan,
  RemediationAction,
  RemediationHistoryItem,
  RemediationPlanItem,
  RemediationPolicy
} from "./types.js";

export type {
  AgentHealthSnapshot,
  AgentRemediationPlan,
  RemediationAction,
  RemediationHistoryItem,
  RemediationPlanItem,
  RemediationPolicy
} from "./types.js";

const recommendationMap: Record<string,RemediationAction> = {
  "repair-telemetry-integrity":"restart-telemetry",
  "quarantine-and-reattest":"reattest-runtime",
  "rotate-agent-certificate":"rotate-certificate",
  "reapply-agent-policy":"refresh-policy",
  "schedule-agent-update":"schedule-update",
  "reduce-agent-workload":"reduce-workload",
  "inspect-agent-connectivity":"collect-triage",
  "investigate-agent-tampering":"collect-triage"
};

function priorityFor(action:RemediationAction,score:number):number{
  const base:Record<RemediationAction,number>={
    "isolate-network":100,
    "collect-triage":90,
    "reattest-runtime":85,
    "rotate-certificate":80,
    "restart-telemetry":75,
    "refresh-policy":70,
    "schedule-update":60,
    "reduce-workload":50
  };
  return Math.min(100,base[action]+Math.max(0,50-score));
}

function inCooldown(
  agentId:string,
  action:RemediationAction,
  history:RemediationHistoryItem[],
  cooldownMinutes:number,
  now:Date
):boolean{
  const cutoff=now.getTime()-cooldownMinutes*60*1000;
  return history.some(item=>
    item.agentId===agentId &&
    item.action===action &&
    new Date(item.executedAt).getTime()>=cutoff
  );
}

export function planAgentRemediation(
  snapshots:AgentHealthSnapshot[],
  history:RemediationHistoryItem[],
  policy:RemediationPolicy,
  now=new Date()
):AgentRemediationPlan{
  const actions:RemediationPlanItem[]=[];
  const deferredActions:RemediationPlanItem[]=[];
  const skippedAgents:string[]=[];

  for(const snapshot of snapshots){
    if(snapshot.status==="healthy"){
      skippedAgents.push(snapshot.agentId);
      continue;
    }

    const requested=new Set<RemediationAction>();

    for(const recommendation of snapshot.recommendations){
      const mapped=recommendationMap[recommendation];
      if(mapped)requested.add(mapped);
    }

    const containmentRequired=
      snapshot.status==="critical" &&
      (
        snapshot.score<=policy.containmentScoreThreshold ||
        snapshot.criticalFindings.some(item=>
          /COMPROMISED|TAMPER|ATTESTATION|REPLAY/.test(item)
        )
      );

    if(containmentRequired)requested.add("isolate-network");

    let count=0;
    for(const action of [...requested]){
      if(count>=policy.maximumActionsPerAgent)break;

      const item:RemediationPlanItem={
        agentId:snapshot.agentId,
        action,
        priority:priorityFor(action,snapshot.score),
        requiresApproval:policy.approvalRequiredActions.includes(action),
        reason:containmentRequired&&action==="isolate-network"
          ?"Critical agent health requires containment"
          :`Health recommendation mapped to ${action}`
      };

      if(inCooldown(
        snapshot.agentId,
        action,
        history,
        policy.cooldownMinutes,
        now
      )){
        deferredActions.push(item);
        continue;
      }

      if(
        !policy.automaticActions.includes(action) &&
        !policy.approvalRequiredActions.includes(action)
      ){
        deferredActions.push(item);
        continue;
      }

      actions.push(item);
      count+=1;
    }
  }

  actions.sort((a,b)=>b.priority-a.priority);

  return{
    actions,
    deferredActions,
    skippedAgents,
    decision:actions.some(item=>item.action==="isolate-network")
      ?"contain"
      :actions.length>0
        ?"remediate"
        :"none"
  };
}

export function createRemediationSummary(plan:AgentRemediationPlan):string{
  return[
    `Remediation decision: ${plan.decision}`,
    `Planned actions: ${plan.actions.length}`,
    `Deferred actions: ${plan.deferredActions.length}`,
    `Skipped agents: ${plan.skippedAgents.length}`
  ].join("\n");
}
