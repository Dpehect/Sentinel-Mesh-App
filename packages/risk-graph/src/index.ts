import type {
  RiskEdge,
  RiskGraphReport,
  RiskNode,
  RiskPath
} from "./types.js";

export type {
  RiskEdge,
  RiskEdgeType,
  RiskGraphReport,
  RiskNode,
  RiskNodeType,
  RiskPath
} from "./types.js";

export function buildRiskGraph(
  nodes: RiskNode[],
  edges: RiskEdge[]
): {nodes: RiskNode[]; edges: RiskEdge[]} {
  const ids = new Set(nodes.map(node => node.id));

  for (const edge of edges) {
    if (!ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId)) {
      throw new Error("UNKNOWN_RISK_NODE");
    }
  }

  const uniqueEdges = new Map<string, RiskEdge>();
  for (const edge of edges) {
    uniqueEdges.set(
      `${edge.fromNodeId}|${edge.toNodeId}|${edge.type}`,
      edge
    );
  }

  return {nodes, edges:[...uniqueEdges.values()]};
}

function scorePath(
  nodes: RiskNode[],
  edges: RiskEdge[]
): {score:number; reasons:string[]} {
  const reasons: string[] = [];
  const averageBaseRisk = nodes.length
    ? nodes.reduce((sum, node) => sum + node.baseRisk, 0) / nodes.length
    : 0;

  let score = averageBaseRisk;

  if (nodes.some(node => node.internetExposed)) {
    score += 15;
    reasons.push("INTERNET_EXPOSED_ENTRY");
  }

  if (nodes.some(node => node.privileged)) {
    score += 18;
    reasons.push("PRIVILEGED_IDENTITY");
  }

  if (nodes.some(node => node.critical)) {
    score += 20;
    reasons.push("CRITICAL_ASSET");
  }

  if (nodes.some(node => node.type === "threat")) {
    score += 20;
    reasons.push("ACTIVE_THREAT_CONTEXT");
  }

  if (nodes.some(node => node.type === "vulnerability")) {
    score += 12;
    reasons.push("EXPLOITABLE_WEAKNESS");
  }

  if (nodes.some(node => node.type === "data")) {
    score += 12;
    reasons.push("SENSITIVE_DATA_REACHABLE");
  }

  score += edges.reduce((sum, edge) =>
    sum + Math.max(0, Math.min(10, edge.weight ?? 1)),
    0
  );

  return {
    score:Math.max(0, Math.min(100, Math.round(score))),
    reasons:[...new Set(reasons)]
  };
}

export function findRiskPaths(
  nodes: RiskNode[],
  edges: RiskEdge[],
  startNodeIds?: string[],
  maxDepth = 7
): RiskGraphReport {
  buildRiskGraph(nodes, edges);

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const starts = startNodeIds?.length
    ? startNodeIds
    : nodes
        .filter(node =>
          node.internetExposed === true ||
          node.type === "identity" ||
          node.type === "threat"
        )
        .map(node => node.id);

  const paths: RiskPath[] = [];

  for (const startNodeId of starts) {
    const queue: Array<{
      current:string;
      nodePath:string[];
      edgePath:RiskEdge[];
    }> = [{
      current:startNodeId,
      nodePath:[startNodeId],
      edgePath:[]
    }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.edgePath.length >= maxDepth) continue;

      for (const edge of edges.filter(item => item.fromNodeId === current.current)) {
        if (current.nodePath.includes(edge.toNodeId)) continue;

        const nextNodePath = [...current.nodePath, edge.toNodeId];
        const nextEdgePath = [...current.edgePath, edge];
        const target = nodeById.get(edge.toNodeId)!;

        if (
          target.critical ||
          target.type === "data" ||
          target.type === "vulnerability"
        ) {
          const scored = scorePath(
            nextNodePath.map(id => nodeById.get(id)!),
            nextEdgePath
          );

          paths.push({
            nodes:nextNodePath,
            edges:nextEdgePath,
            score:scored.score,
            reasons:scored.reasons
          });
        }

        queue.push({
          current:edge.toNodeId,
          nodePath:nextNodePath,
          edgePath:nextEdgePath
        });
      }
    }
  }

  const deduplicated = [...new Map(
    paths.map(path => [path.nodes.join("->"), path])
  ).values()].sort((a, b) => b.score - a.score);

  const toxicCombinations = deduplicated
    .filter(path => path.score >= 85)
    .map(path => path.nodes);

  const highestRiskScore = deduplicated[0]?.score ?? 0;

  return {
    paths:deduplicated,
    highestRiskScore,
    criticalNodes:nodes.filter(node => node.critical).map(node => node.id),
    toxicCombinations,
    decision:highestRiskScore >= 85
      ? "urgent"
      : highestRiskScore >= 60
        ? "review"
        : "monitor"
  };
}

export function createRiskGraphSummary(
  report: RiskGraphReport
): string {
  return [
    `Risk graph decision: ${report.decision}`,
    `Paths found: ${report.paths.length}`,
    `Highest risk score: ${report.highestRiskScore}/100`,
    `Toxic combinations: ${report.toxicCombinations.length}`
  ].join("\n");
}
