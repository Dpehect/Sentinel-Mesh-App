export type AssetCriticality = "low" | "medium" | "high" | "critical";
export type AssetRelationshipType =
  | "depends-on"
  | "connects-to"
  | "deployed-on"
  | "owned-by"
  | "authenticated-by"
  | "stores-data-in";

export interface InventoryAsset {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  criticality: AssetCriticality;
  internetExposed?: boolean;
  dataClassification?: "public" | "internal" | "confidential" | "restricted";
}

export interface AssetRelationship {
  fromAssetId: string;
  toAssetId: string;
  type: AssetRelationshipType;
}

export interface InventoryGraph {
  assets: InventoryAsset[];
  relationships: AssetRelationship[];
}

export interface InventoryGraphAnalysis {
  criticalAssets: string[];
  orphanAssets: string[];
  internetExposedCriticalAssets: string[];
  highDependencyAssets: string[];
}
