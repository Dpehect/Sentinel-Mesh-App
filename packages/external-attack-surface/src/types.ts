export type ExternalAssetType =
  | "domain"
  | "subdomain"
  | "ip"
  | "certificate"
  | "service"
  | "storage-endpoint";

export type OwnershipStatus = "owned" | "third-party" | "unknown";
export type ExternalAssetStatus = "active" | "inactive" | "expired";

export interface ExternalAssetObservation {
  tenantId: string;
  type: ExternalAssetType;
  value: string;
  observedAt: string;
  ownership: OwnershipStatus;
  status?: ExternalAssetStatus;
  ports?: number[];
  technologies?: string[];
  certificateExpiresAt?: string;
  tlsEnabled?: boolean;
  loginExposed?: boolean;
  adminInterface?: boolean;
  publicWriteAccess?: boolean;
}

export interface ExternalAssetRecord extends ExternalAssetObservation {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
  riskScore: number;
  reasons: string[];
}

export interface AttackSurfaceChange {
  type: "new-asset" | "asset-removed" | "risk-increased" | "certificate-expiring";
  assetId: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
}

export interface AttackSurfaceReport {
  assets: ExternalAssetRecord[];
  changes: AttackSurfaceChange[];
  unknownAssets: string[];
  criticalAssets: string[];
  score: number;
  decision: "monitor" | "investigate" | "urgent";
}
