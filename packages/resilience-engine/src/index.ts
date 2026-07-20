import type {
  CircuitBreakerPolicy,
  CircuitBreakerSnapshot,
  RetryPolicy
} from "./types.js";

export type {
  CircuitBreakerPolicy,
  CircuitBreakerSnapshot,
  CircuitState,
  RetryPolicy
} from "./types.js";

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 4,
  baseDelayMs: 500,
  maxDelayMs: 30000,
  multiplier: 2
};

export const defaultCircuitBreakerPolicy: CircuitBreakerPolicy = {
  failureThreshold: 5,
  resetTimeoutMs: 60000
};

export function calculateRetryDelay(
  attempt: number,
  policy: RetryPolicy = defaultRetryPolicy
): number {
  if (attempt < 1) throw new Error("INVALID_RETRY_ATTEMPT");

  return Math.min(
    policy.maxDelayMs,
    Math.round(policy.baseDelayMs * Math.pow(policy.multiplier, attempt - 1))
  );
}

export function shouldRetry(
  attempt: number,
  errorCode: string,
  policy: RetryPolicy = defaultRetryPolicy
): boolean {
  const nonRetryable = new Set([
    "AUTHENTICATION_FAILED",
    "AUTHORIZATION_FAILED",
    "INVALID_INPUT",
    "TENANT_ACCESS_DENIED",
    "UNSAFE_REPOSITORY"
  ]);

  return attempt < policy.maxAttempts && !nonRetryable.has(errorCode);
}

export function recordCircuitFailure(
  snapshot: CircuitBreakerSnapshot,
  now: number,
  policy: CircuitBreakerPolicy = defaultCircuitBreakerPolicy
): CircuitBreakerSnapshot {
  const failureCount = snapshot.failureCount + 1;

  if (failureCount >= policy.failureThreshold) {
    return {
      state:"open",
      failureCount,
      openedAt:now
    };
  }

  return {
    ...snapshot,
    failureCount
  };
}

export function evaluateCircuit(
  snapshot: CircuitBreakerSnapshot,
  now: number,
  policy: CircuitBreakerPolicy = defaultCircuitBreakerPolicy
): CircuitBreakerSnapshot {
  if (
    snapshot.state === "open" &&
    snapshot.openedAt !== undefined &&
    now - snapshot.openedAt >= policy.resetTimeoutMs
  ) {
    return {
      state:"half-open",
      failureCount:snapshot.failureCount,
      openedAt:snapshot.openedAt
    };
  }

  return snapshot;
}

export function recordCircuitSuccess(): CircuitBreakerSnapshot {
  return {
    state:"closed",
    failureCount:0
  };
}

export function createIdempotencyKey(parts: string[]): string {
  const normalized = parts.map(part => part.trim()).filter(Boolean).join(":");
  if (!normalized) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  return normalized.toLowerCase();
}
