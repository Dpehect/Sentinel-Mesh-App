# Sentinel Mesh Security Policy

## Supported branch
Security fixes are applied to the `main` branch.

## Reporting a vulnerability
Do not open a public issue for exploitable vulnerabilities.

Include:
- affected component and version
- reproduction steps
- expected and actual behavior
- impact
- suggested mitigation, if known

Until a private reporting channel is configured, create a GitHub Security Advisory draft from the repository Security tab.

## Response targets
- Critical: triage within 24 hours
- High: triage within 3 days
- Medium/Low: triage within 7 days

## Security principles
- local-first and offline-capable operation
- no mandatory paid API or cloud dependency
- evidence-first findings
- least privilege
- tenant isolation
- untrusted repositories are never executed directly
- secrets must never be committed
