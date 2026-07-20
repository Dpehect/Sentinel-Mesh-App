export type DetectionSeverity = "critical" | "high" | "medium" | "low";
export type DetectionStatus = "draft" | "testing" | "active" | "disabled";

export interface DetectionRule {
  id: string;
  title: string;
  description: string;
  severity: DetectionSeverity;
  status: DetectionStatus;
  eventTypes: string[];
  requiredFields: string[];
  condition: "all" | "any";
  tags: string[];
  version: number;
  author: string;
}

export interface DetectionTestCase {
  id: string;
  ruleId: string;
  event: Record<string, unknown>;
  shouldMatch: boolean;
}

export interface DetectionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DetectionTestResult {
  passed: number;
  failed: number;
  failures: string[];
}

export interface DetectionReleaseDecision {
  allowed: boolean;
  reason?: string;
  checksum: string;
}
