export interface TenantContext {
  organizationId: string;
  projectId?: string;
}

export interface AuditActor {
  id: string;
  type: "user" | "service" | "system";
  ipAddress?: string;
}

export interface AuditEventInput {
  tenant: TenantContext;
  actor: AuditActor;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  occurredAt: string;
  previousHash: string | null;
  hash: string;
}
