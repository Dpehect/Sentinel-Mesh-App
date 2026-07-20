import {describe, expect, it} from "vitest";
import {
  discoverAsset,
  markStaleAssets,
  mergeAssetInventory
} from "./index.js";

const observation = {
  tenantId:"org-1",
  type:"service" as const,
  name:"Payments API",
  externalId:"svc-1",
  location:"eu-west",
  metadata:{public:"true", production:"true"},
  observedAt:"2026-07-20T00:00:00.000Z"
};

describe("asset discovery", () => {
  it("creates deterministic asset identity and risk", () => {
    const first = discoverAsset(observation);
    const second = discoverAsset(observation);

    expect(first.id).toBe(second.id);
    expect(first.risk).toBe("critical");
  });

  it("detects duplicate observations", () => {
    const asset = discoverAsset(observation);
    const result = mergeAssetInventory([asset], [observation]);

    expect(result.duplicates).toEqual([asset.id]);
    expect(result.created).toHaveLength(0);
  });

  it("moves stale assets through lifecycle", () => {
    const asset = discoverAsset(observation);
    const [archived] = markStaleAssets(
      [asset],
      new Date("2027-02-01T00:00:00.000Z")
    );

    expect(archived.status).toBe("archived");
  });
});
