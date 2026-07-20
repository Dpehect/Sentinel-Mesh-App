import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  enforceRateLimit,
  securityHeaders
} from "@/lib/production-hardening";

export function applySecurityMiddleware(
  request: NextRequest
) {
  const decision = enforceRateLimit(request);

  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        code: "RATE_LIMITED"
      },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          "Retry-After": String(
            Math.ceil(decision.retryAfterMs / 1000)
          )
        }
      }
    );
  }

  const response = NextResponse.next();

  for (const [name, value] of Object.entries(securityHeaders())) {
    response.headers.set(name, value);
  }

  response.headers.set(
    "X-RateLimit-Remaining",
    String(decision.remaining)
  );

  return response;
}
