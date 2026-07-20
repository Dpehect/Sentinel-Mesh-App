import {describe, expect, it} from "vitest";
import {buildSecurityGraph, findAttackPaths} from "./graph.js";
import type {PostureAsset, PostureFinding} from "./types.js";

describe("cloud asset graph", () => {
  it("creates an internet exposure edge and prioritized attack path", () => {
    const assets: PostureAsset[] = [{
      id: "asset-1",
      kind: "terraform-resource",
      provider: "aws",
      name: "public-admin-sg",
      source: "infra/main.tf",
      metadata: {}
    }];
    const findings: PostureFinding[] = [{
      id: "f-1",
      ruleId: "IAC-007",
      title: "Sensitive management port exposed",
      severity: "critical",
      confidence: 0.95,
      assetId: "asset-1",
      source: "infra/main.tf",
      evidence: ["0.0.0.0/0"],
      remediation: "Restrict ingress",
      standards: ["CIS"]
    }];

    const graph = buildSecurityGraph(assets, findings);
    const paths = findAttackPaths(graph);

    expect(graph.edges.some(e => e.source === "internet" && e.target === "asset-1")).toBe(true);
    expect(paths[0]?.score).toBeGreaterThanOrEqual(80);
  });

  it("correlates Kubernetes services, workloads and identities", () => {
    const assets: PostureAsset[] = [
      {id:"svc",kind:"kubernetes-service",provider:"kubernetes",name:"api-service",source:"svc.yaml",metadata:{}},
      {id:"workload",kind:"kubernetes-workload",provider:"kubernetes",name:"api",source:"deploy.yaml",metadata:{}},
      {id:"rbac",kind:"kubernetes-rbac",provider:"kubernetes",name:"api-role",source:"rbac.yaml",metadata:{}}
    ];

    const graph = buildSecurityGraph(assets, []);
    expect(graph.edges.some(e => e.source === "svc" && e.target === "workload")).toBe(true);
    expect(graph.edges.some(e => e.source === "workload" && e.target === "rbac")).toBe(true);
  });
});
