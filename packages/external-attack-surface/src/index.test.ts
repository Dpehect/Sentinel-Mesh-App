import {describe, expect, it} from "vitest";
import {
  createExternalAssetRecord,
  detectAttackSurfaceChanges,
  evaluateExternalAttackSurface
} from "./index.js";

describe("external attack surface", () => {
  it("scores unknown exposed admin services as critical", () => {
    const record = createExternalAssetRecord({
      tenantId:"org-1",
      type:"service",
      value:"admin.example.com",
      observedAt:"2026-07-20T00:00:00.000Z",
      ownership:"unknown",
      ports:[3389],
      tlsEnabled:false,
      adminInterface:true
    }, new Date("2026-07-20T00:00:00.000Z"));

    expect(record.riskScore).toBe(100);
    expect(record.reasons).toContain("UNKNOWN_OWNERSHIP");
    expect(record.reasons).toContain("HIGH_RISK_PORT_EXPOSED");
  });

  it("detects newly discovered external assets", () => {
    const current = [createExternalAssetRecord({
      tenantId:"org-1",
      type:"domain",
      value:"new.example.com",
      observedAt:"2026-07-20T00:00:00.000Z",
      ownership:"owned",
      tlsEnabled:true
    })];

    const changes = detectAttackSurfaceChanges([], current);

    expect(changes[0].type).toBe("new-asset");
  });

  it("returns urgent decision for critical external exposure", () => {
    const report = evaluateExternalAttackSurface([], [{
      tenantId:"org-1",
      type:"storage-endpoint",
      value:"files.example.com",
      observedAt:"2026-07-20T00:00:00.000Z",
      ownership:"owned",
      publicWriteAccess:true,
      tlsEnabled:false,
      loginExposed:true
    }]);

    expect(report.decision).toBe("urgent");
    expect(report.criticalAssets).toHaveLength(1);
  });
});
