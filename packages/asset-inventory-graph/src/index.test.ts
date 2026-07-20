import {describe, expect, it} from "vitest";
import {
  analyzeInventoryGraph,
  buildInventoryGraph,
  findReachableAssets
} from "./index.js";

const assets = [
  {
    id:"api", tenantId:"org-1", type:"service", name:"API",
    criticality:"high" as const, internetExposed:true
  },
  {
    id:"db", tenantId:"org-1", type:"database", name:"Customer DB",
    criticality:"critical" as const, dataClassification:"restricted" as const
  }
];

describe("asset inventory graph", () => {
  it("builds and traverses asset relationships", () => {
    const graph = buildInventoryGraph(assets, [{
      fromAssetId:"api", toAssetId:"db", type:"stores-data-in"
    }]);

    expect(findReachableAssets(graph, "api")).toEqual(["db"]);
  });

  it("analyzes critical and orphan assets", () => {
    const graph = buildInventoryGraph(assets, []);
    const result = analyzeInventoryGraph(graph);

    expect(result.criticalAssets).toEqual(["db"]);
    expect(result.orphanAssets).toEqual(["api","db"]);
  });

  it("rejects unknown relationship targets", () => {
    expect(() => buildInventoryGraph(assets, [{
      fromAssetId:"api", toAssetId:"missing", type:"connects-to"
    }])).toThrow("UNKNOWN_ASSET_RELATIONSHIP");
  });
});
