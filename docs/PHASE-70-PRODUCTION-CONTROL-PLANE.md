# Phase 70 — Production Rollout Control Plane

This accelerated phase combines several production-readiness capabilities.

## Included

### Control-plane package
- atomic local JSON persistence
- restrictive file permissions
- optimistic concurrency with record versions
- explicit rollout state machine
- approval and rejection workflow
- recovery checkpoint creation
- SHA-256 checkpoint integrity verification
- recovery into a safe paused state
- retention pruning for events and checkpoints
- memory store for tests
- comprehensive unit tests

### Next.js integration
- `/rollouts` production management screen
- `GET /api/rollouts`
- `POST /api/rollouts`
- `POST /api/rollouts/approve`
- `POST /api/rollouts/events`
- `POST /api/rollouts/recover`
- local singleton control-plane adapter
- automatic local demonstration rollout
- no external database required

## Default storage

`.sentinel-data/rollouts.json`

Override with:

`SENTINEL_ROLLOUT_DATA_FILE=/secure/path/rollouts.json`

## Safety boundaries

- no arbitrary command execution
- no remote-agent command transport
- no approval bypass
- recovery snapshots are integrity checked
- concurrent stale writes are rejected
- external databases and paid providers remain optional
