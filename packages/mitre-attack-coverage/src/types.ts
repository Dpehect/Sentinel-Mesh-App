export type CoverageLevel = "none" | "partial" | "covered";
export type ControlType = "detection" | "prevention" | "response" | "visibility";

export interface AttackTechnique {
  id: string;
  name: string;
  tactic: string;
  priority?: number;
}

export interface SecurityControlCoverage {
  controlId: string;
  controlType: ControlType;
  techniques: string[];
  enabled: boolean;
  tested: boolean;
  effectiveness: number;
}

export interface TechniqueCoverage {
  techniqueId: string;
  level: CoverageLevel;
  score: number;
  controlIds: string[];
  gaps: string[];
}

export interface AttackCoverageReport {
  totalTechniques: number;
  coveredTechniques: number;
  partialTechniques: number;
  uncoveredTechniques: number;
  coveragePercent: number;
  techniqueCoverage: TechniqueCoverage[];
  priorityGaps: string[];
  decision: "healthy" | "improve" | "critical-gap";
}
