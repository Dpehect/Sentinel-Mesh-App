import {createHash} from "node:crypto";
import type {AuditEvent, AuditEventInput, TenantContext} from "./types.js";

export type {AuditEvent, AuditEventInput, TenantContext};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function assertTenantAccess(
  requested: TenantContext,
  authenticated: TenantContext
): void {
  if (requested.organizationId !== authenticated.organizationId) {
    throw new Error("TENANT_ACCESS_DENIED");
  }

  if (
    requested.projectId &&
    authenticated.projectId &&
    requested.projectId !== authenticated.projectId
  ) {
    throw new Error("PROJECT_ACCESS_DENIED");
  }
}

export function createAuditEvent(
  input: AuditEventInput,
  previous?: AuditEvent
): AuditEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const previousHash = previous?.hash ?? null;
  const canonical = stable({...input, occurredAt, previousHash});
  const hash = createHash("sha256").update(canonical).digest("hex");

  return {
    ...input,
    occurredAt,
    previousHash,
    hash,
    id: `audit_${hash.slice(0, 16)}`
  };
}

export function verifyAuditChain(events: AuditEvent[]): boolean {
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const previous = events[index - 1];
    const recreated = createAuditEvent({
      tenant: event.tenant,
      actor: event.actor,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      metadata: event.metadata,
      occurredAt: event.occurredAt
    }, previous);

    if (event.previousHash !== (previous?.hash ?? null)) return false;
    if (event.hash !== recreated.hash) return false;
  }

  return true;
}
