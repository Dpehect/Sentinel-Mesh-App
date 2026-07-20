# Sentinel Mesh

Local-first software security intelligence and evidence-aware attack-path simulation platform.

## Product capabilities

- Next.js security command center and public server-rendered reports.
- Fastify scanner API, BullMQ/Valkey queue and PostgreSQL persistence.
- TypeScript AST intelligence with source-to-sink evidence and CWE/OWASP mapping.
- Optional Semgrep, Gitleaks and OSV adapters.
- Trust-boundary-aware attack graph and defensive-control simulation.
- GitHub App webhooks, incremental PR scans, Check Runs and merge gates.
- Signed sessions, tenant guards, auditability, tests and hardened containers.
- Scanner marketplace, typed plugin SDK, benchmarks and release automation.

## Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Demo mode works without external credentials.

## Full local stack

```bash
docker compose up -d postgres redis
npm run db:migrate
npm run db:seed
npm run dev
```

## Verification

```bash
npm run verify
npm run test:e2e
npm run benchmark
```

Documentation is under `docs/`. Optional scanner binaries are intentionally not included.


## Production verification

After installing dependencies, run:

```bash
npm run verify
npm run test:e2e
```

The first command starts with an offline static package audit before type checking, tests and builds. See `docs/PHASE-8-PRODUCTION-COMPLETION.md`.

## Enterprise control plane
Phase 10 adds teams, hierarchical roles, scoped API tokens, policy evaluation and compliance evidence. Open `/enterprise` after signing in. SAML, SCIM and LDAP remain optional extension points; no paid provider is required for the included demo and local workflows.
