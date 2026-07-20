# Sentinel Mesh Phase 9 — Quick Start

1. Install dependencies once: `npm install`
2. Copy `.env.example` to `.env`
3. Start local services when using production mode: `docker compose up -d postgres redis`
4. Run migrations: `npm run db:migrate`
5. Start the product: `npm run dev`
6. Open `http://localhost:3000/intelligence`

`DEMO_MODE=true` works without PostgreSQL, Redis, GitHub credentials or paid AI APIs.
