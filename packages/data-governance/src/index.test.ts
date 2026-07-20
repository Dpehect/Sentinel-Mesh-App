import {describe, expect, it} from "vitest";
import {
  createExportManifest,
  isDeletionEligible,
  verifyExportManifest
} from "./index.js";

describe("data governance", () => {
  it("deletes expired temporary repositories", () => {
    expect(isDeletionEligible({
      id:"repo-1",
      tenantId:"org-1",
      category:"temporary-repository",
      createdAt:"2026-07-01T00:00:00.000Z"
    }, new Date("2026-07-03T00:00:00.000Z"))).toBe(true);
  });

  it("preserves records under legal hold", () => {
    expect(isDeletionEligible({
      id:"audit-1",
      tenantId:"org-1",
      category:"audit-event",
      createdAt:"2020-01-01T00:00:00.000Z",
      legalHold:true
    }, new Date("2030-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("creates a tenant-isolated verifiable export manifest", () => {
    const manifest = createExportManifest([
      {id:"a", tenantId:"org-1", category:"finding", createdAt:"2026-07-01T00:00:00.000Z"},
      {id:"b", tenantId:"org-2", category:"finding", createdAt:"2026-07-01T00:00:00.000Z"}
    ], "org-1", "2026-07-20T00:00:00.000Z");

    expect(manifest.recordIds).toEqual(["a"]);
    expect(verifyExportManifest(manifest)).toBe(true);
  });
});
