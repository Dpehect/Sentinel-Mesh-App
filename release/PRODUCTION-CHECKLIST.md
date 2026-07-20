# Sentinel Mesh Production Checklist

## Before release

- [ ] All phases through Phase 77 are applied
- [ ] `npm install` succeeds
- [ ] `npm run phase75:verify` succeeds
- [ ] `npm run phase76:check` succeeds
- [ ] `npm run final:verify` succeeds
- [ ] `/command-center` loads
- [ ] `/operations` loads
- [ ] `/rollouts` loads
- [ ] `/system` loads
- [ ] `/security-hardening` loads
- [ ] A verified backup exists
- [ ] `SENTINEL_SESSION_SECRET` is configured
- [ ] Production data directory is writable
- [ ] Docker release profile starts successfully

## Release approval

- [ ] Security owner approval
- [ ] Operations owner approval
- [ ] Backup verification
- [ ] Final release archive created
- [ ] Git tag created
