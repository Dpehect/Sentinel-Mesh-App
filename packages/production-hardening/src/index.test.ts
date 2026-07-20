import { describe, expect, it } from "vitest";
import {
  InMemoryRateLimiter,
  buildCacheControl,
  buildSecurityHeaders,
  createAuditRecord,
  evaluateHardeningStatus
} from "./index.js";

describe("production hardening", () => {
  it("builds strict production headers", () => {
    const headers = buildSecurityHeaders(true);
    expect(headers.frameOptions).toBe("DENY");
    expect(headers.strictTransportSecurity).toContain("max-age");
  });

  it("blocks after the request limit", () => {
    const limiter = new InMemoryRateLimiter({
      windowMs: 1000,
      maximumRequests: 2,
      blockDurationMs: 5000
    });

    expect(limiter.consume("client", 0).allowed).toBe(true);
    expect(limiter.consume("client", 1).allowed).toBe(true);
    expect(limiter.consume("client", 2).allowed).toBe(false);
  });

  it("creates valid cache-control output", () => {
    expect(buildCacheControl({
      public: false,
      maxAgeSeconds: 0,
      staleWhileRevalidateSeconds: 30,
      immutable: false
    })).toBe("private, max-age=0, stale-while-revalidate=30");
  });

  it("creates audit records", () => {
    const record = createAuditRecord({
      actor: "owner",
      action: "backup.create",
      target: "system"
    });

    expect(record.id).toBeTruthy();
    expect(record.occurredAt).toBeTruthy();
  });

  it("marks incomplete hardening as degraded", () => {
    const status = evaluateHardeningStatus({
      secureHeaders: true,
      rateLimiting: true,
      auditLogging: false,
      cachePolicy: true,
      healthEndpoint: true,
      accessibilityBaseline: true
    });

    expect(status.overall).toBe("degraded");
  });
});
