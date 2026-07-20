export type AccessRole =
  | "viewer"
  | "developer"
  | "security-analyst"
  | "security-admin"
  | "organization-owner"
  | "auditor";

export interface AccessAssignment {
  userId: string;
  tenantId: string;
  roles: AccessRole[];
  grantedAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface SegregationRule {
  id: string;
  conflictingRoles: [AccessRole, AccessRole];
  reason: string;
}

export interface AccessReviewResult {
  compliant: boolean;
  violations: string[];
  staleAssignments: string[];
  expiredAssignments: string[];
}
