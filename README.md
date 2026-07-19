# Sentinel Mesh — Phase 3

Open-source, local-first software security intelligence and attack-path simulation platform.

Phase 3 delivers a real public-repository scanning pipeline with an ephemeral clone workspace, deterministic built-in rules, optional Semgrep/Gitleaks/OSV adapters, normalized findings, contextual scoring, live job progress and attack-path correlation.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run typecheck
npm run test
npm run build
```

## Architecture

```text
Browser
  -> POST /api/scans
  -> asynchronous scan job
  -> ephemeral Git clone
  -> built-in + optional external scanners
  -> normalized findings
  -> risk engine
  -> attack-path correlation
  -> GET /api/scans/:id polling
  -> dynamic command center
```

Detailed notes: `docs/PHASE-2.md`.
