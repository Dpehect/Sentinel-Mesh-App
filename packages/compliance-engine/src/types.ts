export type Framework = "SOC2" | "ISO27001" | "NIST-CSF" | "OWASP-ASVS";

export interface ComplianceControl {
  id: string;
  framework: Framework;
  title: string;
  description: string;
  requiredEvidenceTypes: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: string;
  source: string;
  collectedAt: string;
  controlIds: string[];
}

export interface ComplianceResult {
  framework: Framework;
  totalControls: number;
  satisfiedControls: number;
  coveragePercent: number;
  missingControls: string[];
  matchedEvidenceIds: string[];
}
