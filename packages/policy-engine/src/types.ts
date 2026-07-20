import type {AttackPath} from "@sentinel/attack-path-engine";

export type PolicyAction = "allow" | "warn" | "block";

export interface SecurityPolicy {
  id: string;
  name: string;
  enabled: boolean;
  minimumScore: number;
  action: PolicyAction;
  requireUnblockedPath?: boolean;
  appliesToBranches?: string[];
}

export interface PolicyEvaluation {
  policyId: string;
  action: PolicyAction;
  matched: boolean;
  reasons: string[];
  pathIds: string[];
}

export interface PolicyContext {
  branch: string;
  attackPaths: AttackPath[];
}
