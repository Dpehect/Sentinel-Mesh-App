# Phase 4 — Explainable Attack Graph v2

This phase replaces reachability-only graph traversal with an evidence-aware attack-path model.

## Added semantics

- Trust zones: internet, edge, application, data, CI and secrets.
- Required privilege on assets and relations.
- Network reachability and trust-boundary transitions.
- Finding-to-edge correlation.
- Data sensitivity and target criticality.
- Cycle-safe path search and path deduplication.
- Explainable risk breakdown instead of a single opaque score.

## Risk dimensions

Each path exposes severity, exploitability, exposure, initial privilege, evidence confidence, target impact and path reachability. The final score is a weighted decision-support value, not a claim that exploitation is guaranteed.

## Safety boundary

Sentinel Mesh does not execute exploits. Paths are inferred from static evidence and must be reviewed by a security engineer before being treated as confirmed vulnerabilities.
