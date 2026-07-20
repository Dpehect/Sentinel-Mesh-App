# Sentinel Mesh

<div align="center">

**Local-first security intelligence, attack-path analysis, secure agent operations, and enterprise-grade remediation workflows — built as a modular TypeScript monorepo.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Executive Summary

Sentinel Mesh is a security engineering platform designed to unify several workflows that are usually fragmented across separate tools:

- source-code security scanning,
- evidence-aware vulnerability analysis,
- attack-path modelling,
- secure distributed agent management,
- rollout and remediation orchestration,
- incident response,
- compliance evidence,
- auditability,
- and production-readiness verification.

The platform follows a **local-first architecture**. Core workflows can operate without requiring a paid cloud service, while optional integrations can extend the system for GitHub, external scanners, shared queues, databases, and enterprise environments.

Sentinel Mesh is not structured as a single dashboard with hard-coded logic. It is built as a **workspace-based monorepo** containing independently testable security engines, operational services, web interfaces, worker processes, plugins, and infrastructure components.

> The project demonstrates full-stack engineering, security architecture, distributed systems thinking, domain modelling, TypeScript package design, CI/CD discipline, and production-oriented software delivery.

---

## Why This Project Matters

Many security tools identify isolated findings but do not answer the operational questions that engineering and security teams care about:

- Is the finding reachable?
- What evidence supports it?
- What assets and trust boundaries are involved?
- Which remediation should be prioritised?
- Can a fix or agent update be rolled out safely?
- Who approved the operation?
- What happens if the rollout fails?
- Can the organisation prove what happened later?

Sentinel Mesh approaches security as a connected operating system rather than a list of alerts.

It combines:

1. **Detection** — identify code, dependency, secret, cloud, container, and runtime risks.
2. **Context** — enrich findings with evidence, ownership, topology, identity, and exposure.
3. **Prioritisation** — model attack paths and calculate explainable risk.
4. **Action** — create controlled remediation and rollout plans.
5. **Governance** — enforce approvals, policies, tenant boundaries, and audit trails.
6. **Recovery** — support checkpoints, rollback decisions, backups, and operational continuity.

---

# Product Capabilities

## 1. Security Command Center

The Next.js web application provides a central operating surface for:

- security posture,
- scans,
- findings,
- attack paths,
- remediation,
- intelligence,
- projects,
- GitHub integration,
- enterprise controls,
- agent rollouts,
- incidents,
- platform health,
- team access,
- diagnostics,
- and release readiness.

The interface is designed around operational workflows instead of disconnected feature pages.

Typical workflow:

```text
Scan repository
      ↓
Generate evidence-backed findings
      ↓
Model reachable attack paths
      ↓
Prioritise by business and technical risk
      ↓
Plan remediation
      ↓
Deploy through controlled rollout waves
      ↓
Monitor health, incidents, and audit evidence
```

---

## 2. Evidence-Aware Security Analysis

Sentinel Mesh is designed to move beyond simple pattern matching.

The analysis layer supports concepts such as:

- source-to-sink evidence,
- code locations,
- data-flow context,
- CWE and OWASP mapping,
- risk explanations,
- confidence scoring,
- finding lifecycle management,
- false-positive control,
- and remediation guidance.

This allows findings to be presented with technical reasoning instead of only severity labels.

---

## 3. Attack-Path Modelling

The attack-path engine connects isolated security signals into paths that represent realistic attacker movement.

It can model relationships between:

- public entry points,
- applications,
- identities,
- secrets,
- databases,
- cloud resources,
- containers,
- network boundaries,
- and defensive controls.

The goal is to answer:

> “Which combination of weaknesses creates a meaningful route to a critical asset?”

This helps security teams prioritise reachable and consequential risk instead of treating every finding equally.

---

## 4. Multi-Domain Security Coverage

The repository is organised into focused security packages covering a broad range of domains, including:

### Application and Source Security

- source analysis,
- secret detection,
- dependency and supply-chain security,
- CI/CD security,
- vulnerability prioritisation,
- detection-as-code,
- finding lifecycle management.

### Infrastructure and Runtime Security

- cloud posture,
- Kubernetes security,
- container runtime security,
- network detection and response,
- endpoint detection and response,
- external attack-surface analysis,
- multi-cloud inventory.

### Identity and Behaviour

- identity governance,
- identity attack paths,
- user and entity behaviour analytics,
- advanced UEBA,
- asset inventory graphs,
- risk graphs.

### SOC and Response

- SIEM correlation,
- threat intelligence,
- threat hunting,
- MITRE ATT&CK coverage,
- SOAR planning,
- case management,
- incident response,
- SOC analyst workflows.

---

## 5. Secure Distributed Agent Lifecycle

Sentinel Mesh includes a substantial agent-security architecture intended for environments where distributed agents collect telemetry or execute approved defensive operations.

Agent-focused packages cover:

- secure enrolment,
- certificate lifecycle,
- key rotation,
- secrets management,
- policy distribution,
- telemetry integrity,
- runtime attestation,
- command control,
- secure updates,
- self-protection,
- offline queues,
- bandwidth governance,
- adaptive scheduling,
- health scoring,
- and health remediation.

The design emphasises:

- explicit trust,
- signed communication,
- deterministic policy evaluation,
- constrained defensive actions,
- replay resistance,
- and human approval for high-impact operations.

---

## 6. Fleet Orchestration and Safe Rollouts

Sentinel Mesh models agent fleet operations as controlled, auditable workflows.

Supported concepts include:

- deterministic canary selection,
- staged rollout waves,
- global concurrency limits,
- per-region concurrency limits,
- maintenance windows,
- health-based eligibility,
- failure-rate circuit breakers,
- human approval gates,
- idempotency protection,
- rollout pause and resume,
- rollback decisions,
- and recovery checkpoints.

A rollout is not treated as a fire-and-forget deployment. It is modelled as a stateful security operation.

Example:

```text
Plan
  → Canary Wave
  → Observe Health
  → Approval Gate
  → Progressive Waves
  → Complete or Roll Back
```

---

## 7. Tamper-Evident Audit Chain

Operational events can be represented through a signed audit chain using:

- canonical serialisation,
- SHA-256 payload hashing,
- previous-record hash linking,
- HMAC signatures,
- sequence validation,
- idempotency-key detection,
- timestamp validation,
- and constant-time signature comparison.

If chain integrity fails, the system can make a defensive decision such as pausing a rollout.

This architecture is useful for:

- security investigations,
- compliance evidence,
- operational accountability,
- and post-incident reconstruction.

---

## 8. Security Operations Center

The operations layer supports:

- incident creation,
- severity classification,
- incident lifecycle transitions,
- optimistic concurrency,
- assignment and ownership,
- notification rules,
- platform health snapshots,
- team membership,
- and role-based access.

Example incident lifecycle:

```text
Open
  → Investigating
  → Contained
  → Resolved
```

Role examples:

| Role | Typical Responsibility |
|---|---|
| Owner | Full local administration |
| Security Admin | Security policy and access control |
| Analyst | Investigation and incident handling |
| Operator | Operational transitions and health telemetry |
| Viewer | Read-only access |

---

## 9. Enterprise and Multi-Tenant Controls

Sentinel Mesh includes architectural support for:

- tenant isolation,
- hierarchical roles,
- scoped API tokens,
- enterprise policy evaluation,
- compliance evidence,
- quota management,
- identity governance,
- and auditability.

External identity providers can be integrated as optional extension points, while local and demonstration workflows remain available without requiring a paid identity platform.

---

## 10. GitHub-Native Security Workflows

The platform includes GitHub-oriented capabilities such as:

- GitHub App integration,
- installation handling,
- webhook processing,
- incremental pull-request scans,
- security checks,
- Check Runs,
- and merge-gate concepts.

This supports a developer-first security model where findings can be surfaced close to the code-change lifecycle.

---

## 11. Plugin and Scanner Architecture

Sentinel Mesh provides a plugin-oriented design for extending scanner behaviour.

The repository includes:

- a typed plugin SDK,
- plugin authoring documentation,
- starter examples,
- scanner adapters,
- and marketplace-oriented concepts.

Optional external scanners may include tools such as:

- Semgrep,
- Gitleaks,
- OSV-based dependency checks.

These are intentionally treated as optional adapters rather than mandatory platform dependencies.

---

# Technical Architecture

## Monorepo Structure

```text
Sentinel-Mesh-App/
├── apps/
│   ├── web/                    # Next.js security console and APIs
│   └── worker/                 # Background scan and queue processing
│
├── packages/
│   ├── security-core/
│   ├── evidence-engine/
│   ├── attack-path-engine/
│   ├── policy-engine/
│   ├── audit-engine/
│   ├── compliance-engine/
│   ├── incident-response/
│   ├── threat-intelligence/
│   ├── scanner-runner/
│   ├── db/
│   └── ...                     # Additional domain-focused packages
│
├── plugins/                    # Scanner and platform extensions
├── examples/                   # Example integrations and vulnerable demos
├── docs/                       # Architecture, threat model, ADRs and phases
├── scripts/                    # Verification, benchmark and release scripts
├── release/                    # Release manifests and operational checklists
├── docker-compose.yml
├── docker-compose.production.yml
└── package.json
```

---

## Architectural Style

Sentinel Mesh uses a modular architecture based on several principles:

### Domain Isolation

Each security capability is implemented as a focused package with:

- explicit types,
- limited responsibilities,
- independent tests,
- and clear integration boundaries.

### Local-First Operation

Core workflows are designed to work locally or in a self-hosted environment.

This improves:

- data ownership,
- privacy,
- development speed,
- testability,
- and deployment flexibility.

### Deterministic Security Decisions

Security-sensitive planning logic aims to be:

- explainable,
- reproducible,
- policy-controlled,
- and testable.

Examples include rollout planning, risk scoring, health remediation, audit verification, and approval workflows.

### Defence in Depth

The platform applies multiple defensive layers:

- signed sessions,
- authorisation guards,
- tenant checks,
- secure headers,
- rate limiting,
- audit logs,
- policy evaluation,
- integrity verification,
- hardened containers,
- backup validation,
- and release gates.

---

# Technology Stack

## Frontend and Web Platform

- Next.js App Router
- React
- TypeScript
- Server Components
- Route Handlers
- Responsive CSS
- Server-rendered operational dashboards

## Backend and Processing

- Node.js
- Fastify-based worker/API patterns
- Background queue processing
- BullMQ-compatible queue architecture
- Redis/Valkey support
- PostgreSQL persistence
- Local demonstration fallbacks

## Testing and Quality

- Vitest
- Playwright
- TypeScript strict type checking
- Static repository verification
- Integration tests
- End-to-end tests
- Benchmark scripts
- GitHub Actions

## Infrastructure

- Docker
- Docker Compose
- Hardened production container profiles
- Health endpoints
- Release manifests
- Source packaging
- CI release verification

---

# Data and Control Flow

```mermaid
flowchart LR
    A[Repository / Asset] --> B[Scanner Runner]
    B --> C[Security Engines]
    C --> D[Evidence Engine]
    D --> E[Finding Lifecycle]
    E --> F[Risk & Attack Path Engines]
    F --> G[Policy / Compliance]
    G --> H[Remediation Plan]
    H --> I[Agent Fleet Rollout]
    I --> J[Operations Center]
    J --> K[Audit, Backup & Recovery]
```

---

# Security Model

Sentinel Mesh is designed with the assumption that security infrastructure itself is a high-value target.

Key defensive concepts include:

- least privilege,
- scoped operations,
- explicit approval,
- local data ownership,
- signed and chained audit records,
- secure agent identity,
- replay protection,
- constrained remediation actions,
- integrity-verified recovery,
- version-guarded state transitions,
- and no arbitrary shell execution in defensive planning modules.

Detailed security documentation is available under:

```text
docs/SECURITY.md
docs/THREAT-MODEL.md
docs/RISK-METHODOLOGY.md
docs/adr/
```

---

# Getting Started

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Git
- Docker and Docker Compose for the full infrastructure stack

Check your versions:

```bash
node --version
npm --version
docker --version
```

---

## Local Development

```bash
git clone https://github.com/Dpehect/Sentinel-Mesh-App.git
cd Sentinel-Mesh-App

npm install
cp .env.example .env
npm run dev
```

Default local application:

```text
http://localhost:3000
```

The web and worker applications are started through the root workspace scripts.

---

## Full Local Infrastructure

Start the database and queue services:

```bash
docker compose up -d postgres redis
```

Run database setup:

```bash
npm run db:migrate
npm run db:seed
```

Start the platform:

```bash
npm run dev
```

---

# Environment Configuration

Use `.env.example` as the primary configuration reference.

Typical categories include:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
SENTINEL_SESSION_SECRET=replace-with-a-long-random-value

# Database
DATABASE_URL=postgresql://...

# Queue
REDIS_URL=redis://localhost:6379

# GitHub App
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Local data
SENTINEL_DATA_ROOT=.sentinel-data
```

Do not commit real secrets.

---

# Available Commands

## Development

```bash
npm run dev
npm run dev:web
npm run dev:worker
```

## Build

```bash
npm run build
npm run build:packages
npm run build:apps
```

## Quality

```bash
npm run typecheck
npm run test
npm run lint
npm run test:e2e
```

## Verification

```bash
npm run verify
npm run verify:static
npm run benchmark
```

## Database

```bash
npm run db:migrate
npm run db:seed
```

## Release

```bash
npm run release:source
```

Available release commands may expand as the repository's final release scripts are applied.

---

# Testing Strategy

Sentinel Mesh uses multiple testing layers.

## Unit Tests

Domain packages test deterministic logic such as:

- risk calculation,
- policy evaluation,
- attack-path construction,
- queue behaviour,
- quotas,
- agent security,
- rollout planning,
- and remediation decisions.

## Integration Tests

Integration tests validate boundaries between:

- web APIs,
- worker processing,
- persistence,
- scanner execution,
- and security controls.

## End-to-End Tests

Playwright-based tests validate user-facing workflows such as authentication and console navigation.

## Static Verification

Repository verification checks:

- workspace consistency,
- required source files,
- package structure,
- configuration,
- and release readiness.

---

# Production Deployment

## Docker Compose

```bash
docker compose -f docker-compose.production.yml up --build
```

For hardened release profiles, use the release-specific Compose and environment files when present.

## Production Expectations

Before deployment:

- configure a strong session secret,
- use a production PostgreSQL instance,
- use a shared Redis/Valkey instance,
- terminate TLS at a trusted proxy,
- restrict network access,
- configure backup retention,
- review scanner permissions,
- validate GitHub webhook secrets,
- run the full verification pipeline.

---

# Observability and Operations

Sentinel Mesh includes architectural support for:

- structured logs,
- runtime health,
- worker health,
- queue visibility,
- scan events,
- audit records,
- platform metrics,
- component latency,
- and operational readiness.

Operational pages and APIs are designed to help answer:

- What is currently running?
- What failed?
- Which assets are affected?
- Who approved the action?
- Can the system recover safely?
- Is the platform ready for production?

---

# Engineering Decisions That Stand Out

This project demonstrates several decisions that are particularly relevant to senior engineering and security roles.

## 1. Package-Level Domain Modelling

Instead of placing all logic inside the web application, Sentinel Mesh separates security domains into independently testable packages.

## 2. Explainability Over Black-Box Scoring

Risk, remediation, rollout, and health decisions are intended to include reasons and evidence rather than only numeric outputs.

## 3. Safe Automation

Automation is constrained by:

- allowlists,
- cooldowns,
- concurrency limits,
- approval gates,
- version checks,
- and rollback conditions.

## 4. Operational Completeness

The platform considers the complete lifecycle:

```text
Detection → Context → Prioritisation → Action → Governance → Recovery
```

## 5. Self-Hosted Flexibility

External services improve scalability but are not required for understanding, developing, or demonstrating the core product.

---

# Portfolio and Recruitment Perspective

Sentinel Mesh is especially relevant for roles involving:

- Senior Full-Stack Engineering
- Security Engineering
- Application Security
- Platform Engineering
- DevSecOps
- Backend Architecture
- TypeScript and Node.js
- Next.js
- Distributed Systems
- Security Automation
- Cloud Security
- SOC Tooling
- Developer Experience
- Technical Product Engineering

The repository demonstrates the ability to:

- design a large modular system,
- model complex security domains,
- create reusable TypeScript packages,
- build full-stack operational interfaces,
- reason about distributed trust,
- implement deterministic safety controls,
- structure CI and release workflows,
- and communicate architecture through documentation and ADRs.

---

# Roadmap

Potential future directions include:

- shared distributed rate limiting,
- production SSO and SCIM connectors,
- richer live topology visualisation,
- expanded scanner marketplace support,
- OpenTelemetry export,
- managed deployment templates,
- signed release artefacts,
- advanced policy authoring UI,
- multi-region control-plane support,
- and deeper SIEM/SOAR integrations.

---

# Documentation

Key documentation includes:

```text
docs/ARCHITECTURE.md
docs/DEVELOPMENT-PLAN.md
docs/THREAT-MODEL.md
docs/RISK-METHODOLOGY.md
docs/SECURITY.md
docs/PLUGIN-AUTHORING.md
docs/PUBLIC-REPORTS.md
docs/ROADMAP.md
docs/adr/
```

---

# Contributing

Contributions should follow the repository's engineering standards.

Recommended workflow:

```bash
git checkout -b feature/your-feature
npm install
npm run typecheck
npm run test
npm run build
```

Before opening a pull request:

- keep package responsibilities focused,
- add or update tests,
- document security-sensitive decisions,
- avoid committing secrets,
- verify backwards compatibility,
- and explain operational impact.

See:

```text
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
```

---

# Responsible Security Research

Do not open public issues for sensitive vulnerabilities.

Follow the instructions in `SECURITY.md` when reporting a security issue.

---

# License

This project is licensed under the MIT License.

See [LICENSE](LICENSE).

---

<div align="center">

## Sentinel Mesh

**Evidence-aware security intelligence. Controlled automation. Operational accountability.**

Built to demonstrate how modern security platforms can be modular, explainable, local-first, and production-oriented.

</div>
