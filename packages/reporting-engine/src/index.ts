import type {ExecutiveReport, RiskSnapshot} from "./types.js";

export type {ExecutiveReport, RiskSnapshot};

export function calculateRiskScore(snapshot: RiskSnapshot): number {
  const raw =
    snapshot.criticalFindings * 12 +
    snapshot.highFindings * 6 +
    snapshot.openAttackPaths * 8 +
    snapshot.overdueFindings * 5 -
    snapshot.blockedPullRequests * 2 -
    snapshot.complianceCoverage * 0.15;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function calculateTrend(
  previous: RiskSnapshot,
  latest: RiskSnapshot
): "improving" | "stable" | "worsening" {
  const delta = calculateRiskScore(latest) - calculateRiskScore(previous);
  if (delta <= -5) return "improving";
  if (delta >= 5) return "worsening";
  return "stable";
}

export function createExecutiveReport(
  previous: RiskSnapshot,
  latest: RiskSnapshot
): ExecutiveReport {
  const riskScore = calculateRiskScore(latest);
  const trend = calculateTrend(previous, latest);

  const highlights = [
    `${latest.criticalFindings} critical finding(s) remain open.`,
    `${latest.openAttackPaths} active attack path(s) detected.`,
    `${latest.blockedPullRequests} risky pull request(s) blocked.`,
    `Compliance coverage is ${latest.complianceCoverage}%.`
  ];

  const recommendations: string[] = [];
  if (latest.criticalFindings > 0) recommendations.push("Prioritize critical findings immediately.");
  if (latest.overdueFindings > 0) recommendations.push("Escalate overdue remediation work.");
  if (latest.openAttackPaths > 0) recommendations.push("Break highest-risk attack paths first.");
  if (latest.complianceCoverage < 80) recommendations.push("Close missing compliance evidence gaps.");
  if (!recommendations.length) recommendations.push("Maintain current controls and monitoring cadence.");

  return {
    periodStart:previous.capturedAt,
    periodEnd:latest.capturedAt,
    riskScore,
    trend,
    highlights,
    recommendations,
    latest
  };
}

export function renderExecutiveSummary(report: ExecutiveReport): string {
  return [
    `Risk score: ${report.riskScore}/100`,
    `Trend: ${report.trend}`,
    ...report.highlights,
    "Recommendations:",
    ...report.recommendations.map(item => `- ${item}`)
  ].join("\n");
}
