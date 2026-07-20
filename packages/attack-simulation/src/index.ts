import type {
  ControlObservation,
  ScenarioResult,
  SimulationControl,
  SimulationReport,
  SimulationScenario
} from "./types.js";

export type {
  ControlObservation,
  ControlOutcome,
  ScenarioResult,
  SimulationControl,
  SimulationReport,
  SimulationScenario,
  SimulationTechnique
} from "./types.js";

export function validateScenario(
  scenario: SimulationScenario,
  controls: SimulationControl[]
): string[] {
  const known = new Set(controls.map(control => control.id));
  return scenario.requiredControls.filter(controlId => !known.has(controlId));
}

export function simulateScenario(
  scenario: SimulationScenario,
  controls: SimulationControl[],
  observations: ControlObservation[]
): ScenarioResult {
  const invalidControls = validateScenario(scenario, controls);
  if (invalidControls.length) {
    throw new Error(`UNKNOWN_SIMULATION_CONTROL:${invalidControls.join(",")}`);
  }

  const relevant = observations.filter(observation =>
    scenario.requiredControls.includes(observation.controlId)
  );

  const prevented = relevant.filter(item => item.outcome === "prevented");
  const detected = relevant.filter(item => item.outcome === "detected");
  const missed = scenario.requiredControls.filter(controlId => {
    const observation = relevant.find(item => item.controlId === controlId);
    return !observation ||
      observation.outcome === "missed" ||
      observation.outcome === "not-tested";
  });

  const outcome =
    prevented.length > 0
      ? "blocked"
      : detected.length > 0
        ? "detected"
        : "successful";

  const base =
    outcome === "blocked" ? 100 :
    outcome === "detected" ? 65 : 10;

  const coveragePenalty =
    scenario.requiredControls.length === 0
      ? 0
      : Math.round((missed.length / scenario.requiredControls.length) * 40);

  const impactPenalty = Math.round(
    Math.max(0, Math.min(100, scenario.businessImpact)) * 0.15
  );

  const evidenceIds = [...new Set(
    relevant.flatMap(item => item.evidenceIds ?? [])
  )];

  return {
    scenarioId:scenario.id,
    outcome,
    resilienceScore:Math.max(0, Math.min(100, base - coveragePenalty - impactPenalty)),
    missingControls:missed,
    observedControls:[...new Set(relevant.map(item => item.controlId))],
    evidenceIds
  };
}

export function runAttackSimulation(
  scenarios: SimulationScenario[],
  controls: SimulationControl[],
  observations: Record<string, ControlObservation[]>
): SimulationReport {
  const results = scenarios.map(scenario =>
    simulateScenario(
      scenario,
      controls,
      observations[scenario.id] ?? []
    )
  );

  const blocked = results.filter(result => result.outcome === "blocked").length;
  const detected = results.filter(result => result.outcome === "detected").length;
  const successful = results.filter(result => result.outcome === "successful").length;

  const resilienceScore = results.length
    ? Math.round(
        results.reduce((sum, result) => sum + result.resilienceScore, 0) /
        results.length
      )
    : 100;

  const gapCounts = new Map<string, number>();
  for (const result of results) {
    for (const controlId of result.missingControls) {
      gapCounts.set(controlId, (gapCounts.get(controlId) ?? 0) + 1);
    }
  }

  const priorityGaps = [...gapCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([controlId]) => controlId);

  return {
    scenariosRun:results.length,
    blocked,
    detected,
    successful,
    resilienceScore,
    priorityGaps,
    results
  };
}

export function createSimulationSummary(report: SimulationReport): string {
  return [
    `Attack-simulation resilience: ${report.resilienceScore}/100`,
    `Scenarios run: ${report.scenariosRun}`,
    `Blocked: ${report.blocked}`,
    `Detected: ${report.detected}`,
    `Successful: ${report.successful}`,
    `Priority gaps: ${report.priorityGaps.join(", ") || "None"}`
  ].join("\n");
}
