import { randomUUID } from "node:crypto";
import type {
  AuditRecord,
  CachePolicy,
  HardeningStatus,
  RateLimitDecision,
  RateLimitPolicy,
  SecurityHeaderPolicy
} from "./types.js";

export type {
  AuditRecord,
  CachePolicy,
  HardeningStatus,
  RateLimitDecision,
  RateLimitPolicy,
  SecurityHeaderPolicy
} from "./types.js";

export function buildSecurityHeaders(
  production: boolean
): SecurityHeaderPolicy {
  return {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; "),
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    frameOptions: "DENY",
    contentTypeOptions: "nosniff",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "same-site",
    ...(production
      ? {
          strictTransportSecurity:
            "max-age=63072000; includeSubDomains; preload"
        }
      : {})
  };
}

interface Bucket {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly policy: RateLimitPolicy) {
    if (policy.windowMs < 1) throw new Error("windowMs must be positive");
    if (policy.maximumRequests < 1) {
      throw new Error("maximumRequests must be positive");
    }
    if (policy.blockDurationMs < 1) {
      throw new Error("blockDurationMs must be positive");
    }
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    const current = this.buckets.get(key);

    if (current && current.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: current.blockedUntil - now
      };
    }

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.policy.windowMs,
        blockedUntil: 0
      });

      return {
        allowed: true,
        remaining: this.policy.maximumRequests - 1,
        retryAfterMs: 0
      };
    }

    current.count += 1;

    if (current.count > this.policy.maximumRequests) {
      current.blockedUntil = now + this.policy.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: this.policy.blockDurationMs
      };
    }

    return {
      allowed: true,
      remaining: Math.max(
        0,
        this.policy.maximumRequests - current.count
      ),
      retryAfterMs: 0
    };
  }

  prune(now = Date.now()): number {
    let removed = 0;
    for (const [key, bucket] of this.buckets) {
      if (
        bucket.resetAt <= now &&
        bucket.blockedUntil <= now
      ) {
        this.buckets.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
}

export function createAuditRecord(
  input: Omit<AuditRecord, "id" | "occurredAt">,
  now = new Date()
): AuditRecord {
  if (!input.actor.trim()) throw new Error("actor is required");
  if (!input.action.trim()) throw new Error("action is required");
  if (!input.target.trim()) throw new Error("target is required");

  return {
    ...input,
    id: randomUUID(),
    occurredAt: now.toISOString()
  };
}

export function serializeAuditRecord(
  record: AuditRecord
): string {
  return JSON.stringify(record);
}

export function buildCacheControl(
  policy: CachePolicy
): string {
  if (policy.maxAgeSeconds < 0) {
    throw new Error("maxAgeSeconds cannot be negative");
  }
  if (policy.staleWhileRevalidateSeconds < 0) {
    throw new Error(
      "staleWhileRevalidateSeconds cannot be negative"
    );
  }

  const parts = [
    policy.public ? "public" : "private",
    `max-age=${policy.maxAgeSeconds}`
  ];

  if (policy.staleWhileRevalidateSeconds > 0) {
    parts.push(
      `stale-while-revalidate=${policy.staleWhileRevalidateSeconds}`
    );
  }

  if (policy.immutable) parts.push("immutable");
  return parts.join(", ");
}

export function evaluateHardeningStatus(input: {
  secureHeaders: boolean;
  rateLimiting: boolean;
  auditLogging: boolean;
  cachePolicy: boolean;
  healthEndpoint: boolean;
  accessibilityBaseline: boolean;
}): HardeningStatus {
  const values = Object.values(input);
  return {
    ...input,
    overall: values.every(Boolean) ? "ready" : "degraded"
  };
}
