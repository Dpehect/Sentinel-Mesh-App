import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  noStoreHeaders,
  readSecurityAudit,
  securityHeaders,
  writeSecurityAudit
} from "@/lib/production-hardening";

export async function GET(request: Request) {
  const decision = enforceRateLimit(request);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          ...noStoreHeaders()
        }
      }
    );
  }

  return NextResponse.json({
    records: await readSecurityAudit(100)
  }, {
    headers: {
      ...securityHeaders(),
      ...noStoreHeaders()
    }
  });
}

export async function POST(request: Request) {
  const decision = enforceRateLimit(request);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          ...noStoreHeaders()
        }
      }
    );
  }

  try {
    const body = await request.json();
    const record = await writeSecurityAudit({
      actor: body.actor ?? "unknown",
      action: body.action ?? "unknown",
      target: body.target ?? "unknown",
      metadata: body.metadata
    });

    return NextResponse.json(
      { record },
      {
        status: 201,
        headers: {
          ...securityHeaders(),
          ...noStoreHeaders()
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Invalid request",
        code: "INVALID_AUDIT_RECORD"
      },
      {
        status: 400,
        headers: {
          ...securityHeaders(),
          ...noStoreHeaders()
        }
      }
    );
  }
}
