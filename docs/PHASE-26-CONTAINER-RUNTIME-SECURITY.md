# Phase 26 — Container Runtime Security

Adds deterministic runtime behavior analysis.

Included:
- suspicious shell detection
- download-and-execute detection
- sensitive file modification detection
- /proc and /sys modification detection
- high-risk network-port detection
- root and SYS_ADMIN privilege escalation detection
- namespace manipulation detection
- automatic container isolation decision
- runtime security score
- unit tests
- root verification integration

Runtime events can be supplied as local JSON.
No runtime agent subscription, API key or paid service is required.
