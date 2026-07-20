import { NextResponse } from "next/server";
import {
  currentHardeningStatus,
  enforceRateLimit,
  noStoreHeaders,
  securityHeaders
} from "@/lib/production-hardening";

export async function GET(request: Request) {
  const decision = enforceRateLimit(request);

  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        code: "RATE_LIMITED",
        retryAfterMs: decision.retryAfterMs
      },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          ...noStoreHeaders(),
          "Retry-After": String(
            Math.ceil(decision.retryAfterMs / 1000)
          )
        }
      }
    );
  }

  const status = currentHardeningStatus();

  return NextResponse.json({
    ok: status.overall === "ready",
    hardening: status,
    timestamp: new Date().toISOString()
  }, {
    status: status.overall === "ready" ? 200 : 503,
    headers: {
      ...securityHeaders(),
      ...noStoreHeaders(),
      "X-RateLimit-Remaining": String(decision.remaining)
    }
  });
}
