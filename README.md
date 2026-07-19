# Sentinel Mesh

Local-first software security intelligence and attack-path simulation platform.

## What is included

- Next.js product UI with dashboard, projects, scans, findings, attack paths, remediation, reports and settings.
- Fastify worker API and scanner orchestration.
- Built-in deterministic source scanner plus optional Semgrep, Gitleaks and OSV adapters.
- Asset discovery, graph construction, attack-path scoring and defensive simulation.
- PostgreSQL migration and seed data.
- GitHub webhook verification and PR security diff model.
- RBAC, tenant guards, audit events, plugin SDK, tests, Docker and CI.

## Fastest start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. With `DEMO_MODE=true` the application works without PostgreSQL, Redis, GitHub credentials or scanner binaries.

## Full local stack

```bash
docker compose up -d postgres redis
npm run db:migrate
npm run db:seed
npm run dev
```

Optional scanners are documented in `docs/INSTALL-SCANNERS.md`. Their binaries are intentionally not included.
