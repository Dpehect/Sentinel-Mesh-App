export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface SourceLocation {
  path: string;
  line?: number;
  column?: number;
  excerpt?: string;
}

export interface DataFlowStep {
  kind: "source" | "propagation" | "sanitizer" | "sink";
  label: string;
  location: SourceLocation;
}

export interface SecurityEvidence {
  id: string;
  title: string;
  severity: Severity;
  confidence: number;
  cwe: string[];
  owasp: string[];
  source?: SourceLocation;
  sink?: SourceLocation;
  flow: DataFlowStep[];
  remediation: string;
  fingerprint: string;
}
