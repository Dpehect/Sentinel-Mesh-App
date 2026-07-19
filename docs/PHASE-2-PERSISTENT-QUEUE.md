# Phase 2 — Persistent Queue and Scanner Isolation

## Objective

Replace the process-local `Map` job store with a durable BullMQ queue backed by Valkey/Redis. Scans now survive API/worker restarts, support bounded retries and expose live progress through Server-Sent Events.

## Runtime flow

```text
Next.js POST /api/scans
  -> Fastify POST /jobs
  -> BullMQ waiting queue (Valkey AOF)
  -> BullMQ Worker
  -> temporary read-only-oriented scan workspace
  -> repository limits + clone timeout
  -> scanner pipeline + job logs/progress
  -> BullMQ completed result
  -> Next.js persistence adapter
  -> PostgreSQL findings/assets/relations/attack paths
```

## Reliability controls

- Persistent Valkey AOF storage
- Three attempts by default
- Exponential backoff starting at five seconds
- Dead-letter queue after final failure
- Stalled job detection
- Graceful shutdown
- Completed/failed job retention limits
- Queue health and job-count endpoint

## Scanner safety controls

- Only canonical public GitHub repository URLs are accepted
- Shallow, single-branch clone with no tags
- Clone timeout
- Total scan timeout
- Maximum repository file count
- Maximum repository byte size
- Symlinks are not followed during inventory
- Temporary workspace is always removed
- Container runs non-root with dropped Linux capabilities
- Read-only container filesystem and bounded `/tmp`
- CPU, memory and process limits in Docker Compose

This is process isolation and resource hardening, not a complete hostile-code sandbox. Phase 3 will move scanners behind a dedicated execution boundary with stronger per-job isolation.

## Live events

`GET /jobs/:id/events` streams `scan` SSE events. The web application proxies this through `GET /api/scans/:id/events` and falls back to polling if the SSE connection fails.

## Operations

Queue health:

```bash
curl http://localhost:4010/health
```

List jobs:

```bash
curl http://localhost:4010/jobs
```

Retry a failed job:

```bash
curl -X POST http://localhost:4010/jobs/JOB_ID/retry
```
