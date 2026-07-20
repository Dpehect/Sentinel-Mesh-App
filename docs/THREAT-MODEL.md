# Sentinel Mesh Threat Model

## Protected assets
- source code
- repository tokens
- scan evidence
- organization and tenant data
- audit records
- generated reports
- worker and queue integrity

## Trust boundaries
1. browser to web application
2. web application to worker
3. worker to queue and database
4. scanner to untrusted repository
5. GitHub webhook to application
6. public report to anonymous visitor

## Primary threats
- malicious repository content
- command injection during scanning
- path traversal and symlink escape
- zip bombs and oversized repositories
- cross-tenant data access
- forged webhooks
- leaked tokens or secrets
- denial of service through scan jobs
- unsafe public report exposure
- false or unsupported security findings

## Mandatory controls
- never execute repository code by default
- scanner timeout, memory and file-count limits
- temporary isolated scan directory
- canonical path validation
- webhook signature verification
- tenant checks on every data access
- rate limits for scan creation and public endpoints
- no secrets in logs
- immutable audit events for privileged actions
- evidence and confidence attached to every finding

## Out of scope
Sentinel Mesh does not perform exploitation against third-party systems and does not require direct access to production cloud accounts for its default workflow.
