export interface RiskSnapshot {
  capturedAt: string;
  criticalFindings: number;
  highFindings: number;
  openAttackPaths: number;
  blockedPullRequests: number;
  overdueFindings: number;
  complianceCoverage: number;
}

export interface ExecutiveReport {
  periodStart: string;
  periodEnd: string;
  riskScore: number;
  trend: "improving" | "stable" | "worsening";
  highlights: string[];
  recommendations: string[];
  latest: RiskSnapshot;
}
