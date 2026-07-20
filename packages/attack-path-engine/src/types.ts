import type {SecurityEvidence} from "@sentinel/evidence-engine";

export type AttackNodeKind =
  | "entry-point"
  | "service"
  | "vulnerability"
  | "identity"
  | "data-store"
  | "critical-asset"
  | "control";

export interface AttackNode {
  id: string;
  label: string;
  kind: AttackNodeKind;
  criticality?: number;
}

export interface AttackEdge {
  from: string;
  to: string;
  relation: string;
  confidence: number;
}

export interface AttackPath {
  id: string;
  nodes: AttackNode[];
  edges: AttackEdge[];
  evidence: SecurityEvidence[];
  score: number;
  blockedBy: string[];
}
