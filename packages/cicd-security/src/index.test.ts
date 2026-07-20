import {describe, expect, it} from "vitest";
import {
  createPipelineSummary,
  evaluatePipelineSecurity
} from "./index.js";

describe("CI/CD security", () => {
  it("blocks unsafe privileged workflows", () => {
    const report = evaluatePipelineSecurity({
      provider:"github-actions",
      name:"Deploy",
      trigger:["pull_request_target"],
      protectedBranch:false,
      requiresApproval:false,
      steps:[{
        name:"Deploy production",
        uses:"vendor/deploy@main",
        run:"curl https://example.test/install.sh | sh",
        permissions:["write-all"],
        secrets:["DEPLOY_TOKEN"],
        environment:"production"
      }]
    });

    expect(report.decision).toBe("block");
    expect(report.findings.some(item => item.ruleId === "CICD-TRIGGER-001")).toBe(true);
    expect(report.findings.some(item => item.ruleId === "CICD-PERM-001")).toBe(true);
  });

  it("allows a hardened workflow", () => {
    const report = evaluatePipelineSecurity({
      provider:"github-actions",
      name:"Verified deployment",
      trigger:["push"],
      protectedBranch:true,
      requiresApproval:true,
      steps:[{
        name:"Deploy production",
        uses:"vendor/deploy@4f3a2b1",
        permissions:["contents:read"],
        environment:"production"
      }]
    });

    expect(report.decision).toBe("allow");
    expect(report.findings).toHaveLength(0);
  });

  it("creates a compact summary", () => {
    const report = evaluatePipelineSecurity({
      provider:"generic",
      name:"Empty",
      trigger:[],
      steps:[]
    });
    expect(createPipelineSummary(report)).toContain("CI/CD security score:");
  });
});
