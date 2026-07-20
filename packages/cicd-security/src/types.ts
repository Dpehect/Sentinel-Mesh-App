export type PipelineSeverity = "critical" | "high" | "medium" | "low";

export interface PipelineStep {
  name: string;
  uses?: string;
  run?: string;
  permissions?: string[];
  secrets?: string[];
  environment?: string;
  continueOnError?: boolean;
}

export interface PipelineDefinition {
  provider: "github-actions" | "gitlab-ci" | "generic";
  name: string;
  trigger: string[];
  protectedBranch?: boolean;
  requiresApproval?: boolean;
  steps: PipelineStep[];
}

export interface PipelineFinding {
  id: string;
  ruleId: string;
  severity: PipelineSeverity;
  step?: string;
  title: string;
  remediation: string;
}

export interface PipelineSecurityReport {
  score: number;
  findings: PipelineFinding[];
  decision: "allow" | "warn" | "block";
}
