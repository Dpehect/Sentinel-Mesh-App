# Phase 5 — GitHub-native DevSecOps

This phase adds persisted GitHub App installations and webhook deliveries, delivery deduplication, push/PR triggered scans, branch and commit context, changed-file incremental scope, Check Run publishing, and a merge-gate policy.

## Required GitHub App permissions

- Repository metadata: read
- Contents: read
- Pull requests: read
- Checks: write

Subscribe to `installation`, `installation_repositories`, `repository`, `push`, and `pull_request` events.

## Environment

`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` are required for live GitHub mode. Demo mode remains key-free.
