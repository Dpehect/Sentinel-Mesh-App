export type IdentityNodeType =
  | "user"
  | "group"
  | "role"
  | "service-account"
  | "permission"
  | "resource";

export type IdentityEdgeType =
  | "member-of"
  | "can-assume"
  | "has-permission"
  | "can-administer"
  | "can-impersonate"
  | "owns";

export interface IdentityNode {
  id: string;
  tenantId: string;
  type: IdentityNodeType;
  name: string;
  privileged?: boolean;
  externallyAccessible?: boolean;
  disabled?: boolean;
}

export interface IdentityEdge {
  fromNodeId: string;
  toNodeId: string;
  type: IdentityEdgeType;
  conditional?: boolean;
  mfaRequired?: boolean;
}

export interface IdentityAttackPath {
  nodes: string[];
  edges: IdentityEdge[];
  riskScore: number;
  reasons: string[];
}

export interface IdentityAttackPathReport {
  paths: IdentityAttackPath[];
  highestRiskScore: number;
  exposedPrivilegedIdentities: string[];
  decision: "allow" | "review" | "block";
}
