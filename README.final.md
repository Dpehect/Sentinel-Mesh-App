# Sentinel Mesh

Sentinel Mesh is a local-first software security control plane for source scanning, evidence-aware risk analysis, attack-path modeling, secure agent fleet operations and incident response.

## Product capabilities

- Next.js security command center
- local-first and queued scanning
- TypeScript source-to-sink evidence analysis
- optional Semgrep, Gitleaks and OSV adapters
- explainable finding lifecycle
- trust-boundary-aware attack paths
- GitHub App checks and merge gates
- enterprise tenant and policy controls
- distributed secure agent lifecycle
- canary fleet orchestration
- approval-controlled rollout execution
- signed rollout audit chains
- recovery checkpoints
- security operations center
- team and role governance
- platform diagnostics
- verified backup and safe restore
- production release gates

## Local start

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

- `http://localhost:3000/command-center`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/operations`
- `http://localhost:3000/system`

Demo and local-first workflows do not require paid providers.

## Full verification

```bash
npm run final:verify
```

## Production profile

```bash
cp .env.release.example .env.release
docker compose -f docker-compose.release.yml --env-file .env.release up --build
```

## Version

`10.0.0`

Documentation is available under `docs/`.
