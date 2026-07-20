export type ComplianceFramework =
  | "SOC2"
  | "ISO27001"
  | "NIST-CSF"
  | "CIS"
  | "GDPR"
  | "PCI-DSS"
  | "CUSTOM";

export type ControlStatus = "pass" | "fail" | "warning" | "not-applicable";

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  title: string;
  description: string;
  evidenceTypes: string[];
  required: boolean;
}

export interface ControlObservation {
  controlId: string;
  observedAt: string;
  status: ControlStatus;
  evidenceIds: string[];
  resourceIds: string[];
  note?: string;
}

export interface ComplianceSnapshot {
  id: string;
  tenantId: string;
  createdAt: string;
  observations: ControlObservation[];
}

export interface ComplianceDrift {
  controlId: string;
  previousStatus: ControlStatus;
  currentStatus: ControlStatus;
  severity: "high" | "medium" | "low";
}

export interface ComplianceReport {
  framework: ComplianceFramework;
  score: number;
  passed: number;
  failed: number;
  warnings: number;
  missingEvidenceControls: string[];
  drift: ComplianceDrift[];
  auditReady: boolean;
}
