export type OfflineItemPriority = "critical" | "high" | "normal" | "low";
export type OfflineItemStatus = "queued" | "in-flight" | "delivered" | "dead-letter";

export interface OfflineQueueItem {
  id: string;
  tenantId: string;
  agentId: string;
  type: "telemetry" | "finding" | "heartbeat" | "command-result";
  priority: OfflineItemPriority;
  createdAt: string;
  expiresAt?: string;
  payloadHash: string;
  sizeBytes: number;
  attempt: number;
  nextAttemptAt: string;
  status: OfflineItemStatus;
  deduplicationKey: string;
}

export interface OfflineQueuePolicy {
  maximumItems: number;
  maximumBytes: number;
  maximumAttempts: number;
  retryBaseSeconds: number;
  batchSize: number;
}

export interface OfflineQueueReport {
  readyItemIds: string[];
  expiredItemIds: string[];
  duplicateItemIds: string[];
  deadLetterItemIds: string[];
  droppedItemIds: string[];
  totalBytes: number;
  decision: "healthy" | "degraded" | "blocked";
}
