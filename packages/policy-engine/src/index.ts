import type {AttackPath} from "@sentinel/attack-path-engine";
import type {PolicyContext, PolicyEvaluation, SecurityPolicy} from "./types.js";

export type {PolicyContext, PolicyEvaluation, SecurityPolicy};

function branchMatches(branch: string, patterns?: string[]): boolean {
  if (!patterns?.length) return true;
  return patterns.some(pattern => {
    if (pattern === "*") return true;
    if (pattern.endsWith("*")) return branch.startsWith(pattern.slice(0, -1));
    return branch === pattern;
  });
}

export function evaluatePolicy(
  policy: SecurityPolicy,
  context: PolicyContext
): PolicyEvaluation {
  if (!policy.enabled || !branchMatches(context.branch, policy.appliesToBranches)) {
    return {
      policyId: policy.id,
      action: "allow",
      matched: false,
      reasons: [],
      pathIds: []
    };
  }

  const matchedPaths = context.attackPaths.filter(path => {
    if (path.score < policy.minimumScore) return false;
    if (policy.requireUnblockedPath && path.blockedBy.length > 0) return false;
    return true;
  });

  return {
    policyId: policy.id,
    action: matchedPaths.length ? policy.action : "allow",
    matched: matchedPaths.length > 0,
    reasons: matchedPaths.length
      ? [`${matchedPaths.length} attack path(s) met policy threshold ${policy.minimumScore}.`]
      : [],
    pathIds: matchedPaths.map(path => path.id)
  };
}

export function resolveMergeDecision(
  evaluations: PolicyEvaluation[]
): "allow" | "warn" | "block" {
  if (evaluations.some(item => item.action === "block" && item.matched)) return "block";
  if (evaluations.some(item => item.action === "warn" && item.matched)) return "warn";
  return "allow";
}
