import { Queue, QueueEvents, type JobsOptions } from "bullmq";
import type { ScanResult } from "@sentinel/security-core";
import { config } from "./config";
import { getRedisConnection } from "./redis";

export type ScanJobData = {
  repositoryUrl: string;
  projectId?: string;
  requestedAt: string;
  requestId: string;
  branch?: string;
  commitSha?: string;
  baseSha?: string;
  changedFiles?: string[];
  reason?: "manual"|"push"|"pull_request"|"schedule";
  installationId?: number;
  repositoryFullName?: string;
  pullRequestNumber?: number;
};

export type ScanJobResult = {
  result: ScanResult;
  projectId?: string;
  repositoryUrl: string;
  completedAt: string;
  branch?: string;
  commitSha?: string;
};

const connection = getRedisConnection();
export const scanQueue = new Queue<ScanJobData, ScanJobResult>(config.SCAN_QUEUE_NAME, { connection });
export const deadLetterQueue = new Queue(config.SCAN_DLQ_NAME, { connection });
export const scanQueueEvents = new QueueEvents(config.SCAN_QUEUE_NAME, { connection });

export const defaultJobOptions: JobsOptions = {
  attempts: config.SCAN_ATTEMPTS,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 60 * 60 * 24 * 7, count: config.JOB_RETENTION_COMPLETE },
  removeOnFail: { age: 60 * 60 * 24 * 30, count: config.JOB_RETENTION_FAILED }
};

export async function enqueueScan(data: Omit<ScanJobData, "requestedAt" | "requestId">) {
  const requestId = crypto.randomUUID();
  return scanQueue.add(
    "repository-scan",
    { ...data, requestedAt: new Date().toISOString(), requestId },
    { ...defaultJobOptions, jobId: requestId }
  );
}
