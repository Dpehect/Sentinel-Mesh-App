export type AdvancedUebaSeverity = "critical" | "high" | "medium" | "low";

export interface AdvancedBehaviorProfile {
  entityId: string;
  peerGroup: string;
  lastActiveAt?: string;
  usualCountries: string[];
  usualActions: string[];
  averageDailyEvents: number;
  averageDataTransferMb: number;
  privileged?: boolean;
}

export interface AdvancedBehaviorEvent {
  id: string;
  entityId: string;
  peerGroup: string;
  timestamp: string;
  action: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  sourceIp?: string;
  success: boolean;
  privileged?: boolean;
  dataTransferMb?: number;
  resourceId?: string;
}

export interface PeerGroupMetric {
  peerGroup: string;
  action: string;
  averagePerEntity: number;
}

export interface AdvancedUebaFinding {
  id: string;
  entityId: string;
  ruleId: string;
  severity: AdvancedUebaSeverity;
  score: number;
  title: string;
  evidenceEventIds: string[];
  reasons: string[];
}

export interface AdvancedUebaReport {
  entitiesAnalyzed: number;
  eventsAnalyzed: number;
  findings: AdvancedUebaFinding[];
  highestScore: number;
  entitiesToContain: string[];
  decision: "allow" | "investigate" | "contain";
}
