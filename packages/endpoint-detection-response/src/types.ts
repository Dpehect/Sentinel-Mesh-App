export type EndpointEventType =
  | "process-start"
  | "file-write"
  | "registry-write"
  | "service-create"
  | "scheduled-task-create"
  | "credential-access"
  | "security-control-change";

export type EndpointSeverity = "critical" | "high" | "medium" | "low";

export interface EndpointEvent {
  id: string;
  tenantId: string;
  endpointId: string;
  timestamp: string;
  type: EndpointEventType;
  processId?: string;
  parentProcessId?: string;
  process?: string;
  commandLine?: string;
  path?: string;
  registryKey?: string;
  serviceName?: string;
  taskName?: string;
  user?: string;
  signed?: boolean;
  trustedPublisher?: boolean;
  fileHash?: string;
}

export interface EndpointDetection {
  id: string;
  ruleId: string;
  endpointId: string;
  severity: EndpointSeverity;
  title: string;
  evidenceEventIds: string[];
  mitreTechniques: string[];
  action: "observe" | "alert" | "kill-process" | "isolate-endpoint";
}

export interface EdrReport {
  eventsAnalyzed: number;
  detections: EndpointDetection[];
  isolatedEndpoints: string[];
  killedProcesses: string[];
  decision: "allow" | "investigate" | "contain";
}
