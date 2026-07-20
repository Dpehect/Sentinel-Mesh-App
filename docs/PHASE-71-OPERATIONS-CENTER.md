# Phase 71 — Security Operations Center

This accelerated phase adds the operational layer required for a near-final Sentinel Mesh product.

## Included

### Operations package
- local atomic persistence
- team member records
- role-based permission matrix
- incident creation and lifecycle transitions
- optimistic concurrency for incident updates
- notification rule engine
- derived in-app, email and webhook alert decisions
- platform health snapshots
- aggregated health summary
- memory store and unit tests

### Web application
- `/operations` command-center page
- `/team` access-governance page
- incidents API
- rules API
- members API
- health API
- seeded local demonstration data
- local-first JSON persistence

## Default local storage

`.sentinel-data/operations.json`

Override using:

`SENTINEL_OPERATIONS_DATA_FILE=/secure/path/operations.json`

## Security model

- owner: full local administration
- security-admin: security policy and member role control
- analyst: incident investigation
- operator: incident transitions and health telemetry
- viewer: read-only

## Safety boundaries

- no remote shell execution
- no automatic external notification delivery
- webhook and email channels are policy decisions only
- no paid service required
- no approval bypass
