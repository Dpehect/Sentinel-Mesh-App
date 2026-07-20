import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code: string;
  details?: unknown;
}

export function ok<T>(
  body: T,
  init?: ResponseInit
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: init?.headers
  });
}

export function fail(
  error: unknown,
  code = "INTERNAL_ERROR",
  status = 500,
  details?: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";

  const body: ApiErrorBody = {
    error: message,
    code,
    ...(details === undefined ? {} : { details })
  };

  return NextResponse.json(body, { status });
}
