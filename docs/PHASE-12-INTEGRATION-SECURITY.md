# Phase 12 — Integration Security

Adds deterministic security controls for external integrations.

Included:
- HMAC SHA-256 webhook signing
- constant-time signature comparison
- replay/stale-request protection
- malformed-signature rejection
- secret redaction from logs
- sensitive metadata sanitization
- unit tests
- root verification integration

No external API, subscription or paid service is required.
