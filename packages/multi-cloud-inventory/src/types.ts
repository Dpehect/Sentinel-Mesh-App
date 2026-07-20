export type CloudProvider = "aws" | "azure" | "gcp" | "on-prem" | "other";

export type UnifiedResourceType =
  | "compute"
  | "database"
  | "storage"
  | "network"
  | "identity"
  | "container"
  | "serverless"
  | "secret"
  | "logging"
  | "unknown";

export interface RawCloudResource {
  tenantId: string;
  provider: CloudProvider;
  accountId: string;
  nativeId: string;
  name: string;
  nativeType: string;
  region?: string;
  tags?: Record<string, string>;
  internetExposed?: boolean;
  encrypted?: boolean;
  managed?: boolean;
  observedAt: string;
}

export interface UnifiedCloudResource extends RawCloudResource {
  id: string;
  unifiedType: UnifiedResourceType;
  normalizedRegion: string;
  ownership: "managed" | "unmanaged";
  riskFlags: string[];
}

export interface InventoryChange {
  type: "added" | "removed" | "changed";
  resourceId: string;
  fields: string[];
}

export interface CloudCoverage {
  provider: CloudProvider;
  accounts: number;
  resources: number;
  unmanagedResources: number;
  internetExposedResources: number;
}

export interface MultiCloudInventoryReport {
  resources: UnifiedCloudResource[];
  changes: InventoryChange[];
  coverage: CloudCoverage[];
  duplicateNativeIds: string[];
  decision: "healthy" | "review" | "urgent";
}
