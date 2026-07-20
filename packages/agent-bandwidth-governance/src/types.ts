export type TransferPriority = "critical" | "high" | "normal" | "low";
export type CompressionMode = "none" | "gzip" | "brotli";

export interface TransferCandidate {
  id: string;
  tenantId: string;
  agentId: string;
  priority: TransferPriority;
  sizeBytes: number;
  compressible: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface BandwidthWindow {
  tenantId: string;
  agentId: string;
  windowStartedAt: string;
  windowSeconds: number;
  maximumBytes: number;
  consumedBytes: number;
}

export interface BandwidthPolicy {
  maximumBatchBytes: number;
  reservePercentForCritical: number;
  compressionThresholdBytes: number;
  preferredCompression: CompressionMode;
  backpressureThresholdPercent: number;
}

export interface TransferPlanItem {
  id: string;
  compression: CompressionMode;
  estimatedBytes: number;
}

export interface BandwidthPlan {
  selected: TransferPlanItem[];
  deferredItemIds: string[];
  expiredItemIds: string[];
  remainingWindowBytes: number;
  utilizationPercent: number;
  decision: "send" | "throttle" | "block";
}
