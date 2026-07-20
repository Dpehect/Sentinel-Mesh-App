import {createHash} from "node:crypto";
import type {
  AttackSurfaceChange,
  AttackSurfaceReport,
  ExternalAssetObservation,
  ExternalAssetRecord
} from "./types.js";

export type {
  AttackSurfaceChange,
  AttackSurfaceReport,
  ExternalAssetObservation,
  ExternalAssetRecord,
  ExternalAssetStatus,
  ExternalAssetType,
  OwnershipStatus
} from "./types.js";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function identity(observation: ExternalAssetObservation): string {
  return createHash("sha256")
    .update(`${observation.tenantId}|${observation.type}|${normalize(observation.value)}`)
    .digest("hex");
}

export function scoreExternalAsset(
  observation: ExternalAssetObservation,
  now = new Date()
): {riskScore:number; reasons:string[]} {
  const reasons: string[] = [];
  let score = 0;

  if (observation.ownership === "unknown") {
    score += 25;
    reasons.push("UNKNOWN_OWNERSHIP");
  }

  if (observation.publicWriteAccess) {
    score += 45;
    reasons.push("PUBLIC_WRITE_ACCESS");
  }

  if (observation.adminInterface) {
    score += 25;
    reasons.push("PUBLIC_ADMIN_INTERFACE");
  }

  if (observation.loginExposed) {
    score += 15;
    reasons.push("PUBLIC_LOGIN");
  }

  if (observation.tlsEnabled === false) {
    score += 20;
    reasons.push("TLS_DISABLED");
  }

  const dangerousPorts = new Set([21, 23, 445, 2375, 3389, 5432, 6379, 9200]);
  if ((observation.ports ?? []).some(port => dangerousPorts.has(port))) {
    score += 30;
    reasons.push("HIGH_RISK_PORT_EXPOSED");
  }

  if (observation.certificateExpiresAt) {
    const remainingDays = (
      new Date(observation.certificateExpiresAt).getTime() - now.getTime()
    ) / (24 * 60 * 60 * 1000);

    if (remainingDays <= 0) {
      score += 35;
      reasons.push("CERTIFICATE_EXPIRED");
    } else if (remainingDays <= 30) {
      score += 15;
      reasons.push("CERTIFICATE_EXPIRING");
    }
  }

  return {
    riskScore:Math.max(0, Math.min(100, score)),
    reasons:[...new Set(reasons)]
  };
}

export function createExternalAssetRecord(
  observation: ExternalAssetObservation,
  now = new Date(observation.observedAt)
): ExternalAssetRecord {
  const hash = identity(observation);
  const scored = scoreExternalAsset(observation, now);

  return {
    ...observation,
    value:normalize(observation.value),
    id:`external_${hash.slice(0, 16)}`,
    status:observation.status ?? "active",
    firstSeenAt:observation.observedAt,
    lastSeenAt:observation.observedAt,
    riskScore:scored.riskScore,
    reasons:scored.reasons
  };
}

export function mergeExternalInventory(
  previous: ExternalAssetRecord[],
  observations: ExternalAssetObservation[],
  now = new Date()
): ExternalAssetRecord[] {
  const map = new Map(previous.map(asset => [asset.id, asset]));

  for (const observation of observations) {
    const candidate = createExternalAssetRecord(observation, now);
    const existing = map.get(candidate.id);

    map.set(candidate.id, existing
      ? {
          ...existing,
          ...observation,
          value:candidate.value,
          lastSeenAt:observation.observedAt,
          riskScore:candidate.riskScore,
          reasons:candidate.reasons,
          status:observation.status ?? "active"
        }
      : candidate
    );
  }

  return [...map.values()];
}

export function detectAttackSurfaceChanges(
  previous: ExternalAssetRecord[],
  current: ExternalAssetRecord[],
  now = new Date()
): AttackSurfaceChange[] {
  const before = new Map(previous.map(asset => [asset.id, asset]));
  const after = new Map(current.map(asset => [asset.id, asset]));
  const changes: AttackSurfaceChange[] = [];

  for (const asset of current) {
    const old = before.get(asset.id);

    if (!old) {
      changes.push({
        type:"new-asset",
        assetId:asset.id,
        severity:asset.riskScore >= 70 ? "critical" : asset.riskScore >= 40 ? "high" : "medium",
        detail:`New external asset discovered: ${asset.value}`
      });
    } else if (asset.riskScore > old.riskScore) {
      changes.push({
        type:"risk-increased",
        assetId:asset.id,
        severity:asset.riskScore >= 70 ? "critical" : "high",
        detail:`Risk increased from ${old.riskScore} to ${asset.riskScore}`
      });
    }

    if (asset.certificateExpiresAt) {
      const remainingDays = (
        new Date(asset.certificateExpiresAt).getTime() - now.getTime()
      ) / (24 * 60 * 60 * 1000);

      if (remainingDays <= 30) {
        changes.push({
          type:"certificate-expiring",
          assetId:asset.id,
          severity:remainingDays <= 0 ? "critical" : "medium",
          detail:`Certificate expires in ${Math.floor(remainingDays)} days`
        });
      }
    }
  }

  for (const asset of previous) {
    if (!after.has(asset.id)) {
      changes.push({
        type:"asset-removed",
        assetId:asset.id,
        severity:"low",
        detail:`External asset no longer observed: ${asset.value}`
      });
    }
  }

  return changes;
}

export function evaluateExternalAttackSurface(
  previous: ExternalAssetRecord[],
  observations: ExternalAssetObservation[],
  now = new Date()
): AttackSurfaceReport {
  const assets = mergeExternalInventory(previous, observations, now);
  const currentIds = new Set(observations.map(item =>
    createExternalAssetRecord(item, now).id
  ));
  const activeAssets = assets.filter(asset => currentIds.has(asset.id));
  const changes = detectAttackSurfaceChanges(previous, activeAssets, now);

  const unknownAssets = activeAssets
    .filter(asset => asset.ownership === "unknown")
    .map(asset => asset.id);

  const criticalAssets = activeAssets
    .filter(asset => asset.riskScore >= 70)
    .map(asset => asset.id);

  const score = activeAssets.length
    ? Math.round(
        activeAssets.reduce((sum, asset) => sum + asset.riskScore, 0) /
        activeAssets.length
      )
    : 0;

  return {
    assets:activeAssets.sort((a, b) => b.riskScore - a.riskScore),
    changes,
    unknownAssets,
    criticalAssets,
    score,
    decision:criticalAssets.length > 0
      ? "urgent"
      : unknownAssets.length > 0 || score >= 35
        ? "investigate"
        : "monitor"
  };
}
