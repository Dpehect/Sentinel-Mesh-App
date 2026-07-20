import {describe, expect, it} from "vitest";
import {discoverAsset} from "@sentinel/asset-discovery";
import {
  analyzeTopologyRisk,
  buildTopology,
  findReachableAssets
} from "./index.js";

const observedAt = "2026-07-20T00:00:00.000Z";

const api = discoverAsset({
  tenantId:"org-1",
  type:"service",
  name:"Public API",
  metadata:{public:"true", production:"true"},
  observedAt
});

const database = discoverAsset({
  tenantId:"org-1",
  type:"database",
  name:"Customer Database",
  metadata:{criticalData:"true"},
  observedAt
});

describe("network topology", () => {
  it("finds reachable assets", () => {
    const graph = buildTopology([api, database], [{
      fromAssetId:api.id,
      toAssetId:database.id,
      protocol:"sql",
      port:5432,
      encrypted:true,
      authenticated:true
    }]);

    expect(findReachableAssets(graph, api.id)).toEqual([database.id]);
  });

  it("detects unsafe critical connections", () => {
    const graph = buildTopology([api, database], [{
      fromAssetId:api.id,
      toAssetId:database.id,
      protocol:"sql",
      port:5432,
      encrypted:false,
      internetExposed:true,
      authenticated:false
    }]);

    const result = analyzeTopologyRisk(graph);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain("UNENCRYPTED_CONNECTION");
    expect(result.reasons).toContain("UNAUTHENTICATED_CONNECTION");
  });

  it("rejects connections to unknown assets", () => {
    expect(() => buildTopology([api], [{
      fromAssetId:api.id,
      toAssetId:"asset_missing",
      protocol:"https",
      encrypted:true
    }])).toThrow("UNKNOWN_TOPOLOGY_ASSET");
  });
});
