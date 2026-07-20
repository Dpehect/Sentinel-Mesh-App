# Phase 72 — Release Candidate

This accelerated phase converts Sentinel Mesh into a release-candidate build.

## Included

### Release readiness engine
- weighted readiness score
- required and recommended release gates
- Node.js runtime validation
- writable local data verification
- session-secret verification
- platform health integration
- verified-backup requirement
- runtime diagnostic reports

### Backup and recovery
- operations and rollout data backup
- SHA-256 file checksums
- signed manifest-style integrity checksum
- safe relative-path enforcement
- directory traversal protection
- non-destructive restore by default
- optional explicit overwrite
- local backup manifest API

### Next.js screens
- `/system`
- `/backups`

### APIs
- `/api/system/readiness`
- `/api/system/diagnostics`
- `/api/system/backup`
- `/api/system/restore`

### Release assets
- hardened Docker Compose file
- release environment template
- full release verification script
- root build, test and typecheck integration

## Release target

Version `10.0.0-rc.1`

## Remaining work after this phase

- final end-to-end verification
- user-facing documentation cleanup
- removal or isolation of the accidental static Phase 10 demo
- final branding and navigation pass
- production release tag
