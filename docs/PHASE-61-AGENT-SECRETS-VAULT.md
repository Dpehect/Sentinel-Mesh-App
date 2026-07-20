# Phase 61 — Agent Secrets Vault

Adds deterministic secret access and lifecycle controls.

Included:
- tenant-scoped encrypted secrets
- agent allowlists
- short-lived secret leases
- nonce replay protection
- lease-duration limits
- key-ID allowlists
- secret expiration and revocation
- scheduled rotation detection
- plaintext secret-pattern detection
- healthy, rotate and block decisions
- unit tests
- root verification integration

The package never stores or returns plaintext secret values.
No external vault or paid key-management service is required.
