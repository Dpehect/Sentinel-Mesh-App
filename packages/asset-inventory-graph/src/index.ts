import type {
  AssetRelationship,
  InventoryAsset,
  InventoryGraph,
  InventoryGraphAnalysis
} from "./types.js";

export type {
  AssetCriticality,
  AssetRelationship,
  AssetRelationshipType,
  InventoryAsset,
  InventoryGraph,
  InventoryGraphAnalysis
} from "./types.js";

export function buildInventoryGraph(
  assets: InventoryAsset[],
  relationships: AssetRelationship[]
): InventoryGraph {
  const assetIds = new Set(assets.map(asset => asset.id));

  for (const relationship of relationships) {
    if (
      !assetIds.has(relationship.fromAssetId) ||
      !assetIds.has(relationship.toAssetId)
    ) {
      throw new Error("UNKNOWN_ASSET_RELATIONSHIP");
    }
  }

  const deduped = new Map<string, AssetRelationship>();
  for (const relationship of relationships) {
    const key = `${relationship.fromAssetId}|${relationship.toAssetId}|${relationship.type}`;
    deduped.set(key, relationship);
  }

  return {assets, relationships:[...deduped.values()]};
}

export function findReachableAssets(
  graph: InventoryGraph,
  startAssetId: string
): string[] {
  const visited = new Set<string>();
  const queue = [startAssetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const relationship of graph.relationships) {
      if (
        relationship.fromAssetId === current &&
        !visited.has(relationship.toAssetId)
      ) {
        queue.push(relationship.toAssetId);
      }
    }
  }

  visited.delete(startAssetId);
  return [...visited];
}

export function analyzeInventoryGraph(
  graph: InventoryGraph,
  highDependencyThreshold = 3
): InventoryGraphAnalysis {
  const degree = new Map<string, number>();
  for (const asset of graph.assets) degree.set(asset.id, 0);

  for (const relationship of graph.relationships) {
    degree.set(
      relationship.fromAssetId,
      (degree.get(relationship.fromAssetId) ?? 0) + 1
    );
    degree.set(
      relationship.toAssetId,
      (degree.get(relationship.toAssetId) ?? 0) + 1
    );
  }

  return {
    criticalAssets:graph.assets
      .filter(asset => asset.criticality === "critical")
      .map(asset => asset.id),
    orphanAssets:graph.assets
      .filter(asset => (degree.get(asset.id) ?? 0) === 0)
      .map(asset => asset.id),
    internetExposedCriticalAssets:graph.assets
      .filter(asset =>
        asset.criticality === "critical" &&
        asset.internetExposed === true
      )
      .map(asset => asset.id),
    highDependencyAssets:graph.assets
      .filter(asset => (degree.get(asset.id) ?? 0) >= highDependencyThreshold)
      .map(asset => asset.id)
  };
}
