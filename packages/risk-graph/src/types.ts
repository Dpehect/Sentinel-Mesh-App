export type RiskNodeType =
  | "asset"
  | "identity"
  | "vulnerability"
  | "exposure"
  | "threat"
  | "control"
  | "data";

export type RiskEdgeType =
  | "affects"
  | "can-access"
  | "depends-on"
  | "exploits"
  | "mitigates"
  | "stores"
  | "exposes";

export interface RiskNode {
  id: string;
  tenantId: string;
  type: RiskNodeType;
  label: string;
  baseRisk: number;
  critical?: boolean;
  internetExposed?: boolean;
  privileged?: boolean;
}

export interface RiskEdge {
  fromNodeId: string;
  toNodeId: string;
  type: RiskEdgeType;
  weight?: number;
}

export interface RiskPath {
  nodes: string[];
  edges: RiskEdge[];
  score: number;
  reasons: string[];
}

export interface RiskGraphReport {
  paths: RiskPath[];
  highestRiskScore: number;
  criticalNodes: string[];
  toxicCombinations: string[][];
  decision: "monitor" | "review" | "urgent";
}
