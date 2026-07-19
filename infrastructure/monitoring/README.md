# Local observability stack

Phase 7 defines a zero-cost local monitoring path:
- `/api/health` for liveness and readiness probes
- structured JSON audit events
- OpenTelemetry-compatible service boundaries
- Prometheus/Grafana/Loki can be attached through Docker Compose in production

No paid monitoring provider is required.
