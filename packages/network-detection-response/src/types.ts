export type NetworkProtocol = "tcp" | "udp" | "dns" | "http" | "https" | "smb" | "rdp";
export type NetworkSeverity = "critical" | "high" | "medium" | "low";

export interface NetworkFlow {
  id: string;
  tenantId: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  destinationPort: number;
  protocol: NetworkProtocol;
  bytesSent: number;
  bytesReceived: number;
  durationSeconds: number;
  dnsQuery?: string;
  internalSource?: boolean;
  internalDestination?: boolean;
  destinationReputation?: "malicious" | "suspicious" | "unknown" | "trusted";
}

export interface NetworkDetection {
  id: string;
  ruleId: string;
  severity: NetworkSeverity;
  sourceIp: string;
  destinationIp?: string;
  title: string;
  evidenceFlowIds: string[];
  killChainStage: "reconnaissance" | "initial-access" | "execution" | "persistence" | "command-and-control" | "lateral-movement" | "exfiltration";
  action: "observe" | "alert" | "isolate-source";
}

export interface NdrReport {
  flowsAnalyzed: number;
  detections: NetworkDetection[];
  isolatedSources: string[];
  highestSeverity: NetworkSeverity | "none";
  decision: "allow" | "investigate" | "contain";
}
