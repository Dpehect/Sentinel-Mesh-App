# Phase 52 — Secure Agent Enrollment

Adds deterministic agent enrollment and fleet integrity controls.

Included:
- tenant-scoped enrollment tokens
- token expiry, revocation and usage limits
- platform allowlists
- certificate fingerprint validation
- semantic agent-version checks
- heartbeat health monitoring
- stale and outdated agent detection
- duplicate certificate-fingerprint detection
- fleet quarantine and block decisions
- unit tests
- root verification integration

All agent and token state can be supplied as local JSON.
No certificate authority API, device-management subscription or paid service is required.
