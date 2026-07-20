import {describe, expect, it} from "vitest";
import {buildAttackPath, isMergeBlocking} from "./index.js";

describe("attack path engine", () => {
  it("creates a deterministic scored path", () => {
    const path = buildAttackPath({
      nodes: [
        {id:"public-api", label:"Public API", kind:"entry-point"},
        {id:"sql-injection", label:"SQL injection", kind:"vulnerability"},
        {id:"customer-db", label:"Customer DB", kind:"critical-asset", criticality:1}
      ],
      edges: [
        {from:"public-api", to:"sql-injection", relation:"reaches", confidence:0.95},
        {from:"sql-injection", to:"customer-db", relation:"exposes", confidence:0.9}
      ]
    });

    expect(path.score).toBeGreaterThan(60);
    expect(path.id).toMatch(/^path_/);
  });

  it("does not block when a defensive control breaks the path", () => {
    const path = buildAttackPath({
      nodes:[{id:"asset", label:"Asset", kind:"critical-asset", criticality:1}],
      edges:[],
      blockedBy:["input-validation"]
    });

    expect(isMergeBlocking(path, 40)).toBe(false);
  });
});
