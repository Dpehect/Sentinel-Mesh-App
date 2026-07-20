import {describe, expect, it} from "vitest";
import {
  evaluateMultiCloudInventory,
  mapUnifiedResourceType,
  normalizeMultiCloudInventory
} from "./index.js";

describe("multi-cloud inventory", () => {
  it("maps provider-native types to unified types", () => {
    expect(mapUnifiedResourceType("AWS::EC2::Instance")).toBe("compute");
    expect(mapUnifiedResourceType("Microsoft.Storage/storageAccounts")).toBe("storage");
    expect(mapUnifiedResourceType("google.cloud.functions.Function")).toBe("serverless");
  });

  it("normalizes and deduplicates cloud resources", () => {
    const resources = normalizeMultiCloudInventory([
      {
        tenantId:"org-1", provider:"aws", accountId:"a1",
        nativeId:"i-123", name:"API", nativeType:"AWS::EC2::Instance",
        region:"eu-west-1", observedAt:"2026-07-20T00:00:00.000Z"
      },
      {
        tenantId:"org-1", provider:"aws", accountId:"a1",
        nativeId:"i-123", name:"API", nativeType:"AWS::EC2::Instance",
        region:"eu-west-1", observedAt:"2026-07-20T00:05:00.000Z"
      }
    ]);

    expect(resources).toHaveLength(1);
    expect(resources[0].unifiedType).toBe("compute");
  });

  it("returns urgent for exposed unmanaged unencrypted resources", () => {
    const report = evaluateMultiCloudInventory([], [{
      tenantId:"org-1", provider:"azure", accountId:"sub-1",
      nativeId:"vm-1", name:"Legacy VM", nativeType:"virtualMachine",
      region:"westeurope", internetExposed:true, encrypted:false,
      managed:false, observedAt:"2026-07-20T00:00:00.000Z"
    }]);

    expect(report.decision).toBe("urgent");
    expect(report.coverage[0].unmanagedResources).toBe(1);
  });
});
