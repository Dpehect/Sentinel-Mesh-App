import {createHash} from "node:crypto";
import type {EdrReport,EndpointDetection,EndpointEvent,EndpointSeverity} from "./types.js";

export type {
  EdrReport, EndpointDetection, EndpointEvent, EndpointEventType, EndpointSeverity
} from "./types.js";

function makeDetection(
  ruleId:string,
  severity:EndpointSeverity,
  endpointId:string,
  title:string,
  events:EndpointEvent[],
  techniques:string[],
  action:EndpointDetection["action"]
):EndpointDetection {
  const eventIds = [...new Set(events.map(event=>event.id))];
  const hash = createHash("sha256")
    .update(`${ruleId}|${endpointId}|${eventIds.join("|")}`)
    .digest("hex");

  return {
    id:`edr_${hash.slice(0,16)}`,
    ruleId,endpointId,severity,title,
    evidenceEventIds:eventIds,
    mitreTechniques:[...new Set(techniques)],
    action
  };
}

function text(event:EndpointEvent):string {
  return `${event.process ?? ""} ${event.commandLine ?? ""} ${event.path ?? ""}`.toLowerCase();
}

export function analyzeEndpointEvents(events:EndpointEvent[]):EdrReport {
  const detections:EndpointDetection[] = [];
  const byEndpoint = new Map<string,EndpointEvent[]>();

  for (const event of events) {
    byEndpoint.set(event.endpointId,[...(byEndpoint.get(event.endpointId) ?? []),event]);
    const value = text(event);

    if (
      event.type === "credential-access" ||
      /mimikatz|sekurlsa|lsass|procdump.*lsass|comsvcs\.dll.*minidump/.test(value)
    ) {
      detections.push(makeDetection(
        "EDR-CRED-001","critical",event.endpointId,
        "Credential dumping behavior detected",
        [event],["T1003"],"isolate-endpoint"
      ));
    }

    if (
      event.type === "process-start" &&
      /(powershell|pwsh).*(-enc|-encodedcommand|frombase64string|iex\s*\()/.test(value)
    ) {
      detections.push(makeDetection(
        "EDR-EXEC-001","high",event.endpointId,
        "Obfuscated PowerShell execution",
        [event],["T1059.001","T1027"],"kill-process"
      ));
    }

    if (
      event.type === "security-control-change" ||
      /set-mppreference.*disablerealtimemonitoring|sc\s+stop\s+(windefend|sense)|netsh.*firewall.*off/.test(value)
    ) {
      detections.push(makeDetection(
        "EDR-DEFENSE-001","critical",event.endpointId,
        "Security controls were disabled or modified",
        [event],["T1562.001"],"isolate-endpoint"
      ));
    }

    if (
      event.type === "registry-write" &&
      /\\software\\microsoft\\windows\\currentversion\\run|\\runonce/i.test(event.registryKey ?? "")
    ) {
      detections.push(makeDetection(
        "EDR-PERSIST-001","high",event.endpointId,
        "Run-key persistence created",
        [event],["T1060","T1547.001"],"alert"
      ));
    }

    if (
      event.type === "scheduled-task-create" ||
      event.type === "service-create"
    ) {
      detections.push(makeDetection(
        event.type === "service-create" ? "EDR-PERSIST-002" : "EDR-PERSIST-003",
        "medium",event.endpointId,
        event.type === "service-create"
          ? "New system service created"
          : "New scheduled task created",
        [event],
        [event.type === "service-create" ? "T1543.003" : "T1053.005"],
        "alert"
      ));
    }

    if (
      event.type === "process-start" &&
      /vssadmin.*delete\s+shadows|wmic.*shadowcopy.*delete|bcdedit.*recoveryenabled\s+no/.test(value)
    ) {
      detections.push(makeDetection(
        "EDR-IMPACT-001","critical",event.endpointId,
        "Recovery mechanisms were deleted or disabled",
        [event],["T1490"],"isolate-endpoint"
      ));
    }
  }

  for (const [endpointId,endpointEvents] of byEndpoint) {
    const fileWrites = endpointEvents
      .filter(event=>event.type==="file-write")
      .sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());

    const ransomwareWrites = fileWrites.filter(event =>
      /\.(locked|encrypted|crypt|ryk|conti|lockbit)$/i.test(event.path ?? "")
    );

    if (ransomwareWrites.length >= 5) {
      detections.push(makeDetection(
        "EDR-RANSOM-001","critical",endpointId,
        "Mass encrypted-file creation indicates ransomware",
        ransomwareWrites,["T1486"],"isolate-endpoint"
      ));
    }

    const unsignedExecutions = endpointEvents.filter(event =>
      event.type==="process-start" &&
      event.signed===false &&
      event.trustedPublisher!==true &&
      /\\users\\|\\temp\\|\/tmp\/|\/var\/tmp\//i.test(event.path ?? "")
    );

    if (unsignedExecutions.length >= 1) {
      detections.push(makeDetection(
        "EDR-UNTRUSTED-001","high",endpointId,
        "Unsigned executable launched from user-writable directory",
        unsignedExecutions,["T1204.002"],"kill-process"
      ));
    }

    const processById = new Map(
      endpointEvents
        .filter(event=>event.processId)
        .map(event=>[event.processId!,event])
    );

    for (const event of endpointEvents.filter(item=>item.type==="process-start")) {
      const parent = event.parentProcessId
        ? processById.get(event.parentProcessId)
        : undefined;
      const parentName = (parent?.process ?? "").toLowerCase();
      const childName = (event.process ?? "").toLowerCase();

      if (
        /(winword|excel|powerpnt|outlook)(\.exe)?$/.test(parentName) &&
        /(powershell|cmd|wscript|cscript|mshta)(\.exe)?$/.test(childName)
      ) {
        detections.push(makeDetection(
          "EDR-PROCTREE-001","critical",endpointId,
          "Office application spawned a script interpreter",
          parent ? [parent,event] : [event],
          ["T1204.002","T1059"],"isolate-endpoint"
        ));
      }
    }
  }

  const deduped = [...new Map(detections.map(item=>[item.id,item])).values()];
  const isolatedEndpoints = [...new Set(
    deduped.filter(item=>item.action==="isolate-endpoint").map(item=>item.endpointId)
  )];
  const killedProcesses = [...new Set(
    deduped
      .filter(item=>item.action==="kill-process")
      .flatMap(item=>item.evidenceEventIds)
  )];

  return {
    eventsAnalyzed:events.length,
    detections:deduped,
    isolatedEndpoints,
    killedProcesses,
    decision:isolatedEndpoints.length > 0
      ? "contain"
      : deduped.some(item=>item.severity==="high")
        ? "investigate"
        : "allow"
  };
}

export function createEdrSummary(report:EdrReport):string {
  return [
    `EDR decision: ${report.decision}`,
    `Events analyzed: ${report.eventsAnalyzed}`,
    `Detections: ${report.detections.length}`,
    `Isolated endpoints: ${report.isolatedEndpoints.length}`,
    `Killed processes: ${report.killedProcesses.length}`
  ].join("\n");
}
