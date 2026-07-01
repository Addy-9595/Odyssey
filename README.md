# Odyssey

A fullstack restaurant operations dashboard — Expo + React Native (web) frontend, Hono on Cloudflare Workers backend, Neon Postgres, with a one-directional codegen pipeline from the database schema to generated frontend hooks.

## Prerequisites

- **Node 20.18.0** (pinned; see [TRADEOFFS.md](./TRADEOFFS.md) for why)
- **pnpm 10.x** (`corepack enable && corepack prepare pnpm@latest --activate`)
- A **Neon** Postgres database (free tier works — [neon.tech](https://neon.tech))

## Setup

```bash
git clone <repo-url> && cd Odyssey
pnpm install
```

Create a `.env` file at the **repo root** with your Neon connection string:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Create `services/backend/.dev.vars` with the same value (Wrangler reads secrets from here):

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> **This repo is public.** Neither file is committed (both are in `.gitignore`). Never stage `.env` or `.dev.vars`.

## Database setup

Run the Drizzle migration, then seed with realistic restaurant data:

```bash
pnpm --filter @odyssey/backend run db:push
pnpm --filter @odyssey/backend run db:seed
```

This populates: 5 categories, 15 menu items (2 intentionally unavailable), 5 customers, 8 orders across all statuses, 20 order line items, and a singleton settings row.

## Running

Two servers, both required — the dashboard calls the backend API:

```bash
# Terminal 1 — backend (Cloudflare Worker on :8787)
pnpm dev:backend

# Terminal 2 — dashboard (Expo web on :8081)
pnpm dev:dashboard
```

Open **http://localhost:8081** in a browser. The sidebar navigates between pages; Orders is fully functional (list, detail with status actions, and order creation).

## Available scripts

| Script | What it does |
|---|---|
| `pnpm dev:dashboard` | Start the Expo web dev server |
| `pnpm dev:backend` | Start the Wrangler dev server against Neon |
| `pnpm gen:contract` | Run the full codegen chain: emit OpenAPI spec from Hono → Orval generates client hooks |
| `pnpm lint` | Type-aware ESLint across all packages (Turbo-orchestrated) |
| `pnpm typecheck` | TypeScript `--noEmit` across all packages |
| `pnpm test` | Vitest on the backend (pure-logic order tests) |

## Project structure

```
apps/dashboard        Expo + React Native + Web — the staff-facing UI
  app/                expo-router file-based routes
  src/orders/         order-specific label maps and utilities
  src/shell/          navigation shell (lives outside app/ — not a route)
  src/ui-library/     design system showcase screen

services/backend      Hono on Cloudflare Workers
  src/routes/         API route handlers
  src/contract/       Zod schemas for request/response (drizzle-zod derived)
  src/domain/         Pure business logic (order totals, state machine)
  src/db/             Drizzle schema, client, relations
  scripts/            OpenAPI generation, DB seed

packages/shared       Design tokens, UI primitives, formatting utilities
packages/api-client   Orval-generated React Query hooks (src/generated/ is auto-generated)
packages/types        Hand-authored shared TypeScript types
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions and [TRADEOFFS.md](./TRADEOFFS.md) for known limitations.