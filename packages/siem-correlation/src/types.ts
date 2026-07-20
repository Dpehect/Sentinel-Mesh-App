export type SecurityEventSeverity = "critical" | "high" | "medium" | "low";

export interface SecurityEvent {
  id: string;
  tenantId: string;
  timestamp: string;
  source: string;
  type: string;
  severity: SecurityEventSeverity;
  entityId?: string;
  assetId?: string;
  sourceIp?: string;
  destinationIp?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface CorrelationRule {
  id: string;
  name: string;
  eventTypes: string[];
  minimumMatches: number;
  windowMinutes: number;
  groupBy: "entityId" | "assetId" | "sourceIp" | "tenantId";
  severity: SecurityEventSeverity;
  requiredSources?: string[];
}

export interface CorrelatedIncident {
  id: string;
  ruleId: string;
  tenantId: string;
  groupValue: string;
  severity: SecurityEventSeverity;
  eventIds: string[];
  sources: string[];
  startedAt: string;
  endedAt: string;
  confidence: number;
}

export interface CorrelationReport {
  eventsProcessed: number;
  incidents: CorrelatedIncident[];
  highestConfidence: number;
  decision: "allow" | "investigate" | "escalate";
}
