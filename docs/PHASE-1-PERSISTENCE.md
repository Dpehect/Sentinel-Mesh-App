# Phase 1 — Persistent product backbone

This phase replaces demo-only console data with a database-backed data source while preserving a zero-configuration demo fallback.

## Delivered

- PostgreSQL project creation and repository registration.
- Transactional scan persistence for findings, assets, relations and attack paths.
- Database-backed project list, scan history and dashboard snapshot.
- Latest completed scan loading for findings, attack paths and remediation screens.
- Schema migration tracking and production indexes.
- `DEMO_MODE=true` fallback remains available without PostgreSQL.

## Production flow

```text
Create project
  -> POST /api/projects
  -> PostgreSQL projects

Run scan
  -> POST /api/scans
  -> worker job
  -> GET /api/scans/:id
  -> completed ScanResult
  -> transactional persistence
  -> dashboard/findings/attack paths/remediation
```

## Enable persistence

```env
DEMO_MODE=false
DATABASE_URL=postgresql://sentinel:sentinel@localhost:5432/sentinel
WORKER_URL=http://localhost:4010
```

Run:

```bash
docker compose up -d postgres redis
npm run db:migrate
npm run db:seed
npm run dev
```

## Next phase

Replace the in-memory worker job store with BullMQ/Valkey, persistent job records, retries, timeouts and isolated scanner execution.
