# Phase 60 — Agent Key Rotation

Adds deterministic key rotation and trust-store transition controls.

Included:
- purpose-specific trust keys
- maximum key-age enforcement
- staged replacement keys
- active-to-retiring transitions
- compromised-key emergency revocation
- algorithm allowlists
- trust-store versioning
- trusted and revoked key conflict detection
- healthy, rotate and emergency-rotate decisions
- unit tests
- root verification integration

No external HSM or paid key-management service is required.
