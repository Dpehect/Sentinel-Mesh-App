import { NextResponse } from "next/server";
import { z, type ZodSchema } from "zod";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function rateLimit(request: Request, scope: string, limit = 20, windowMs = 60_000) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count <= limit) return null;
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } },
    { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } },
  );
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  try {
    return { data: schema.parse(await request.json()) } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { response: NextResponse.json({ error: { code: "VALIDATION_ERROR", issues: error.flatten() } }, { status: 400 }) } as const;
    }
    return { response: NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 }) } as const;
  }
}
