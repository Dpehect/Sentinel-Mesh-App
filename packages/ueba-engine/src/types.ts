export type EntityType = "user" | "service-account" | "device" | "workload";
export type BehaviorSeverity = "critical" | "high" | "medium" | "low";

export interface BehaviorBaseline {
  entityId: string;
  entityType: EntityType;
  usualHours: number[];
  usualCountries: string[];
  usualActions: string[];
  averageEventsPerHour: number;
  averageDataTransferMb: number;
}

export interface BehaviorEvent {
  entityId: string;
  entityType: EntityType;
  timestamp: string;
  action: string;
  country?: string;
  sourceIp?: string;
  success: boolean;
  dataTransferMb?: number;
  privileged?: boolean;
}

export interface BehaviorAnomaly {
  id: string;
  entityId: string;
  ruleId: string;
  severity: BehaviorSeverity;
  score: number;
  title: string;
  evidence: string;
}

export interface UebaReport {
  entitiesAnalyzed: number;
  eventsAnalyzed: number;
  anomalies: BehaviorAnomaly[];
  highestScore: number;
  decision: "allow" | "investigate" | "contain";
}
