# Phase 8 — Production Completion

This phase consolidates previous work and adds deterministic source-package validation, stricter security headers, API request helpers, rate-limit primitives, expanded workspace verification, and release-readiness documentation.

## Verification order

1. `npm run verify:static`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run test:e2e`

## What still requires a machine with dependencies

The source archive intentionally excludes `node_modules`, scanner binaries, browser binaries, databases, and container images. Full runtime verification therefore begins after `npm install`.
