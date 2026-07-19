# Threat model

Primary risks: malicious repositories, command injection, path traversal, zip bombs, secret leakage, SSRF, scanner escape and cross-tenant access. Mitigations: no shell interpolation, disposable workspaces, strict timeouts, network isolation, tenant guards and audit logs.
