export type ScanNodeStatus = "online" | "draining" | "offline";
export type ScanJobStatus = "queued" | "assigned" | "running" | "completed" | "failed";

export interface ScanNode {
  id: string;
  tenantIds: string[];
  region: string;
  status: ScanNodeStatus;
  capabilities: string[];
  maxConcurrentJobs: number;
  activeJobs: number;
  lastHeartbeatAt: string;
}

export interface ScanJob {
  id: string;
  tenantId: string;
  capability: string;
  regionPreference?: string;
  priority: number;
  status: ScanJobStatus;
  assignedNodeId?: string;
  attempt: number;
}

export interface NodeAssignment {
  jobId: string;
  nodeId: string;
  score: number;
}

export interface DistributedScanReport {
  assignments: NodeAssignment[];
  unassignedJobs: string[];
  staleNodes: string[];
  overloadedNodes: string[];
  recoveredJobs: string[];
  decision: "healthy" | "degraded" | "blocked";
}
