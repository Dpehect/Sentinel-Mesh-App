export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
}

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerSnapshot {
  state: CircuitState;
  failureCount: number;
  openedAt?: number;
}

export interface CircuitBreakerPolicy {
  failureThreshold: number;
  resetTimeoutMs: number;
}
