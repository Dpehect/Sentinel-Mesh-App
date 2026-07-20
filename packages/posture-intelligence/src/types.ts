export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AssetKind =
  | "kubernetes-workload" | "kubernetes-service" | "kubernetes-rbac"
  | "terraform-resource" | "cloudformation-resource" | "docker-service";

export interface PostureAsset {
  id: string;
  kind: AssetKind;
  provider: "kubernetes" | "aws" | "azure" | "gcp" | "docker" | "unknown";
  name: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface PostureFinding {
  id: string;
  ruleId: string;
  title: string;
  severity: Severity;
  confidence: number;
  assetId: string;
  source: string;
  evidence: string[];
  remediation: string;
  standards: string[];
}

export interface PostureScanInput {
  path: string;
  content: string;
}

export interface PostureScanResult {
  assets: PostureAsset[];
  findings: PostureFinding[];
  score: number;
  summary: Record<Severity, number>;
}
