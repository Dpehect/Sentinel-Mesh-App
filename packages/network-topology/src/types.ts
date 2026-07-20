import type {DiscoveredAsset} from "@sentinel/asset-discovery";

export type ConnectionProtocol =
  | "http"
  | "https"
  | "tcp"
  | "tls"
  | "sql"
  | "queue"
  | "internal";

export interface AssetConnection {
  fromAssetId: string;
  toAssetId: string;
  protocol: ConnectionProtocol;
  port?: number;
  encrypted: boolean;
  internetExposed?: boolean;
  authenticated?: boolean;
}

export interface TopologyGraph {
  assets: DiscoveredAsset[];
  connections: AssetConnection[];
}

export interface TopologyRisk {
  score: number;
  criticalConnections: AssetConnection[];
  isolatedAssets: string[];
  singlePointsOfFailure: string[];
  reasons: string[];
}
