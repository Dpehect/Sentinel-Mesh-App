import {describe, expect, it} from "vitest";
import {
  buildRiskGraph,
  createRiskGraphSummary,
  findRiskPaths
} from "./index.js";

const nodes = [
  {
    id:"internet-api", tenantId:"org-1", type:"asset" as const,
    label:"Public API", baseRisk:45, internetExposed:true
  },
  {
    id:"rce", tenantId:"org-1", type:"vulnerability" as const,
    label:"RCE", baseRisk:80
  },
  {
    id:"admin", tenantId:"org-1", type:"identity" as const,
    label:"Admin Role", baseRisk:70, privileged:true
  },
  {
    id:"customer-data", tenantId:"org-1", type:"data" as const,
    label:"Customer Data", baseRisk:90, critical:true
  }
];

const edges = [
  {fromNodeId:"internet-api", toNodeId:"rce", type:"exposes" as const, weight:8},
  {fromNodeId:"rce", toNodeId:"admin", type:"exploits" as const, weight:10},
  {fromNodeId:"admin", toNodeId:"customer-data", type:"can-access" as const, weight:10}
];

describe("risk graph", () => {
  it("builds a validated graph", () => {
    const graph = buildRiskGraph(nodes, edges);
    expect(graph.edges).toHaveLength(3);
  });

  it("detects toxic combinations to critical data", () => {
    const report = findRiskPaths(nodes, edges, ["internet-api"]);

    expect(report.decision).toBe("urgent");
    expect(report.highestRiskScore).toBe(100);
    expect(report.toxicCombinations.length).toBeGreaterThan(0);
  });

  it("creates a compact summary", () => {
    const report = findRiskPaths(nodes, edges, ["internet-api"]);
    expect(createRiskGraphSummary(report))
      .toContain("Risk graph decision:");
  });

  it("rejects unknown nodes", () => {
    expect(() => buildRiskGraph(nodes, [{
      fromNodeId:"internet-api",
      toNodeId:"missing",
      type:"affects"
    }])).toThrow("UNKNOWN_RISK_NODE");
  });
});
