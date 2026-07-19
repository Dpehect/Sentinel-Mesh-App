# Sentinel Mesh — Phase 1 Foundation

Open-source, local-first software security intelligence and attack-path simulation platform.

This Phase 1 delivery provides a working cinematic dashboard, simulated repository scan pipeline, normalized finding model, contextual risk engine, attack-path graph, project structure, testing, CI, Docker setup and the complete phased roadmap. No paid API key is required.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run typecheck
npm run test
npm run build
```

## Current flow

Repository URL → local scan simulation → normalized findings → contextual score → animated attack graph.

## Architecture

- `apps/web`: Next.js 16 App Router application
- `packages/security-core`: framework-independent findings, scoring and attack-path logic
- `docs/ROADMAP.md`: production roadmap
- `docs/ARCHITECTURE.md`: target architecture and security boundaries

## Zero-cost policy

Core scanning will use open-source local tools. Optional local AI will use Ollama or browser-based ONNX/WebGPU models. Cloud AI providers are never required.
