# Phase 10 — Enterprise Control Plane

This phase adds an offline-capable enterprise foundation: organization teams, hierarchical roles, scoped API tokens, explicit allow/deny policies and compliance evidence mapping.

## Security boundaries
- Only token hashes are persisted.
- Explicit deny policies override allow rules.
- Organization IDs remain mandatory on all enterprise resources.
- SAML, SCIM and LDAP are integration-ready extension points, not falsely advertised as active providers.

## Next phase
Cloud and Kubernetes posture intelligence: IaC ingestion, IAM graphing, cluster RBAC visualization and misconfiguration correlation.
