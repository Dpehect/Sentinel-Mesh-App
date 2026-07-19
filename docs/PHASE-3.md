# Phase 3 — Asset Discovery and Attack Graph

Phase 3 converts repository source into a security topology.

## Added
- Endpoint discovery for Express-style routes and Next.js route handlers
- Dependency extraction from imports and require calls
- Database, runtime-secret and authentication-boundary discovery
- Evidence-backed asset relations
- Breadth-first attack-path calculation from exposed assets to sensitive targets
- Explainable path steps, likelihood, impact and contextual path score
- Interactive attack graph and ranked path list

## Important boundary
This release performs static, defensive analysis. It does not exploit targets, execute attack payloads or scan arbitrary remote infrastructure.
