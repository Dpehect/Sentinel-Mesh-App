import {createHash} from "node:crypto";
import type {NetworkDetection, NetworkFlow, NetworkSeverity, NdrReport} from "./types.js";

export type {NetworkDetection, NetworkFlow, NetworkProtocol, NetworkSeverity, NdrReport} from "./types.js";

const rank: Record<NetworkSeverity, number> = {low:1, medium:2, high:3, critical:4};

function detection(
  ruleId:string,
  severity:NetworkSeverity,
  sourceIp:string,
  title:string,
  flowIds:string[],
  stage:NetworkDetection["killChainStage"],
  action:NetworkDetection["action"],
  destinationIp?:string
): NetworkDetection {
  const hash = createHash("sha256")
    .update(`${ruleId}|${sourceIp}|${destinationIp ?? ""}|${flowIds.join("|")}`)
    .digest("hex");

  return {
    id:`ndr_${hash.slice(0,16)}`,
    ruleId,severity,sourceIp,destinationIp,title,
    evidenceFlowIds:[...new Set(flowIds)],
    killChainStage:stage,
    action
  };
}

function coefficientOfVariation(values:number[]):number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum,v)=>sum+(v-mean)**2,0)/values.length;
  return Math.sqrt(variance)/mean;
}

export function analyzeNetworkFlows(flows:NetworkFlow[]):NdrReport {
  const detections:NetworkDetection[] = [];
  const bySource = new Map<string,NetworkFlow[]>();

  for (const flow of flows) {
    bySource.set(flow.sourceIp,[...(bySource.get(flow.sourceIp) ?? []),flow]);

    if (flow.destinationReputation === "malicious") {
      detections.push(detection(
        "NDR-C2-001","critical",flow.sourceIp,
        "Connection to known malicious destination",
        [flow.id],"command-and-control","isolate-source",flow.destinationIp
      ));
    }

    if (
      flow.protocol === "dns" &&
      flow.dnsQuery &&
      flow.dnsQuery.length >= 70 &&
      flow.dnsQuery.split(".")[0].length >= 45
    ) {
      detections.push(detection(
        "NDR-DNS-001","high",flow.sourceIp,
        "Possible DNS tunneling",
        [flow.id],"exfiltration","alert",flow.destinationIp
      ));
    }
  }

  for (const [sourceIp, sourceFlows] of bySource) {
    const internalAdminFlows = sourceFlows.filter(flow =>
      flow.internalSource === true &&
      flow.internalDestination === true &&
      [445,3389,5985,5986].includes(flow.destinationPort)
    );
    const uniqueInternalTargets = new Set(internalAdminFlows.map(flow => flow.destinationIp));

    if (uniqueInternalTargets.size >= 4) {
      detections.push(detection(
        "NDR-LATERAL-001","critical",sourceIp,
        "Potential lateral movement across internal systems",
        internalAdminFlows.map(flow=>flow.id),
        "lateral-movement","isolate-source"
      ));
    }

    const outbound = sourceFlows
      .filter(flow => flow.internalSource === true && flow.internalDestination !== true)
      .sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());

    if (outbound.length >= 5) {
      const intervals = outbound.slice(1).map((flow,index) =>
        (new Date(flow.timestamp).getTime() - new Date(outbound[index].timestamp).getTime()) / 1000
      );
      const durationVariation = coefficientOfVariation(intervals);
      const sizeVariation = coefficientOfVariation(outbound.map(flow => flow.bytesSent));

      if (durationVariation <= 0.2 && sizeVariation <= 0.35) {
        detections.push(detection(
          "NDR-BEACON-001","high",sourceIp,
          "Periodic network beaconing detected",
          outbound.map(flow=>flow.id),
          "command-and-control","alert"
        ));
      }
    }

    const largeOutbound = outbound.filter(flow => flow.bytesSent >= 50_000_000);
    if (largeOutbound.length >= 1) {
      detections.push(detection(
        "NDR-EXFIL-001","high",sourceIp,
        "Large outbound data transfer detected",
        largeOutbound.map(flow=>flow.id),
        "exfiltration","alert"
      ));
    }

    const scanFlows = sourceFlows.filter(flow => flow.internalDestination === true);
    const uniquePorts = new Set(scanFlows.map(flow => flow.destinationPort));
    const uniqueTargets = new Set(scanFlows.map(flow => flow.destinationIp));
    if (uniquePorts.size >= 12 || uniqueTargets.size >= 20) {
      detections.push(detection(
        "NDR-SCAN-001","medium",sourceIp,
        "Internal network scanning behavior",
        scanFlows.map(flow=>flow.id),
        "reconnaissance","alert"
      ));
    }
  }

  const deduped = [...new Map(detections.map(item=>[item.id,item])).values()];
  const isolatedSources = [...new Set(
    deduped.filter(item=>item.action==="isolate-source").map(item=>item.sourceIp)
  )];
  const highest = deduped.reduce<NetworkSeverity | "none">((current,item) =>
    current === "none" || rank[item.severity] > rank[current] ? item.severity : current
  ,"none");

  return {
    flowsAnalyzed:flows.length,
    detections:deduped,
    isolatedSources,
    highestSeverity:highest,
    decision:isolatedSources.length > 0
      ? "contain"
      : deduped.some(item=>item.severity==="high")
        ? "investigate"
        : "allow"
  };
}

export function createNdrSummary(report:NdrReport):string {
  return [
    `NDR decision: ${report.decision}`,
    `Flows analyzed: ${report.flowsAnalyzed}`,
    `Detections: ${report.detections.length}`,
    `Isolated sources: ${report.isolatedSources.length}`,
    `Highest severity: ${report.highestSeverity}`
  ].join("\n");
}
