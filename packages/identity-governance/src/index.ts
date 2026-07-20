import type {
  AccessAssignment,
  AccessReviewResult,
  AccessRole,
  SegregationRule
} from "./types.js";

export type {
  AccessAssignment,
  AccessReviewResult,
  AccessRole,
  SegregationRule
} from "./types.js";

export const defaultSegregationRules: SegregationRule[] = [
  {
    id:"admin-auditor-conflict",
    conflictingRoles:["security-admin","auditor"],
    reason:"Administrators must not audit their own privileged actions."
  },
  {
    id:"owner-auditor-conflict",
    conflictingRoles:["organization-owner","auditor"],
    reason:"Organization owners must not independently certify their own controls."
  }
];

export function hasRole(
  assignment: AccessAssignment,
  role: AccessRole
): boolean {
  return assignment.roles.includes(role);
}

export function evaluateLeastPrivilege(
  assignment: AccessAssignment,
  requiredRoles: AccessRole[]
): string[] {
  return assignment.roles
    .filter(role => !requiredRoles.includes(role))
    .map(role => `EXCESS_ROLE:${role}`);
}

export function reviewAccess(
  assignments: AccessAssignment[],
  now: Date,
  staleAfterDays = 90,
  rules: SegregationRule[] = defaultSegregationRules
): AccessReviewResult {
  const violations: string[] = [];
  const staleAssignments: string[] = [];
  const expiredAssignments: string[] = [];

  for (const assignment of assignments) {
    for (const rule of rules) {
      if (
        assignment.roles.includes(rule.conflictingRoles[0]) &&
        assignment.roles.includes(rule.conflictingRoles[1])
      ) {
        violations.push(`${rule.id}:${assignment.userId}`);
      }
    }

    if (assignment.expiresAt && new Date(assignment.expiresAt) <= now) {
      expiredAssignments.push(assignment.userId);
    }

    const activityDate = assignment.lastUsedAt ?? assignment.grantedAt;
    const staleAt =
      new Date(activityDate).getTime() +
      staleAfterDays * 24 * 60 * 60 * 1000;

    if (staleAt <= now.getTime()) {
      staleAssignments.push(assignment.userId);
    }
  }

  return {
    compliant:
      violations.length === 0 &&
      staleAssignments.length === 0 &&
      expiredAssignments.length === 0,
    violations:[...new Set(violations)],
    staleAssignments:[...new Set(staleAssignments)],
    expiredAssignments:[...new Set(expiredAssignments)]
  };
}

export function canApprovePrivilegedChange(
  requesterId: string,
  approverId: string,
  approver: AccessAssignment
): boolean {
  if (requesterId === approverId) return false;

  return (
    hasRole(approver, "security-admin") ||
    hasRole(approver, "organization-owner")
  );
}
