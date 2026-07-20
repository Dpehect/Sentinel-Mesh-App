import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildReadinessReport,
  createBackupBundle,
  defaultReadinessChecks,
  restoreBackupBundle,
  verifyBackupBundle
} from "./index.js";

describe("release readiness", () => {
  it("creates, verifies and restores a backup", async () => {
    const source = await mkdtemp(path.join(os.tmpdir(), "sentinel-source-"));
    const target = await mkdtemp(path.join(os.tmpdir(), "sentinel-target-"));

    await writeFile(
      path.join(source, "operations.json"),
      JSON.stringify({ incidents: [] })
    );

    const bundle = await createBackupBundle(
      source,
      ["operations.json"],
      "local-owner"
    );

    expect(verifyBackupBundle(bundle)).toBe(true);

    const result = await restoreBackupBundle(target, bundle, false);
    expect(result.restoredFiles).toEqual(["operations.json"]);

    const restored = await readFile(
      path.join(target, "operations.json"),
      "utf8"
    );
    expect(restored).toContain("incidents");
  });

  it("detects changed backup payloads", async () => {
    const source = await mkdtemp(path.join(os.tmpdir(), "sentinel-source-"));
    await writeFile(path.join(source, "data.json"), "{}");

    const bundle = await createBackupBundle(
      source,
      ["data.json"],
      "local-owner"
    );

    bundle.payloads["data.json"] = "tampered";
    expect(verifyBackupBundle(bundle)).toBe(false);
  });

  it("fails readiness when a required check fails", () => {
    const report = buildReadinessReport([
      {
        id: "required",
        label: "Required",
        status: "fail",
        required: true,
        message: "failed"
      }
    ]);

    expect(report.ready).toBe(false);
    expect(report.score).toBe(0);
  });

  it("creates sensible default checks", () => {
    const checks = defaultReadinessChecks({
      nodeVersion: "v22.0.0",
      writableDataDirectory: true,
      sessionSecretConfigured: false,
      productionMode: false,
      healthStatus: "degraded",
      backupVerified: false
    });

    expect(checks.find(item => item.id === "node-version")?.status)
      .toBe("pass");
    expect(checks.find(item => item.id === "platform-health")?.status)
      .toBe("warn");
  });
});
