# Production Security Checklist

## Required before production
- [ ] all tests and builds pass
- [ ] production secrets are outside Git
- [ ] session cookies are secure, HTTP-only and same-site
- [ ] tenant isolation tests pass
- [ ] GitHub webhook signatures are verified
- [ ] scanner jobs have time, memory and size limits
- [ ] repository files are treated as untrusted input
- [ ] public reports expose only explicitly approved fields
- [ ] database backups are tested
- [ ] audit events exist for role, token and policy changes
- [ ] dependency updates are reviewed
- [ ] critical findings block release

## Free deployment baseline
- GitHub Actions for verification
- Dependabot for dependency update pull requests
- Docker Compose for local PostgreSQL and Valkey
- local deterministic scanners by default
