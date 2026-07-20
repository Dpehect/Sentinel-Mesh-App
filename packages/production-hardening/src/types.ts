export interface SecurityHeaderPolicy {
  contentSecurityPolicy: string;
  referrerPolicy: string;
  permissionsPolicy: string;
  frameOptions: string;
  contentTypeOptions: string;
  crossOriginOpenerPolicy: string;
  crossOriginResourcePolicy: string;
  strictTransportSecurity?: string;
}

export interface RateLimitPolicy {
  windowMs: number;
  maximumRequests: number;
  blockDurationMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  target: string;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CachePolicy {
  public: boolean;
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
  immutable: boolean;
}

export interface HardeningStatus {
  secureHeaders: boolean;
  rateLimiting: boolean;
  auditLogging: boolean;
  cachePolicy: boolean;
  healthEndpoint: boolean;
  accessibilityBaseline: boolean;
  overall: "ready" | "degraded";
}
