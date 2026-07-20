import type {PostureAsset, PostureFinding, Severity} from "./types.js";

export type GraphNodeKind =
  | "internet" | "repository" | "cloud-account" | "resource"
  | "workload" | "service" | "identity" | "secret" | "database";

export interface SecurityGraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  provider: PostureAsset["provider"] | "platform";
  risk: number;
  severity?: Severity;
  metadata: Record<string, unknown>;
}

export interface SecurityGraphEdge {
  id: string;
  source: string;
  target: string;
  relation:
    | "contains" | "exposes" | "runs" | "uses"
    | "assumes" | "can-access" | "depends-on" | "routes";
  confidence: number;
  evidence: string[];
}

export interface SecurityGraph {
  nodes: SecurityGraphNode[];
  edges: SecurityGraphEdge[];
}

const severityRisk: Record<Severity, number> = {
  critical: 100,
  high: 80,
  medium: 55,
  low: 25,
  info: 5
};

function nodeKind(asset: PostureAsset): GraphNodeKind {
  if (asset.kind === "kubernetes-workload") return "workload";
  if (asset.kind === "kubernetes-service") return "service";
  if (asset.kind === "kubernetes-rbac") return "identity";
  return "resource";
}

function findingRisk(findings: PostureFinding[], assetId: string): number {
  return findings
    .filter(f => f.assetId === assetId)
    .reduce((max, f) => Math.max(max, severityRisk[f.severity]), 0);
}

function highestSeverity(findings: PostureFinding[], assetId: string): Severity | undefined {
  const ordered: Severity[] = ["critical", "high", "medium", "low", "info"];
  return ordered.find(s => findings.some(f => f.assetId === assetId && f.severity === s));
}

export function buildSecurityGraph(
  assets: PostureAsset[],
  findings: PostureFinding[]
): SecurityGraph {
  const nodes: SecurityGraphNode[] = [
    {
      id: "internet",
      label: "Internet",
      kind: "internet",
      provider: "platform",
      risk: 100,
      metadata: {}
    }
  ];
  const edges: SecurityGraphEdge[] = [];

  for (const asset of assets) {
    nodes.push({
      id: asset.id,
      label: asset.name,
      kind: nodeKind(asset),
      provider: asset.provider,
      risk: findingRisk(findings, asset.id),
      severity: highestSeverity(findings, asset.id),
      metadata: {source: asset.source, kind: asset.kind, ...asset.metadata}
    });

    const assetFindings = findings.filter(f => f.assetId === asset.id);
    const publicExposure = assetFindings.some(f =>
      ["IAC-001", "IAC-002", "IAC-007", "K8S-004", "K8S-011"].includes(f.ruleId)
    );

    if (publicExposure) {
      edges.push({
        id: `internet:${asset.id}`,
        source: "internet",
        target: asset.id,
        relation: "exposes",
        confidence: 0.95,
        evidence: assetFindings
          .filter(f => ["IAC-001", "IAC-002", "IAC-007", "K8S-004", "K8S-011"].includes(f.ruleId))
          .flatMap(f => f.evidence)
          .slice(0, 3)
      });
    }
  }

  const services = assets.filter(a => a.kind === "kubernetes-service");
  const workloads = assets.filter(a => a.kind === "kubernetes-workload");
  const identities = assets.filter(a => a.kind === "kubernetes-rbac");

  for (const service of services) {
    for (const workload of workloads) {
      edges.push({
        id: `${service.id}:${workload.id}`,
        source: service.id,
        target: workload.id,
        relation: "routes",
        confidence: 0.7,
        evidence: ["Repository-local Kubernetes resource correlation"]
      });
    }
  }

  for (const workload of workloads) {
    for (const identity of identities) {
      edges.push({
        id: `${workload.id}:${identity.id}`,
        source: workload.id,
        target: identity.id,
        relation: "uses",
        confidence: 0.65,
        evidence: ["Repository-local workload and RBAC correlation"]
      });
    }
  }

  return {nodes, edges};
}

export interface AttackPath {
  id: string;
  nodeIds: string[];
  edgeIds: string[];
  score: number;
  title: string;
  explanation: string[];
}

export function findAttackPaths(graph: SecurityGraph): AttackPath[] {
  const paths: AttackPath[] = [];
  const outgoing = new Map<string, SecurityGraphEdge[]>();

  for (const edge of graph.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge);
    outgoing.set(edge.source, list);
  }

  const visit = (
    current: string,
    nodeIds: string[],
    edgeIds: string[],
    depth: number
  ) => {
    if (depth > 5) return;
    const nextEdges = outgoing.get(current) ?? [];

    for (const edge of nextEdges) {
      if (nodeIds.includes(edge.target)) continue;
      const target = graph.nodes.find(n => n.id === edge.target);
      if (!target) continue;

      const nextNodes = [...nodeIds, edge.target];
      const nextEdgeIds = [...edgeIds, edge.id];

      if (target.risk >= 80 && nextNodes.length >= 2) {
        paths.push({
          id: nextNodes.join(">"),
          nodeIds: nextNodes,
          edgeIds: nextEdgeIds,
          score: Math.min(100, Math.round(
            target.risk * 0.65 +
            nextEdgeIds.length * 6 +
            edge.confidence * 15
          )),
          title: `Reachable ${target.kind}: ${target.label}`,
          explanation: [
            "The path begins from an externally reachable source.",
            `The target carries ${target.severity ?? "elevated"} posture risk.`,
            ...nextEdgeIds.map(id => {
              const item = graph.edges.find(e => e.id === id);
              return item ? `${item.relation}: ${item.evidence[0] ?? "correlated evidence"}` : "";
            }).filter(Boolean)
          ]
        });
      }

      visit(edge.target, nextNodes, nextEdgeIds, depth + 1);
    }
  };

  visit("internet", ["internet"], [], 0);
  return paths.sort((a, b) => b.score - a.score);
}
