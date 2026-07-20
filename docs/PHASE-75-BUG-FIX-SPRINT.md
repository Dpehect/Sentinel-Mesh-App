# Phase 75 — Bug Fix Sprint

This phase focuses on integration stability rather than new features.

## Repairs included

- root version normalized to `10.0.1`
- duplicate test/typecheck script token cleanup
- required web workspace dependencies reconciled
- duplicate manifest route detection and archival
- duplicate robots route detection and archival
- Next.js output tracing fallback
- repository layout scanner
- self-test API
- self-test console page
- shared API success/error response helpers
- strict JSON request validation helpers
- reusable empty-state-safe panel
- responsive self-test styling

## Commands

```bash
npm run phase75:repair
npm run phase75:scan
npm run phase75:verify
```

## New screen

`/self-test`

## Safety

Potential duplicate routes are archived, not deleted:

`archive/phase75-duplicate-routes/`
