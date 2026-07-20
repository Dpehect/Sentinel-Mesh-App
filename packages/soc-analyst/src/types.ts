export type AnalystSeverity = "critical" | "high" | "medium" | "low";

export interface AnalystSignal {
  id: string;
  source: string;
  severity: AnalystSeverity;
  title: string;
  entityId?: string;
  assetId?: string;
  evidenceIds?: string[];
  mitreTechniques?: string[];
  confidence?: number;
  timestamp: string;
}

export interface AnalystRecommendation {
  action: string;
  priority: number;
  requiresApproval: boolean;
  reason: string;
}

export interface AnalystCase {
  title: string;
  severity: AnalystSeverity;
  confidence: number;
  summary: string;
  timeline: string[];
  evidenceIds: string[];
  mitreTechniques: string[];
  recommendations: AnalystRecommendation[];
  decision: "close" | "investigate" | "contain";
}
