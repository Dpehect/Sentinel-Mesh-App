import {createHash} from "node:crypto";
import type {
  PipelineDefinition,
  PipelineFinding,
  PipelineSecurityReport,
  PipelineSeverity,
  PipelineStep
} from "./types.js";

export type {
  PipelineDefinition,
  PipelineFinding,
  PipelineSecurityReport,
  PipelineSeverity,
  PipelineStep
} from "./types.js";

const weights: Record<PipelineSeverity, number> = {
  critical:35, high:20, medium:8, low:3
};

function finding(
  pipeline: PipelineDefinition,
  ruleId: string,
  severity: PipelineSeverity,
  title: string,
  remediation: string,
  step?: PipelineStep
): PipelineFinding {
  const fingerprint = createHash("sha256")
    .update(`${pipeline.provider}|${pipeline.name}|${step?.name ?? ""}|${ruleId}`)
    .digest("hex");

  return {
    id:`cicd_${fingerprint.slice(0, 16)}`,
    ruleId, severity, step:step?.name, title, remediation
  };
}

export function evaluatePipelineSecurity(
  pipeline: PipelineDefinition
): PipelineSecurityReport {
  const findings: PipelineFinding[] = [];

  if (pipeline.trigger.includes("pull_request_target")) {
    findings.push(finding(
      pipeline, "CICD-TRIGGER-001", "critical",
      "pull_request_target trigger can expose trusted secrets to untrusted code",
      "Use pull_request for untrusted contributions or isolate privileged jobs."
    ));
  }

  if (pipeline.trigger.includes("push") && pipeline.protectedBranch !== true) {
    findings.push(finding(
      pipeline, "CICD-BRANCH-001", "high",
      "Deployment can run from an unprotected branch",
      "Require protected branches and mandatory review checks."
    ));
  }

  if (
    pipeline.steps.some(step => step.environment === "production") &&
    pipeline.requiresApproval !== true
  ) {
    findings.push(finding(
      pipeline, "CICD-DEPLOY-001", "high",
      "Production deployment lacks approval",
      "Require an independent approval before production deployment."
    ));
  }

  for (const step of pipeline.steps) {
    if (step.uses && (
      step.uses.endsWith("@main") ||
      step.uses.endsWith("@master") ||
      step.uses.endsWith("@latest")
    )) {
      findings.push(finding(
        pipeline, "CICD-ACTION-001", "high",
        "Third-party action is not pinned to an immutable version",
        "Pin actions to a commit SHA or trusted immutable release.",
        step
      ));
    }

    if ((step.permissions ?? []).includes("write-all")) {
      findings.push(finding(
        pipeline, "CICD-PERM-001", "critical",
        "Workflow grants write-all permission",
        "Grant only the minimum required token permissions.",
        step
      ));
    }

    if ((step.secrets ?? []).length > 0 && step.run?.includes("echo")) {
      findings.push(finding(
        pipeline, "CICD-SECRET-001", "critical",
        "Step may print secrets into logs",
        "Never echo secrets; pass them directly to protected commands.",
        step
      ));
    }

    if (step.run && /(curl|wget).*(\||bash|sh)/i.test(step.run)) {
      findings.push(finding(
        pipeline, "CICD-EXEC-001", "critical",
        "Pipeline downloads and executes remote code",
        "Download verified artifacts, validate checksums, then execute locally.",
        step
      ));
    }

    if (step.continueOnError === true && /security|scan|test/i.test(step.name)) {
      findings.push(finding(
        pipeline, "CICD-GATE-001", "high",
        "Security gate is allowed to fail",
        "Disable continue-on-error for security and test gates.",
        step
      ));
    }

    if (step.environment === "production" && (step.permissions ?? []).includes("contents:write")) {
      findings.push(finding(
        pipeline, "CICD-PROD-001", "medium",
        "Production job can modify repository contents",
        "Remove repository write permission from deployment jobs.",
        step
      ));
    }
  }

  const penalty = findings.reduce((sum, item) => sum + weights[item.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const decision =
    findings.some(item => item.severity === "critical") || score < 50
      ? "block"
      : score < 80
        ? "warn"
        : "allow";

  return {score, findings, decision};
}

export function createPipelineSummary(report: PipelineSecurityReport): string {
  return [
    `CI/CD security score: ${report.score}/100`,
    `Decision: ${report.decision}`,
    `Findings: ${report.findings.length}`,
    `Critical findings: ${report.findings.filter(item => item.severity === "critical").length}`
  ].join("\n");
}
