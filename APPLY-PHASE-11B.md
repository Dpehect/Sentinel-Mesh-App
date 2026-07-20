# Apply Phase 11B

Prerequisite: Phase 11A.

Copy this ZIP into the Sentinel Mesh repository root and allow replacement of:
- `packages/posture-intelligence/src/index.ts`
- `apps/web/src/lib/posture-demo.ts`

Then run:

```bash
npm install
npm run verify
npm run db:migrate
```

Open `/posture/graph`.
