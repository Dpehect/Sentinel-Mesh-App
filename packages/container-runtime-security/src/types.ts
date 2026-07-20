export type RuntimeEventType =
  | "process-start"
  | "file-write"
  | "network-connect"
  | "privilege-change"
  | "namespace-change";

export type RuntimeSeverity = "critical" | "high" | "medium" | "low";

export interface RuntimeEvent {
  containerId: string;
  image: string;
  timestamp: string;
  type: RuntimeEventType;
  process?: string;
  arguments?: string[];
  path?: string;
  destination?: string;
  destinationPort?: number;
  userId?: number;
  capabilities?: string[];
}

export interface RuntimeFinding {
  id: string;
  ruleId: string;
  containerId: string;
  severity: RuntimeSeverity;
  title: string;
  evidence: string;
  action: "observe" | "alert" | "isolate";
}

export interface RuntimeSecurityReport {
  score: number;
  eventsChecked: number;
  findings: RuntimeFinding[];
  containersToIsolate: string[];
}
