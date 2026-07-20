import {createHash} from "node:crypto";
import type {SecurityEvidence} from "@sentinel/evidence-engine";
import type {AttackEdge, AttackNode, AttackPath} from "./types.js";

export type {AttackEdge, AttackNode, AttackPath};

export interface BuildAttackPathInput {
  nodes: AttackNode[];
  edges: AttackEdge[];
  evidence?: SecurityEvidence[];
  blockedBy?: string[];
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function scoreAttackPath(
  nodes: AttackNode[],
  edges: AttackEdge[],
  evidence: SecurityEvidence[]
): number {
  const assetCriticality = Math.max(0, ...nodes.map(node => node.criticality ?? 0));
  const edgeConfidence = edges.length
    ? edges.reduce((sum, edge) => sum + clamp(edge.confidence), 0) / edges.length
    : 0;
  const evidenceConfidence = evidence.length
    ? evidence.reduce((sum, item) => sum + clamp(item.confidence), 0) / evidence.length
    : 0;

  return Math.round(Math.min(100,
    assetCriticality * 45 +
    edgeConfidence * 25 +
    evidenceConfidence * 30
  ));
}

export function buildAttackPath(input: BuildAttackPathInput): AttackPath {
  const chain = input.nodes.map(node => node.id).join(">");
  const fingerprint = createHash("sha256").update(chain).digest("hex");
  const evidence = input.evidence ?? [];

  return {
    id: `path_${fingerprint.slice(0, 16)}`,
    nodes: input.nodes,
    edges: input.edges,
    evidence,
    score: scoreAttackPath(input.nodes, input.edges, evidence),
    blockedBy: [...new Set(input.blockedBy ?? [])]
  };
}

export function isMergeBlocking(path: AttackPath, threshold = 80): boolean {
  return path.blockedBy.length === 0 && path.score >= threshold;
}
