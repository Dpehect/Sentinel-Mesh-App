# ADR 0002: BullMQ and Valkey for scan orchestration

## Status
Accepted

## Decision
Long-running scans are queued outside the web process and persisted in Valkey.

## Consequences
Jobs survive web restarts and support retry/backoff. Production deployment requires a protected Valkey instance.
