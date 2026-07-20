# Sentinel Mesh 10.2.0

Sentinel Mesh 10.2.0 is the first stable production release of the accelerated final architecture.

## Highlights

- Unified security command center
- Local-first scanning and evidence-aware intelligence
- Attack-path analysis
- Secure distributed agent lifecycle
- Canary rollout orchestration
- Approval-controlled fleet deployment
- Signed audit-chain verification
- Recovery checkpoints
- Security operations center
- Team and role governance
- Incident lifecycle and notification rules
- Production diagnostics and readiness gates
- Verified backup and safe restore
- Secure headers, rate limiting and audit logging
- Final CI and release packaging

## Deployment

Local:

```bash
npm install
npm run dev
```

Production:

```bash
docker compose -f docker-compose.release.yml --env-file .env.release up --build
```

## Final verification

```bash
npm run release:verify
```
