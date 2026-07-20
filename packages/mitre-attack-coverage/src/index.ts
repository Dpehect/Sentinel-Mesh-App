import type {
  AttackCoverageReport,
  AttackTechnique,
  SecurityControlCoverage,
  TechniqueCoverage
} from "./types.js";

export type {
  AttackCoverageReport,
  AttackTechnique,
  CoverageLevel,
  ControlType,
  SecurityControlCoverage,
  TechniqueCoverage
} from "./types.js";

export function evaluateTechniqueCoverage(
  technique: AttackTechnique,
  controls: SecurityControlCoverage[]
): TechniqueCoverage {
  const relevant = controls.filter(control =>
    control.enabled && control.techniques.includes(technique.id)
  );

  const gaps: string[] = [];
  if (relevant.length === 0) {
    gaps.push("NO_SECURITY_CONTROL");
  }

  const tested = relevant.filter(control => control.tested);
  if (relevant.length > 0 && tested.length === 0) {
    gaps.push("CONTROL_NOT_TESTED");
  }

  const detection = relevant.some(control => control.controlType === "detection");
  const prevention = relevant.some(control => control.controlType === "prevention");
  const response = relevant.some(control => control.controlType === "response");
  const visibility = relevant.some(control => control.controlType === "visibility");

  if (!detection) gaps.push("NO_DETECTION");
  if (!prevention) gaps.push("NO_PREVENTION");
  if (!response) gaps.push("NO_RESPONSE");
  if (!visibility) gaps.push("NO_VISIBILITY");

  const averageEffectiveness = relevant.length
    ? relevant.reduce(
        (sum,control) => sum + Math.max(0,Math.min(100,control.effectiveness)),
        0
      ) / relevant.length
    : 0;

  const diversityBonus = [detection,prevention,response,visibility]
    .filter(Boolean).length * 8;

  const testedBonus = tested.length > 0 ? 15 : 0;
  const score = Math.max(
    0,
    Math.min(100,Math.round(averageEffectiveness * 0.65 + diversityBonus + testedBonus))
  );

  const level =
    score >= 75 ? "covered" :
    score >= 35 ? "partial" : "none";

  return {
    techniqueId:technique.id,
    level,
    score,
    controlIds:relevant.map(control=>control.controlId),
    gaps:[...new Set(gaps)]
  };
}

export function evaluateAttackCoverage(
  techniques: AttackTechnique[],
  controls: SecurityControlCoverage[]
): AttackCoverageReport {
  const techniqueCoverage = techniques.map(technique =>
    evaluateTechniqueCoverage(technique,controls)
  );

  const coveredTechniques = techniqueCoverage.filter(
    item => item.level === "covered"
  ).length;

  const partialTechniques = techniqueCoverage.filter(
    item => item.level === "partial"
  ).length;

  const uncoveredTechniques = techniqueCoverage.filter(
    item => item.level === "none"
  ).length;

  const coveragePercent = techniques.length
    ? Math.round(
        techniqueCoverage.reduce((sum,item)=>sum+item.score,0) /
        techniques.length
      )
    : 100;

  const priorityById = new Map(
    techniques.map(item=>[item.id,item.priority ?? 50])
  );

  const priorityGaps = techniqueCoverage
    .filter(item => item.level !== "covered")
    .sort((a,b) =>
      (priorityById.get(b.techniqueId) ?? 50) -
      (priorityById.get(a.techniqueId) ?? 50) ||
      a.score - b.score
    )
    .map(item=>item.techniqueId);

  return {
    totalTechniques:techniques.length,
    coveredTechniques,
    partialTechniques,
    uncoveredTechniques,
    coveragePercent,
    techniqueCoverage,
    priorityGaps,
    decision:uncoveredTechniques > Math.max(2,Math.floor(techniques.length * 0.3))
      ? "critical-gap"
      : coveragePercent < 75
        ? "improve"
        : "healthy"
  };
}

export function createAttackCoverageSummary(
  report: AttackCoverageReport
): string {
  return [
    `MITRE ATT&CK decision: ${report.decision}`,
    `Coverage: ${report.coveragePercent}/100`,
    `Covered techniques: ${report.coveredTechniques}`,
    `Partial techniques: ${report.partialTechniques}`,
    `Uncovered techniques: ${report.uncoveredTechniques}`,
    `Priority gaps: ${report.priorityGaps.join(", ") || "None"}`
  ].join("\n");
}
