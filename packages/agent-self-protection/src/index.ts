import type {
  MaintenanceWindow,
  ProtectionEvent,
  ProtectionFinding,
  ProtectionPolicy,
  SelfProtectionReport
} from "./types.js";

export type {
  MaintenanceWindow,
  ProtectionEvent,
  ProtectionEventType,
  ProtectionFinding,
  ProtectionPolicy,
  SelfProtectionReport
} from "./types.js";

function isProtectedPath(path:string|undefined,protectedPaths:string[]):boolean{
  if(!path)return false;
  const normalized=path.toLowerCase();
  return protectedPaths.some(item=>
    normalized===item.toLowerCase() ||
    normalized.startsWith(`${item.toLowerCase()}/`) ||
    normalized.startsWith(`${item.toLowerCase()}\\`)
  );
}

function isAuthorizedMaintenance(
  event:ProtectionEvent,
  windows:MaintenanceWindow[]
):boolean{
  if(!event.authorizedMaintenanceId)return false;
  const window=windows.find(item=>
    item.id===event.authorizedMaintenanceId &&
    item.tenantId===event.tenantId &&
    item.agentIds.includes(event.agentId) &&
    item.allowedEventTypes.includes(event.type)
  );
  if(!window)return false;
  const time=new Date(event.timestamp).getTime();
  return time>=new Date(window.startsAt).getTime() &&
    time<=new Date(window.endsAt).getTime();
}

export function evaluateSelfProtection(
  events:ProtectionEvent[],
  windows:MaintenanceWindow[],
  policy:ProtectionPolicy
):SelfProtectionReport{
  const findings:ProtectionFinding[]=[];
  const authorizedEvents:string[]=[];

  for(const event of events){
    if(isAuthorizedMaintenance(event,windows)){
      authorizedEvents.push(event.id);
      continue;
    }

    const trustedActor =
      event.actorSigner !== undefined &&
      policy.trustedActorSigners.includes(event.actorSigner);

    if(event.type==="service-stop" || event.type==="uninstall-attempt"){
      findings.push({
        eventId:event.id,
        severity:"critical",
        code:event.type==="service-stop"
          ?"UNAUTHORIZED_SERVICE_STOP"
          :"UNAUTHORIZED_UNINSTALL_ATTEMPT",
        action:"quarantine"
      });
      continue;
    }

    if(event.type==="debugger-attach"){
      findings.push({
        eventId:event.id,
        severity:"critical",
        code:"DEBUGGER_ATTACHED_TO_AGENT",
        action:"quarantine"
      });
      continue;
    }

    if(event.type==="watchdog-missed"){
      findings.push({
        eventId:event.id,
        severity:"high",
        code:"AGENT_WATCHDOG_MISSED",
        action:"alert"
      });
      continue;
    }

    if(
      ["binary-write","binary-delete","config-write","config-delete","permission-change"]
        .includes(event.type) &&
      isProtectedPath(event.targetPath,policy.protectedPaths) &&
      !trustedActor
    ){
      const destructive=["binary-delete","config-delete"].includes(event.type);
      findings.push({
        eventId:event.id,
        severity:destructive?"critical":"high",
        code:`UNAUTHORIZED_${event.type.toUpperCase().replaceAll("-","_")}`,
        action:destructive?"restore":"quarantine"
      });
    }
  }

  const restoreTargets=[...new Set(
    findings
      .filter(item=>item.action==="restore")
      .map(item=>events.find(event=>event.id===item.eventId)?.targetPath)
      .filter((value):value is string=>Boolean(value))
  )];

  const quarantineAgents=[...new Set(
    findings
      .filter(item=>item.action==="quarantine")
      .map(item=>events.find(event=>event.id===item.eventId)?.agentId)
      .filter((value):value is string=>Boolean(value))
  )];

  return{
    findings,
    authorizedEvents,
    restoreTargets,
    quarantineAgents,
    decision:quarantineAgents.length>0
      ?"quarantine"
      :restoreTargets.length>0
        ?"repair"
        :"healthy"
  };
}

export function createSelfProtectionSummary(
  report:SelfProtectionReport
):string{
  return[
    `Agent self-protection decision: ${report.decision}`,
    `Findings: ${report.findings.length}`,
    `Authorized maintenance events: ${report.authorizedEvents.length}`,
    `Restore targets: ${report.restoreTargets.length}`,
    `Quarantine agents: ${report.quarantineAgents.length}`
  ].join("\n");
}
