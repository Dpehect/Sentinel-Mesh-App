import type {DiscoveredAsset} from "@sentinel/asset-discovery";
import type {
  AssetConnection,
  TopologyGraph,
  TopologyRisk
} from "./types.js";

export type {
  AssetConnection,
  ConnectionProtocol,
  TopologyGraph,
  TopologyRisk
} from "./types.js";

function validateAssetIds(
  assets: DiscoveredAsset[],
  connections: AssetConnection[]
): void {
  const ids = new Set(assets.map(asset => asset.id));

  for (const connection of connections) {
    if (!ids.has(connection.fromAssetId) || !ids.has(connection.toAssetId)) {
      throw new Error("UNKNOWN_TOPOLOGY_ASSET");
    }
  }
}

export function buildTopology(
  assets: DiscoveredAsset[],
  connections: AssetConnection[]
): TopologyGraph {
  validateAssetIds(assets, connections);

  const unique = new Map<string, AssetConnection>();
  for (const connection of connections) {
    const key = [
      connection.fromAssetId,
      connection.toAssetId,
      connection.protocol,
      connection.port ?? ""
    ].join("|");

    unique.set(key, connection);
  }

  return {
    assets,
    connections:[...unique.values()]
  };
}

export function findReachableAssets(
  graph: TopologyGraph,
  startAssetId: string
): string[] {
  const visited = new Set<string>();
  const queue = [startAssetId];

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const connection of graph.connections) {
      if (connection.fromAssetId === current && !visited.has(connection.toAssetId)) {
        queue.push(connection.toAssetId);
      }
    }
  }

  visited.delete(startAssetId);
  return [...visited];
}

export function analyzeTopologyRisk(
  graph: TopologyGraph
): TopologyRisk {
  const degree = new Map<string, number>();
  for (const asset of graph.assets) degree.set(asset.id, 0);

  for (const connection of graph.connections) {
    degree.set(connection.fromAssetId, (degree.get(connection.fromAssetId) ?? 0) + 1);
    degree.set(connection.toAssetId, (degree.get(connection.toAssetId) ?? 0) + 1);
  }

  const criticalConnections = graph.connections.filter(connection =>
    connection.internetExposed === true ||
    connection.encrypted === false ||
    connection.authenticated === false
  );

  const isolatedAssets = graph.assets
    .filter(asset => (degree.get(asset.id) ?? 0) === 0)
    .map(asset => asset.id);

  const singlePointsOfFailure = graph.assets
    .filter(asset =>
      asset.risk === "critical" &&
      (degree.get(asset.id) ?? 0) <= 1
    )
    .map(asset => asset.id);

  const reasons: string[] = [];
  if (criticalConnections.some(item => item.internetExposed)) {
    reasons.push("INTERNET_EXPOSED_CONNECTION");
  }
  if (criticalConnections.some(item => !item.encrypted)) {
    reasons.push("UNENCRYPTED_CONNECTION");
  }
  if (criticalConnections.some(item => item.authenticated === false)) {
    reasons.push("UNAUTHENTICATED_CONNECTION");
  }
  if (singlePointsOfFailure.length) {
    reasons.push("CRITICAL_SINGLE_POINT_OF_FAILURE");
  }

  const score = Math.min(100, Math.round(
    criticalConnections.length * 18 +
    singlePointsOfFailure.length * 25 +
    isolatedAssets.length * 3
  ));

  return {
    score,
    criticalConnections,
    isolatedAssets,
    singlePointsOfFailure,
    reasons:[...new Set(reasons)]
  };
}
