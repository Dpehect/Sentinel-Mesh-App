# Release process

1. Run `npm ci`, `npm run verify`, `npm run test:e2e` and `npm run benchmark`.
2. Review dependency and CodeQL results.
3. Update CHANGELOG.md using Keep a Changelog categories.
4. Confirm migrations are forward compatible and backed up.
5. Build production containers and run health/readiness probes.
6. Create an annotated semantic-version tag.
7. GitHub Actions builds a source archive and release notes.
8. Verify published artifacts and public demo routes.
