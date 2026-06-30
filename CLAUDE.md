# CLAUDE.md — Odyssey Fullstack Assignment

This file is the source of truth for how this project is built. Follow it on every task. If a request conflicts with these rules, stop and flag the conflict rather than silently working around it.

## What this project is

A small fullstack restaurant operations product: a dashboard plus a backend-backed ordering slice. This is a take-home assignment. It is graded on stack fidelity, design-system quality, type-safety/contract discipline, end-to-end integration, and scope judgment — NOT on feature count.

## Non-negotiable stack

Use exactly this. Do not substitute, even if a substitute seems faster or more familiar.

- pnpm workspace + Turborepo (pnpm 10.x, Node 20.x)
- `apps/dashboard`: Expo + React Native + Web (must run on web; native is a bonus)
- `services/backend`: Hono on Cloudflare Workers
- PostgreSQL (hosted on Neon) + Drizzle ORM
- drizzle-zod for schema-derived validation
- `@hono/zod-openapi` for OpenAPI generation from routes
- Orval for generated client + React Query hooks
- React Query for data fetching
- Shared packages for UI / utilities / types

### Explicitly banned

Do NOT introduce any of these under any circumstance:
- Next.js, NestJS, Prisma, tRPC, Supabase SDK, Firebase
- Handwritten frontend DTOs for backend data
- Duplicated enums or status types across frontend and backend
- Raw `fetch` as the main app data pattern
- Hand-edited generated API artifacts

If you hit friction with the required stack, the answer is to solve it within the stack, not to swap the tool. Reaching for a banned tool is an automatic failure of this assignment.

## Repo structure

```
apps/dashboard
services/backend
packages/shared
packages/types
packages/api-client
```

## The architecture rule (most important thing in this file)

Data truth flows in ONE direction. Never break this chain:

```
Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> generated frontend types/hooks
```

Consequences that must always hold:
- Persisted data truth starts in the Drizzle schema. Nothing upstream of it.
- API contracts are GENERATED, never hand-duplicated.
- Frontend API types come ONLY from generated/shared types.
- Frontend data fetching uses ONLY generated hooks.
- The order-status enum is defined ONCE in the Drizzle schema and propagates through the chain. It is never re-declared anywhere downstream.

If generation breaks, FIX THE GENERATION. Do not hand-write the missing type to keep moving. A hand-written type that should have been generated is a defect, not a shortcut — call it out instead of doing it.

## Code organization rules

- Presentational components stay focused on UI only.
- Business logic lives in hooks / services / backend — never in large page/screen components.
- Reusable UI patterns become shared components in the UI package.
- Design tokens are centralized in one place, never scattered inline.

## Backend behavior requirements

The ordering slice must show deliberate backend logic, not loose client-controlled fields:
- Validate required fields; reject invalid order payloads.
- Reject orders containing unavailable menu items.
- Calculate or verify order totals SERVER-SIDE. Never trust a client-sent total.
- Enforce valid order state transitions via a server-side state machine (an allowed-transition map). Status is NOT a free-form field the client can set to anything.
- Return clear, typed request/response shapes.

## Data model (minimum)

- menu categories
- menu items (with price, availability)
- customers
- orders
- order items
- ordering-related business settings

Provide seed data or a bootstrap flow so a reviewer can run the project locally with realistic data.

## Required root scripts

The repo must expose these and they must actually work:

```
pnpm dev:dashboard
pnpm dev:backend
pnpm gen:contract
pnpm lint
pnpm typecheck
pnpm test
```

`gen:contract` runs the codegen chain (Drizzle/Zod -> OpenAPI spec -> Orval). Decide whether Hono emits a committed `openapi.json` that Orval reads, and keep that approach consistent and reproducible.

## Testing expectations

Discipline, not exhaustive coverage:
- Targeted backend tests for key order flows — especially server-side total calculation and rejected/invalid state transitions.
- Some frontend tests for important logic or UI states.

## Secrets and git hygiene

- This repo is PUBLIC. A leaked credential is exposed to the entire internet immediately.
- `.gitignore` must contain `.env` and exist BEFORE any secret is written to disk.
- The Neon connection string lives in `.env` locally and as a Cloudflare secret for the deployed Worker. It is NEVER committed.
- Before any `git commit`, verify no `.env` or secret is staged.

## Version-compatibility check (DO THIS, do not assume)

drizzle-zod, `@hono/zod-openapi`, and Zod have a history of version mismatches — specifically Zod v3 vs v4 conflicts between drizzle-zod and the Hono OpenAPI package. This is the single most likely thing to break the pipeline.

Before building the real backend, VERIFY the currently-published versions of `drizzle-zod`, `@hono/zod-openapi`, and `zod` agree on a single Zod major. Do not pin versions from memory — check what is actually published and compatible right now, then pin those. State which Zod major the project is standardizing on.

## Build order (follow this sequence)

1. **Pipeline spike first.** One Drizzle table -> drizzle-zod -> one Hono OpenAPI route -> emit spec -> Orval generates a hook -> call it from a bare Expo screen. No styling, no business logic. Prove the chain end-to-end before building anything real.
2. Scaffold the monorepo properly (workspace, Turborepo, package layout, root scripts).
3. Full Drizzle schema + seed data.
4. Backend ordering slice with real behavior (totals, validation, state machine) + targeted backend tests.
5. Run real `gen:contract`; confirm frontend types/hooks are fully generated.
6. Design system: tokens -> primitives -> dedicated UI-library route.
7. Pages, deepest-first: Orders -> Menu -> Home -> CRM -> Settings.
8. Deliverable docs written as you go: run instructions, seed instructions, architecture-decisions note, and an honest tradeoffs/incomplete-areas note.

## How to work

- Move in small, reviewed increments. Do not emit the entire repo in one pass.
- After each chunk, the human reviews before moving on.
- When running terminal commands that touch git, the database, or migrations, surface them for review first.