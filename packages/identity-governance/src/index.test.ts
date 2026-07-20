import {describe, expect, it} from "vitest";
import {
  canApprovePrivilegedChange,
  evaluateLeastPrivilege,
  reviewAccess
} from "./index.js";

describe("identity governance", () => {
  it("detects segregation of duties conflicts", () => {
    const result = reviewAccess([{
      userId:"user-1",
      tenantId:"org-1",
      roles:["security-admin","auditor"],
      grantedAt:"2026-07-20T00:00:00.000Z"
    }], new Date("2026-07-21T00:00:00.000Z"));

    expect(result.compliant).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it("detects excessive roles", () => {
    expect(evaluateLeastPrivilege({
      userId:"user-2",
      tenantId:"org-1",
      roles:["viewer","security-admin"],
      grantedAt:"2026-07-20T00:00:00.000Z"
    }, ["viewer"])).toEqual(["EXCESS_ROLE:security-admin"]);
  });

  it("requires independent approval for privileged changes", () => {
    const approver = {
      userId:"admin-1",
      tenantId:"org-1",
      roles:["security-admin"] as const,
      grantedAt:"2026-07-20T00:00:00.000Z"
    };

    expect(canApprovePrivilegedChange("admin-1","admin-1",approver)).toBe(false);
    expect(canApprovePrivilegedChange("user-1","admin-1",approver)).toBe(true);
  });
});
