export function assertString(
  value: unknown,
  field: string
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function assertInteger(
  value: unknown,
  field: string,
  minimum = 0
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    throw new Error(
      `${field} must be an integer greater than or equal to ${minimum}`
    );
  }
  return value;
}

export function assertBoolean(
  value: unknown,
  field: string
): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean`);
  }
  return value;
}

export async function readJsonBody(
  request: Request
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  return body as Record<string, unknown>;
}
