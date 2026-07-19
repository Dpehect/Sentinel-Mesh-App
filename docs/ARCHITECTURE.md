# Target Architecture

```text
Browser / Next.js Web
        |
        v
API / Auth / RBAC
        |---- PostgreSQL
        |---- Valkey / BullMQ
        |---- Object storage
        |
        v
Isolated Scanner Runner
  Semgrep | Gitleaks | OSV | Trivy | Checkov
        |
        v
Normalizer → Asset Graph → Risk Engine → Attack Paths
        |
        v
Realtime UI / Reports / GitHub Checks
```

## Security boundaries
- Never execute repository code in the web or API process.
- Every scan runs in an ephemeral, resource-limited, network-restricted container.
- Uploaded archives are validated against path traversal and decompression bombs.
- Scanner output is treated as untrusted input.
- Organization authorization is enforced server-side for every object.
- Secrets are redacted before persistence or UI delivery.
