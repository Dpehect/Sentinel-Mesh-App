import path from "node:path";
import {
  appendFile,
  mkdir,
  readFile
} from "node:fs/promises";
import {
  InMemoryRateLimiter,
  buildCacheControl,
  buildSecurityHeaders,
  createAuditRecord,
  evaluateHardeningStatus
} from "@sentinel/production-hardening";

const globalKey = "__sentinelProductionLimiter";

type GlobalWithLimiter = typeof globalThis & {
  [globalKey]?: InMemoryRateLimiter;
};

const state = globalThis as GlobalWithLimiter;

export const productionLimiter =
  state[globalKey] ??
  new InMemoryRateLimiter({
    windowMs: 60_000,
    maximumRequests: 120,
    blockDurationMs: 60_000
  });

if (process.env.NODE_ENV !== "production") {
  state[globalKey] = productionLimiter;
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
}

export function enforceRateLimit(request: Request) {
  return productionLimiter.consume(getClientKey(request));
}

export function securityHeaders() {
  const policy = buildSecurityHeaders(
    process.env.NODE_ENV === "production"
  );

  return {
    "Content-Security-Policy": policy.contentSecurityPolicy,
    "Referrer-Policy": policy.referrerPolicy,
    "Permissions-Policy": policy.permissionsPolicy,
    "X-Frame-Options": policy.frameOptions,
    "X-Content-Type-Options": policy.contentTypeOptions,
    "Cross-Origin-Opener-Policy":
      policy.crossOriginOpenerPolicy,
    "Cross-Origin-Resource-Policy":
      policy.crossOriginResourcePolicy,
    ...(policy.strictTransportSecurity
      ? {
          "Strict-Transport-Security":
            policy.strictTransportSecurity
        }
      : {})
  };
}

export function noStoreHeaders() {
  return {
    "Cache-Control": buildCacheControl({
      public: false,
      maxAgeSeconds: 0,
      staleWhileRevalidateSeconds: 0,
      immutable: false
    })
  };
}

const dataRoot =
  process.env.SENTINEL_DATA_ROOT ??
  path.join(process.cwd(), ".sentinel-data");

const auditFile = path.join(dataRoot, "security-audit.log");

export async function writeSecurityAudit(input: {
  actor: string;
  action: string;
  target: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  const record = createAuditRecord(input);
  await mkdir(dataRoot, { recursive: true });
  await appendFile(
    auditFile,
    JSON.stringify(record) + "\n",
    { encoding: "utf8", mode: 0o600 }
  );
  return record;
}

export async function readSecurityAudit(limit = 100) {
  try {
    const raw = await readFile(auditFile, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .reverse()
      .map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

export function currentHardeningStatus() {
  return evaluateHardeningStatus({
    secureHeaders: true,
    rateLimiting: true,
    auditLogging: true,
    cachePolicy: true,
    healthEndpoint: true,
    accessibilityBaseline: true
  });
}
