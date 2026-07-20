# Phase 11A — Offline Cloud & Kubernetes Posture Foundation

This release adds a zero-cost posture engine for Kubernetes manifests, Terraform, CloudFormation and Docker Compose.

## Security boundaries
- No cloud account, API key or external AI provider is required.
- Analysis is static and never executes repository code.
- Findings are evidence-based decision support and require human validation.
- All persistent records are organization and project scoped.

## Delivered
- Provider-normalized asset and finding contracts.
- 23 deterministic posture rules.
- Explainable posture scoring and internet-exposure correlation.
- Local attack-path generation.
- Posture dashboard and JSON overview API.
- PostgreSQL migration for assets, findings and attack paths.
- Unit tests and installer patches for workspace verification.
