export type AssetType =
  | "repository"
  | "service"
  | "domain"
  | "container"
  | "server"
  | "database"
  | "queue";

export type AssetStatus = "active" | "inactive" | "archived";
export type AssetRisk = "critical" | "high" | "medium" | "low" | "unknown";

export interface AssetObservation {
  tenantId: string;
  type: AssetType;
  name: string;
  externalId?: string;
  location?: string;
  metadata?: Record<string, string>;
  observedAt: string;
}

export interface DiscoveredAsset extends AssetObservation {
  id: string;
  fingerprint: string;
  status: AssetStatus;
  risk: AssetRisk;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface InventoryMergeResult {
  assets: DiscoveredAsset[];
  created: string[];
  updated: string[];
  duplicates: string[];
}
