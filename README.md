# Sentinel Mesh — Phase 3

Local-first software security intelligence and attack-path simulation platform.

Phase 3 adds a TypeScript AST and framework-aware security engine on top of the PostgreSQL persistence and BullMQ/Valkey queue foundation.

## Fast start

```bash
npm install
cp .env.example .env
npm run dev
```

With `DEMO_MODE=true`, the UI runs without infrastructure. For persistent scans, start PostgreSQL and Valkey with Docker Compose and set `DEMO_MODE=false`.

## Phase 3 capabilities

- Next.js and Express endpoint discovery
- source-to-sink analysis
- command injection, SQL injection, SSRF, path traversal and redirect detection
- authentication-boundary detection
- dependency/container/workflow discovery
- CWE and OWASP mapping
- optional Semgrep, Gitleaks and OSV adapters
- persisted scans, BullMQ retries, SSE logs and attack-path correlation

See `docs/PHASE-3-SECURITY-INTELLIGENCE.md`.
