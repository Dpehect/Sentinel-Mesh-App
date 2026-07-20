export type SimulationTechnique =
  | "credential-exposure"
  | "public-service"
  | "privilege-escalation"
  | "lateral-movement"
  | "data-exfiltration"
  | "malicious-dependency"
  | "unsafe-deployment";

export type ControlOutcome = "prevented" | "detected" | "missed" | "not-tested";

export interface SimulationControl {
  id: string;
  name: string;
  techniques: SimulationTechnique[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  technique: SimulationTechnique;
  requiredControls: string[];
  assetIds: string[];
  businessImpact: number;
}

export interface ControlObservation {
  controlId: string;
  outcome: ControlOutcome;
  observedAt: string;
  evidenceIds?: string[];
}

export interface ScenarioResult {
  scenarioId: string;
  outcome: "blocked" | "detected" | "successful";
  resilienceScore: number;
  missingControls: string[];
  observedControls: string[];
  evidenceIds: string[];
}

export interface SimulationReport {
  scenariosRun: number;
  blocked: number;
  detected: number;
  successful: number;
  resilienceScore: number;
  priorityGaps: string[];
  results: ScenarioResult[];
}
