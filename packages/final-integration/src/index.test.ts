import { describe, expect, it } from "vitest";
import {
  buildFinalProductStatus,
  finalCapabilityCatalog,
  inspectRepositoryLayout,
  mergeChecks
} from "./index.js";

describe("final integration", () => {
  it("recognizes a complete accelerated layout", () => {
    const report = inspectRepositoryLayout({
      rootFiles: ["README.md", "package.json"],
      directories: ["apps", "packages", "docs"],
      packageNames: [
        "@sentinel/agent-fleet-orchestration",
        "@sentinel/agent-fleet-rollout",
        "@sentinel/agent-rollout-audit-chain",
        "@sentinel/rollout-control-plane",
        "@sentinel/operations-center",
        "@sentinel/release-readiness"
      ],
      webRoutes: [
        "/dashboard",
        "/findings",
        "/attack-paths",
        "/rollouts",
        "/operations",
        "/team",
        "/system",
        "/backups"
      ]
    });

    expect(report.requiredRoutesPresent).toBe(true);
    expect(report.requiredPackagesPresent).toBe(true);
    expect(report.legacyDemoDetected).toBe(false);
  });

  it("detects the accidental root static demo", () => {
    const report = inspectRepositoryLayout({
      rootFiles: ["START-MAC.command"],
      directories: ["app", "data"],
      packageNames: [],
      webRoutes: []
    });

    expect(report.legacyDemoDetected).toBe(true);
  });

  it("blocks final readiness only for blocking failures", () => {
    const status = buildFinalProductStatus(
      "10.0.0",
      [
        {
          id: "warning",
          label: "Warning",
          status: "warn",
          category: "release",
          message: "Recommended cleanup",
          blocking: false
        }
      ],
      finalCapabilityCatalog()
    );

    expect(status.ready).toBe(true);
    expect(status.remainingActions).toEqual(["Recommended cleanup"]);
  });

  it("deduplicates checks by id", () => {
    const checks = mergeChecks(
      [{
        id: "same",
        label: "Old",
        status: "warn",
        category: "source",
        message: "old",
        blocking: false
      }],
      [{
        id: "same",
        label: "New",
        status: "pass",
        category: "source",
        message: "new",
        blocking: false
      }]
    );

    expect(checks).toHaveLength(1);
    expect(checks[0]?.label).toBe("New");
  });
});
