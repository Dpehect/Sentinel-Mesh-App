import {describe, expect, it} from "vitest";
import {
  createIdentityAttackPathSummary,
  findIdentityAttackPaths
} from "./index.js";

const nodes = [
  {
    id:"external-user", tenantId:"org-1", type:"user" as const,
    name:"External User", externallyAccessible:true
  },
  {
    id:"dev-group", tenantId:"org-1", type:"group" as const,
    name:"Developers"
  },
  {
    id:"admin-role", tenantId:"org-1", type:"role" as const,
    name:"Cloud Admin", privileged:true
  }
];

describe("identity attack path", () => {
  it("finds risky paths to privileged identities", () => {
    const report = findIdentityAttackPaths(nodes, [
      {
        fromNodeId:"external-user", toNodeId:"dev-group",
        type:"member-of", conditional:false, mfaRequired:false
      },
      {
        fromNodeId:"dev-group", toNodeId:"admin-role",
        type:"can-assume", conditional:false, mfaRequired:false
      }
    ]);

    expect(report.paths).toHaveLength(1);
    expect(report.highestRiskScore).toBeGreaterThanOrEqual(85);
    expect(report.decision).toBe("block");
    expect(report.exposedPrivilegedIdentities).toEqual(["admin-role"]);
  });

  it("returns allow when no privileged path exists", () => {
    const report = findIdentityAttackPaths(nodes.slice(0, 2), []);
    expect(report.decision).toBe("allow");
    expect(report.paths).toHaveLength(0);
  });

  it("creates a compact summary", () => {
    const report = findIdentityAttackPaths(nodes.slice(0, 2), []);
    expect(createIdentityAttackPathSummary(report))
      .toContain("Identity attack-path decision:");
  });
});
