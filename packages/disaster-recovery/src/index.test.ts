import {describe, expect, it} from "vitest";
import {
  createBackupManifest,
  evaluateRecovery,
  verifyBackupManifest
} from "./index.js";

describe("disaster recovery", () => {
  it("creates and verifies deterministic backup manifests", () => {
    const manifest = createBackupManifest({
      createdAt:"2026-07-20T00:00:00.000Z",
      sourceVersion:"2.9.0",
      files:[
        {path:"database.dump", sizeBytes:1000, checksum:"abc"},
        {path:"audit.json", sizeBytes:500, checksum:"def"}
      ]
    });

    expect(verifyBackupManifest(manifest)).toBe(true);
    expect(manifest.totalBytes).toBe(1500);
  });

  it("evaluates RPO and RTO targets", () => {
    const result = evaluateRecovery(
      "2026-07-20T00:00:00.000Z",
      "2026-07-20T00:30:00.000Z",
      "2026-07-20T01:00:00.000Z",
      {rpoMinutes:60, rtoMinutes:60}
    );

    expect(result.recoverable).toBe(true);
  });
});
