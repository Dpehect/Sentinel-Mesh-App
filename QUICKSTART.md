# Sentinel Mesh — Quick Start

## Demo interface without infrastructure

```bash
npm install
cp .env.example .env
npm run dev:web
```

Keep `DEMO_MODE=true` and open http://localhost:3000.

## Persistent production-like local mode

```bash
npm install
cp .env.example .env
# Set DEMO_MODE=false in .env
docker compose up -d postgres redis
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

- Web: http://localhost:3000
- Worker health: http://localhost:4010/health

The source ZIP intentionally excludes `node_modules`, Docker images and optional scanner binaries.
