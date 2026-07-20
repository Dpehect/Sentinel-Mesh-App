export type HuntOperator =
  | "equals"
  | "contains"
  | "starts-with"
  | "ends-with"
  | "greater-than"
  | "less-than"
  | "in";

export interface HuntEvent {
  id: string;
  tenantId: string;
  timestamp: string;
  source: string;
  type: string;
  entityId?: string;
  assetId?: string;
  fields: Record<string, string | number | boolean | string[]>;
  evidenceIds?: string[];
}

export interface HuntCondition {
  field: string;
  operator: HuntOperator;
  value: string | number | boolean | string[];
}

export interface HuntQuery {
  id: string;
  name: string;
  hypothesis: string;
  sources: string[];
  conditions: HuntCondition[];
  conditionMode: "all" | "any";
  minimumMatches?: number;
  mitreTechniques?: string[];
}

export interface HuntMatch {
  queryId: string;
  eventIds: string[];
  entityIds: string[];
  assetIds: string[];
  evidenceIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  confidence: number;
}

export interface HuntReport {
  queriesRun: number;
  eventsAnalyzed: number;
  matches: HuntMatch[];
  confirmedHypotheses: string[];
  decision: "no-findings" | "review" | "escalate";
}
