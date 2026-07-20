import type {
  IdentityAttackPath,
  IdentityAttackPathReport,
  IdentityEdge,
  IdentityNode
} from "./types.js";

export type {
  IdentityAttackPath,
  IdentityAttackPathReport,
  IdentityEdge,
  IdentityEdgeType,
  IdentityNode,
  IdentityNodeType
} from "./types.js";

export function buildIdentityGraph(
  nodes: IdentityNode[],
  edges: IdentityEdge[]
): {nodes: IdentityNode[]; edges: IdentityEdge[]} {
  const ids = new Set(nodes.map(node => node.id));

  for (const edge of edges) {
    if (!ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId)) {
      throw new Error("UNKNOWN_IDENTITY_NODE");
    }
  }

  return {nodes, edges};
}

function scorePath(
  pathNodes: IdentityNode[],
  pathEdges: IdentityEdge[]
): {score:number; reasons:string[]} {
  const reasons: string[] = [];
  let score = 10;

  if (pathNodes[0]?.externallyAccessible) {
    score += 25;
    reasons.push("EXTERNALLY_ACCESSIBLE_ENTRY");
  }

  if (pathNodes.some(node => node.privileged)) {
    score += 30;
    reasons.push("PRIVILEGED_IDENTITY_REACHABLE");
  }

  if (pathEdges.some(edge => edge.type === "can-impersonate")) {
    score += 25;
    reasons.push("IMPERSONATION_PATH");
  }

  if (pathEdges.some(edge => edge.type === "can-administer")) {
    score += 20;
    reasons.push("ADMINISTRATION_PATH");
  }

  if (pathEdges.some(edge => edge.mfaRequired === false)) {
    score += 15;
    reasons.push("MFA_NOT_REQUIRED");
  }

  if (pathEdges.some(edge => edge.conditional === false)) {
    score += 10;
    reasons.push("UNCONDITIONAL_PRIVILEGE");
  }

  return {
    score:Math.max(0, Math.min(100, score)),
    reasons:[...new Set(reasons)]
  };
}

export function findIdentityAttackPaths(
  nodes: IdentityNode[],
  edges: IdentityEdge[],
  startNodeIds?: string[],
  maxDepth = 6
): IdentityAttackPathReport {
  buildIdentityGraph(nodes, edges);

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const starts = startNodeIds?.length
    ? startNodeIds
    : nodes
        .filter(node =>
          node.externallyAccessible === true &&
          node.disabled !== true
        )
        .map(node => node.id);

  const paths: IdentityAttackPath[] = [];

  for (const startId of starts) {
    const queue: Array<{
      nodeId:string;
      nodePath:string[];
      edgePath:IdentityEdge[];
    }> = [{nodeId:startId, nodePath:[startId], edgePath:[]}];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.edgePath.length >= maxDepth) continue;

      for (const edge of edges.filter(item => item.fromNodeId === current.nodeId)) {
        if (current.nodePath.includes(edge.toNodeId)) continue;

        const nextNodes = [...current.nodePath, edge.toNodeId];
        const nextEdges = [...current.edgePath, edge];
        const target = nodeById.get(edge.toNodeId)!;

        if (target.privileged === true || edge.type === "can-administer") {
          const scored = scorePath(
            nextNodes.map(id => nodeById.get(id)!),
            nextEdges
          );

          paths.push({
            nodes:nextNodes,
            edges:nextEdges,
            riskScore:scored.score,
            reasons:scored.reasons
          });
        }

        queue.push({
          nodeId:edge.toNodeId,
          nodePath:nextNodes,
          edgePath:nextEdges
        });
      }
    }
  }

  const deduped = [...new Map(
    paths.map(path => [path.nodes.join("->"), path])
  ).values()].sort((a, b) => b.riskScore - a.riskScore);

  const highestRiskScore = deduped[0]?.riskScore ?? 0;
  const exposedPrivilegedIdentities = [...new Set(
    deduped
      .filter(path => path.riskScore >= 70)
      .map(path => path.nodes[path.nodes.length - 1])
  )];

  return {
    paths:deduped,
    highestRiskScore,
    exposedPrivilegedIdentities,
    decision:highestRiskScore >= 85
      ? "block"
      : highestRiskScore >= 60
        ? "review"
        : "allow"
  };
}

export function createIdentityAttackPathSummary(
  report: IdentityAttackPathReport
): string {
  return [
    `Identity attack-path decision: ${report.decision}`,
    `Paths found: ${report.paths.length}`,
    `Highest risk score: ${report.highestRiskScore}/100`,
    `Exposed privileged identities: ${report.exposedPrivilegedIdentities.length}`
  ].join("\n");
}
