import {describe, expect, it} from "vitest";
import {assertTenantAccess, createAuditEvent, verifyAuditChain} from "./index.js";

describe("audit engine", () => {
  it("creates a verifiable tamper-evident chain", () => {
    const first = createAuditEvent({
      tenant:{organizationId:"org-1"},
      actor:{id:"user-1", type:"user"},
      action:"policy.updated",
      resourceType:"policy",
      resourceId:"critical-main",
      occurredAt:"2026-07-20T00:00:00.000Z"
    });

    const second = createAuditEvent({
      tenant:{organizationId:"org-1"},
      actor:{id:"user-1", type:"user"},
      action:"scan.started",
      resourceType:"scan",
      resourceId:"scan-1",
      occurredAt:"2026-07-20T00:01:00.000Z"
    }, first);

    expect(verifyAuditChain([first, second])).toBe(true);
  });

  it("blocks cross-tenant access", () => {
    expect(() => assertTenantAccess(
      {organizationId:"org-2"},
      {organizationId:"org-1"}
    )).toThrow("TENANT_ACCESS_DENIED");
  });
});
