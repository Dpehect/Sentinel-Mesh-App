import type {
  DistributedScanReport,
  NodeAssignment,
  ScanJob,
  ScanNode
} from "./types.js";

export type {
  DistributedScanReport,
  NodeAssignment,
  ScanJob,
  ScanJobStatus,
  ScanNode,
  ScanNodeStatus
} from "./types.js";

export function isNodeStale(
  node: ScanNode,
  now = new Date(),
  staleAfterSeconds = 90
): boolean {
  return now.getTime() - new Date(node.lastHeartbeatAt).getTime() >
    staleAfterSeconds * 1000;
}

function nodeScore(node: ScanNode, job: ScanJob): number {
  let score = 100;

  if (node.region === job.regionPreference) score += 25;
  if (node.tenantIds.includes(job.tenantId)) score += 20;

  const loadRatio = node.maxConcurrentJobs > 0
    ? node.activeJobs / node.maxConcurrentJobs
    : 1;

  score -= Math.round(loadRatio * 60);
  score += Math.max(0, Math.min(20, job.priority));

  return score;
}

export function assignScanJobs(
  nodes: ScanNode[],
  jobs: ScanJob[],
  now = new Date()
): NodeAssignment[] {
  const workingNodes = nodes
    .filter(node =>
      node.status === "online" &&
      !isNodeStale(node, now) &&
      node.activeJobs < node.maxConcurrentJobs
    )
    .map(node => ({...node}));

  const assignments: NodeAssignment[] = [];

  const queuedJobs = [...jobs]
    .filter(job => job.status === "queued")
    .sort((a,b) => b.priority - a.priority);

  for (const job of queuedJobs) {
    const eligible = workingNodes
      .filter(node =>
        node.capabilities.includes(job.capability) &&
        (node.tenantIds.length === 0 || node.tenantIds.includes(job.tenantId))
      )
      .sort((a,b) => nodeScore(b,job) - nodeScore(a,job));

    const selected = eligible[0];
    if (!selected) continue;

    assignments.push({
      jobId:job.id,
      nodeId:selected.id,
      score:nodeScore(selected,job)
    });

    selected.activeJobs += 1;
  }

  return assignments;
}

export function recoverJobsFromFailedNodes(
  nodes: ScanNode[],
  jobs: ScanJob[],
  now = new Date()
): ScanJob[] {
  const failedNodeIds = new Set(
    nodes
      .filter(node => node.status === "offline" || isNodeStale(node,now))
      .map(node => node.id)
  );

  return jobs.map(job => {
    if (
      job.assignedNodeId &&
      failedNodeIds.has(job.assignedNodeId) &&
      ["assigned","running"].includes(job.status)
    ) {
      return {
        ...job,
        status:"queued" as const,
        assignedNodeId:undefined,
        attempt:job.attempt + 1
      };
    }
    return job;
  });
}

export function evaluateDistributedScanning(
  nodes: ScanNode[],
  jobs: ScanJob[],
  now = new Date()
): DistributedScanReport {
  const recovered = recoverJobsFromFailedNodes(nodes,jobs,now);
  const assignments = assignScanJobs(nodes,recovered,now);
  const assignedIds = new Set(assignments.map(item=>item.jobId));

  const staleNodes = nodes
    .filter(node => isNodeStale(node,now))
    .map(node=>node.id);

  const overloadedNodes = nodes
    .filter(node =>
      node.maxConcurrentJobs > 0 &&
      node.activeJobs >= node.maxConcurrentJobs
    )
    .map(node=>node.id);

  const unassignedJobs = recovered
    .filter(job => job.status === "queued" && !assignedIds.has(job.id))
    .map(job=>job.id);

  const recoveredJobs = recovered
    .filter((job,index) =>
      job.attempt > jobs[index].attempt &&
      job.status === "queued"
    )
    .map(job=>job.id);

  const onlineNodes = nodes.filter(node =>
    node.status === "online" && !isNodeStale(node,now)
  ).length;

  return {
    assignments,
    unassignedJobs,
    staleNodes,
    overloadedNodes,
    recoveredJobs,
    decision:onlineNodes === 0 && unassignedJobs.length > 0
      ? "blocked"
      : unassignedJobs.length > 0 || staleNodes.length > 0
        ? "degraded"
        : "healthy"
  };
}

export function createDistributedScanSummary(
  report: DistributedScanReport
): string {
  return [
    `Distributed scan decision: ${report.decision}`,
    `Assignments: ${report.assignments.length}`,
    `Unassigned jobs: ${report.unassignedJobs.length}`,
    `Stale nodes: ${report.staleNodes.length}`,
    `Recovered jobs: ${report.recoveredJobs.length}`
  ].join("\n");
}
