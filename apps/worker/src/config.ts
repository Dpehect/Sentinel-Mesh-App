import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4010),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  SCAN_QUEUE_NAME: z.string().default("sentinel-scans"),
  SCAN_DLQ_NAME: z.string().default("sentinel-scans-dead-letter"),
  SCAN_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  SCAN_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  SCAN_TIMEOUT_MS: z.coerce.number().int().min(30_000).default(900_000),
  CLONE_TIMEOUT_MS: z.coerce.number().int().min(10_000).default(180_000),
  MAX_REPOSITORY_FILES: z.coerce.number().int().min(100).default(25_000),
  MAX_REPOSITORY_BYTES: z.coerce.number().int().min(1_000_000).default(524_288_000),
  JOB_RETENTION_COMPLETE: z.coerce.number().int().min(10).default(500),
  JOB_RETENTION_FAILED: z.coerce.number().int().min(10).default(1000)
});

export const config = schema.parse(process.env);
