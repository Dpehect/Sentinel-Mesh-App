export type ExposureType =
  | "vulnerability"
  | "misconfiguration"
  | "identity-path"
  | "secret"
  | "internet-exposure"
  | "runtime-threat"
  | "supply-chain";

export type ExposureSeverity = "critical" | "high" | "medium" | "low";
export type ExposureStatus = "open" | "accepted" | "remediated" | "suppressed";

export interface ExposureSignal {
  id: string;
  tenantId: string;
  assetId: string;
  type: ExposureType;
  severity: ExposureSeverity;
  title: string;
  detectedAt: string;
  status: ExposureStatus;
  exploitAvailable?: boolean;
  internetExposed?: boolean;
  privilegedPath?: boolean;
  activeThreatMatch?: boolean;
  businessImpact?: number;
  confidence?: number;
  evidenceIds?: string[];
}

export interface ExposureRecord extends ExposureSignal {
  riskScore: number;
  priority: "P0" | "P1" | "P2" | "P3";
  reasons: string[];
}

export interface ExposureCampaign {
  id: string;
  tenantId: string;
  assetIds: string[];
  exposureIds: string[];
  title: string;
  priority: ExposureRecord["priority"];
  riskScore: number;
}

export interface ExposureReport {
  totalSignals: number;
  activeExposures: number;
  p0Count: number;
  p1Count: number;
  campaigns: ExposureCampaign[];
  exposures: ExposureRecord[];
  decision: "monitor" | "remediate" | "urgent";
}
