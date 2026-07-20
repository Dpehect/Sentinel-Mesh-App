export type IndicatorType =
  | "ipv4"
  | "ipv6"
  | "domain"
  | "url"
  | "sha256"
  | "sha1"
  | "md5"
  | "email";

export type ThreatSeverity = "critical" | "high" | "medium" | "low";

export interface ThreatIndicator {
  id: string;
  type: IndicatorType;
  value: string;
  severity: ThreatSeverity;
  confidence: number;
  source: string;
  labels: string[];
  firstSeenAt?: string;
  lastSeenAt?: string;
  expiresAt?: string;
}

export interface Observable {
  type: IndicatorType;
  value: string;
  sourceAssetId?: string;
  observedAt: string;
}

export interface ThreatMatch {
  indicatorId: string;
  observable: Observable;
  severity: ThreatSeverity;
  confidence: number;
  riskScore: number;
  labels: string[];
}

export interface ThreatIntelReport {
  indicatorsLoaded: number;
  observablesChecked: number;
  matches: ThreatMatch[];
  highestRiskScore: number;
  decision: "allow" | "warn" | "block";
}

export interface StixIndicatorLike {
  type: "indicator";
  id: string;
  pattern: string;
  confidence?: number;
  labels?: string[];
  created?: string;
  modified?: string;
  valid_until?: string;
}
