import {createHash} from "node:crypto";
import type {
  ExposureCampaign,
  ExposureRecord,
  ExposureReport,
  ExposureSignal
} from "./types.js";

export type {
  ExposureCampaign,
  ExposureRecord,
  ExposureReport,
  ExposureSeverity,
  ExposureSignal,
  ExposureStatus,
  ExposureType
} from "./types.js";

const severityBase = {
  critical:70,
  high:50,
  medium:30,
  low:12
} as const;

export function scoreExposure(signal: ExposureSignal): ExposureRecord {
  const reasons: string[] = [];
  let score = severityBase[signal.severity];

  if (signal.exploitAvailable) {
    score += 15;
    reasons.push("EXPLOIT_AVAILABLE");
  }

  if (signal.internetExposed) {
    score += 15;
    reasons.push("INTERNET_EXPOSED");
  }

  if (signal.privilegedPath) {
    score += 18;
    reasons.push("PRIVILEGED_ATTACK_PATH");
  }

  if (signal.activeThreatMatch) {
    score += 20;
    reasons.push("ACTIVE_THREAT_MATCH");
  }

  const businessImpact = Math.max(0, Math.min(100, signal.businessImpact ?? 0));
  if (businessImpact >= 70) {
    score += 12;
    reasons.push("HIGH_BUSINESS_IMPACT");
  } else if (businessImpact >= 40) {
    score += 6;
    reasons.push("MEDIUM_BUSINESS_IMPACT");
  }

  const confidence = Math.max(0, Math.min(100, signal.confidence ?? 100));
  score = Math.round(score * (0.5 + confidence / 200));
  score = Math.max(0, Math.min(100, score));

  const priority =
    score >= 90 ? "P0" :
    score >= 70 ? "P1" :
    score >= 40 ? "P2" : "P3";

  return {
    ...signal,
    riskScore:score,
    priority,
    reasons
  };
}

export function createExposureCampaigns(
  exposures: ExposureRecord[]
): ExposureCampaign[] {
  const active = exposures.filter(item =>
    item.status === "open" || item.status === "accepted"
  );

  const byTenantAndAsset = new Map<string, ExposureRecord[]>();
  for (const exposure of active) {
    const key = `${exposure.tenantId}|${exposure.assetId}`;
    byTenantAndAsset.set(key, [
      ...(byTenantAndAsset.get(key) ?? []),
      exposure
    ]);
  }

  return [...byTenantAndAsset.entries()].map(([key, items]) => {
    const [tenantId, assetId] = key.split("|");
    const riskScore = Math.min(100, Math.round(
      Math.max(...items.map(item => item.riskScore)) +
      Math.min(20, (items.length - 1) * 4)
    ));

    const priority =
      riskScore >= 90 ? "P0" :
      riskScore >= 70 ? "P1" :
      riskScore >= 40 ? "P2" : "P3";

    const fingerprint = createHash("sha256")
      .update(`${tenantId}|${assetId}|${items.map(item => item.id).sort().join("|")}`)
      .digest("hex");

    return {
      id:`campaign_${fingerprint.slice(0, 16)}`,
      tenantId,
      assetIds:[assetId],
      exposureIds:items.map(item => item.id),
      title:`Exposure campaign for ${assetId}`,
      priority,
      riskScore
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

export function evaluateExposureManagement(
  signals: ExposureSignal[]
): ExposureReport {
  const exposures = signals.map(scoreExposure);
  const active = exposures.filter(item =>
    item.status === "open" || item.status === "accepted"
  );
  const campaigns = createExposureCampaigns(exposures);

  const p0Count = active.filter(item => item.priority === "P0").length;
  const p1Count = active.filter(item => item.priority === "P1").length;

  return {
    totalSignals:signals.length,
    activeExposures:active.length,
    p0Count,
    p1Count,
    campaigns,
    exposures:exposures.sort((a, b) => b.riskScore - a.riskScore),
    decision:p0Count > 0
      ? "urgent"
      : p1Count > 0
        ? "remediate"
        : "monitor"
  };
}

export function createExposureSummary(report: ExposureReport): string {
  return [
    `Exposure decision: ${report.decision}`,
    `Signals: ${report.totalSignals}`,
    `Active exposures: ${report.activeExposures}`,
    `P0 exposures: ${report.p0Count}`,
    `P1 exposures: ${report.p1Count}`,
    `Campaigns: ${report.campaigns.length}`
  ].join("\n");
}
