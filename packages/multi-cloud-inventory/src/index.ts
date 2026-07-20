import {createHash} from "node:crypto";
import type {
  CloudCoverage,
  CloudProvider,
  InventoryChange,
  MultiCloudInventoryReport,
  RawCloudResource,
  UnifiedCloudResource,
  UnifiedResourceType
} from "./types.js";

export type {
  CloudCoverage,
  CloudProvider,
  InventoryChange,
  MultiCloudInventoryReport,
  RawCloudResource,
  UnifiedCloudResource,
  UnifiedResourceType
} from "./types.js";

const typeMatchers: Array<[RegExp, UnifiedResourceType]> = [
  [/(ec2|virtual.?machine|compute|server|host)/i, "compute"],
  [/(rds|sql|database|db|cosmos|spanner|bigtable)/i, "database"],
  [/(s3|blob|bucket|storage|object)/i, "storage"],
  [/(vpc|vnet|subnet|load.?balancer|firewall|network)/i, "network"],
  [/(iam|identity|role|user|service.?account)/i, "identity"],
  [/(eks|aks|gke|kubernetes|container|registry)/i, "container"],
  [/(lambda|function|serverless|cloud.?run)/i, "serverless"],
  [/(secret|key.?vault|kms|parameter.?store)/i, "secret"],
  [/(log|monitor|audit|cloudtrail|diagnostic)/i, "logging"]
];

export function mapUnifiedResourceType(nativeType: string): UnifiedResourceType {
  for (const [pattern, type] of typeMatchers) {
    if (pattern.test(nativeType)) return type;
  }
  return "unknown";
}

function normalizeRegion(provider: CloudProvider, region?: string): string {
  if (!region) return "global";
  return `${provider}:${region.trim().toLowerCase()}`;
}

function resourceIdentity(resource: RawCloudResource): string {
  return createHash("sha256")
    .update([
      resource.tenantId,
      resource.provider,
      resource.accountId,
      resource.nativeId
    ].join("|"))
    .digest("hex");
}

export function normalizeCloudResource(
  resource: RawCloudResource
): UnifiedCloudResource {
  const riskFlags: string[] = [];

  if (resource.internetExposed) riskFlags.push("INTERNET_EXPOSED");
  if (resource.encrypted === false) riskFlags.push("UNENCRYPTED");
  if (resource.managed === false) riskFlags.push("UNMANAGED");
  if (!resource.region) riskFlags.push("REGION_UNKNOWN");

  return {
    ...resource,
    id:`cloud_${resourceIdentity(resource).slice(0, 16)}`,
    unifiedType:mapUnifiedResourceType(resource.nativeType),
    normalizedRegion:normalizeRegion(resource.provider, resource.region),
    ownership:resource.managed === false ? "unmanaged" : "managed",
    riskFlags
  };
}

export function normalizeMultiCloudInventory(
  resources: RawCloudResource[]
): UnifiedCloudResource[] {
  const normalized = resources.map(normalizeCloudResource);
  const unique = new Map<string, UnifiedCloudResource>();

  for (const resource of normalized) {
    unique.set(resource.id, resource);
  }

  return [...unique.values()].sort((a, b) =>
    a.provider.localeCompare(b.provider) ||
    a.accountId.localeCompare(b.accountId) ||
    a.name.localeCompare(b.name)
  );
}

export function detectInventoryChanges(
  previous: UnifiedCloudResource[],
  current: UnifiedCloudResource[]
): InventoryChange[] {
  const before = new Map(previous.map(item => [item.id, item]));
  const after = new Map(current.map(item => [item.id, item]));
  const changes: InventoryChange[] = [];

  for (const resource of current) {
    const old = before.get(resource.id);

    if (!old) {
      changes.push({
        type:"added",
        resourceId:resource.id,
        fields:[]
      });
      continue;
    }

    const fields = [
      "name","nativeType","region","internetExposed",
      "encrypted","managed","ownership","unifiedType"
    ].filter(field =>
      JSON.stringify(old[field as keyof UnifiedCloudResource]) !==
      JSON.stringify(resource[field as keyof UnifiedCloudResource])
    );

    if (fields.length > 0) {
      changes.push({
        type:"changed",
        resourceId:resource.id,
        fields
      });
    }
  }

  for (const resource of previous) {
    if (!after.has(resource.id)) {
      changes.push({
        type:"removed",
        resourceId:resource.id,
        fields:[]
      });
    }
  }

  return changes;
}

export function calculateCloudCoverage(
  resources: UnifiedCloudResource[]
): CloudCoverage[] {
  const providers: CloudProvider[] = ["aws","azure","gcp","on-prem","other"];

  return providers.flatMap(provider => {
    const items = resources.filter(item => item.provider === provider);
    if (!items.length) return [];

    return [{
      provider,
      accounts:new Set(items.map(item => item.accountId)).size,
      resources:items.length,
      unmanagedResources:items.filter(item => item.ownership === "unmanaged").length,
      internetExposedResources:items.filter(item => item.internetExposed === true).length
    }];
  });
}

export function evaluateMultiCloudInventory(
  previous: UnifiedCloudResource[],
  rawResources: RawCloudResource[]
): MultiCloudInventoryReport {
  const resources = normalizeMultiCloudInventory(rawResources);
  const changes = detectInventoryChanges(previous, resources);

  const nativeIdCounts = new Map<string, number>();
  for (const resource of rawResources) {
    const key = `${resource.provider}|${resource.accountId}|${resource.nativeId}`;
    nativeIdCounts.set(key, (nativeIdCounts.get(key) ?? 0) + 1);
  }

  const duplicateNativeIds = [...nativeIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  const urgent = resources.some(resource =>
    resource.internetExposed === true &&
    (resource.encrypted === false || resource.ownership === "unmanaged")
  );

  const review = urgent ||
    duplicateNativeIds.length > 0 ||
    resources.some(resource => resource.ownership === "unmanaged") ||
    changes.some(change => change.type === "removed");

  return {
    resources,
    changes,
    coverage:calculateCloudCoverage(resources),
    duplicateNativeIds,
    decision:urgent ? "urgent" : review ? "review" : "healthy"
  };
}

export function createMultiCloudSummary(
  report: MultiCloudInventoryReport
): string {
  return [
    `Multi-cloud decision: ${report.decision}`,
    `Resources: ${report.resources.length}`,
    `Providers: ${report.coverage.length}`,
    `Changes: ${report.changes.length}`,
    `Duplicate native IDs: ${report.duplicateNativeIds.length}`
  ].join("\n");
}
