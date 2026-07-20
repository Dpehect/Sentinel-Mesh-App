import {createHash} from "node:crypto";
import type {
  AssetObservation,
  AssetRisk,
  DiscoveredAsset,
  InventoryMergeResult
} from "./types.js";

export type {
  AssetObservation,
  AssetRisk,
  AssetStatus,
  AssetType,
  DiscoveredAsset,
  InventoryMergeResult
} from "./types.js";

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function createAssetFingerprint(
  observation: AssetObservation
): string {
  const canonical = [
    observation.tenantId,
    observation.type,
    normalize(observation.externalId),
    normalize(observation.name),
    normalize(observation.location)
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

export function classifyAssetRisk(
  observation: AssetObservation
): AssetRisk {
  const publicFacing =
    observation.metadata?.public === "true" ||
    observation.metadata?.internetFacing === "true";

  const criticalData =
    observation.metadata?.criticalData === "true" ||
    observation.metadata?.production === "true";

  if (publicFacing && criticalData) return "critical";
  if (criticalData) return "high";
  if (publicFacing) return "medium";
  return "low";
}

export function discoverAsset(
  observation: AssetObservation
): DiscoveredAsset {
  const fingerprint = createAssetFingerprint(observation);

  return {
    ...observation,
    id:`asset_${fingerprint.slice(0, 16)}`,
    fingerprint,
    status:"active",
    risk:classifyAssetRisk(observation),
    firstSeenAt:observation.observedAt,
    lastSeenAt:observation.observedAt
  };
}

export function mergeAssetInventory(
  existing: DiscoveredAsset[],
  observations: AssetObservation[]
): InventoryMergeResult {
  const byFingerprint = new Map(
    existing.map(asset => [asset.fingerprint, asset])
  );
  const created: string[] = [];
  const updated: string[] = [];
  const duplicates: string[] = [];

  for (const observation of observations) {
    const fingerprint = createAssetFingerprint(observation);
    const current = byFingerprint.get(fingerprint);

    if (current) {
      if (current.lastSeenAt === observation.observedAt) {
        duplicates.push(current.id);
        continue;
      }

      byFingerprint.set(fingerprint, {
        ...current,
        ...observation,
        lastSeenAt:observation.observedAt,
        status:"active",
        risk:classifyAssetRisk(observation)
      });
      updated.push(current.id);
      continue;
    }

    const asset = discoverAsset(observation);
    byFingerprint.set(fingerprint, asset);
    created.push(asset.id);
  }

  return {
    assets:[...byFingerprint.values()],
    created,
    updated,
    duplicates
  };
}

export function markStaleAssets(
  assets: DiscoveredAsset[],
  now: Date,
  inactiveAfterDays = 30,
  archiveAfterDays = 180
): DiscoveredAsset[] {
  return assets.map(asset => {
    const ageDays =
      (now.getTime() - new Date(asset.lastSeenAt).getTime()) /
      (24 * 60 * 60 * 1000);

    if (ageDays >= archiveAfterDays) return {...asset, status:"archived"};
    if (ageDays >= inactiveAfterDays) return {...asset, status:"inactive"};
    return asset;
  });
}
