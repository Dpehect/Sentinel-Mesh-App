# Phase 11A — Cloud & Kubernetes Posture Foundation

Phase 11A adds a zero-cost, offline-first posture engine.

## Included
- Provider-independent `@sentinel/posture-intelligence` workspace
- Kubernetes, Terraform, CloudFormation and Docker Compose textual analysis
- 22 deterministic posture rules
- Explainable evidence and remediation
- Security score and severity summary
- Authenticated posture overview API
- Posture command-center page
- PostgreSQL persistence schema
- Unit tests

## Security boundary
The engine only analyses files supplied by an authorized user or repository checkout. It does not connect to cloud accounts, execute infrastructure, perform exploitation, or require credentials.

## Verification
```bash
npm install
npm run verify
```

Open `/posture` while signed in. Demo mode works without PostgreSQL, Redis, cloud accounts, API keys or paid services.
