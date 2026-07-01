# Architecture Decisions

Decisions made deliberately during the build, with reasoning. These are not defaults — each was chosen over alternatives and held consistently.

## The codegen chain (the central architecture rule)

Data truth flows in one direction. Nothing breaks this chain:

```
Drizzle schema → drizzle-zod → @hono/zod-openapi → committed openapi.json → Orval → generated React Query hooks + TypeScript types
```

Every API type the frontend uses is **generated**, never hand-written. Enums (`OrderStatus`, `OrderType`, `OrderAction`) are defined once as Postgres enums in the Drizzle schema and propagate through the chain to the generated client — they are never re-declared on the frontend.

The OpenAPI spec is a **committed build artifact** (`services/backend/openapi.json`), emitted by `scripts/generate-openapi.ts` from the same Hono app the Worker serves. This means the served API and the committed contract cannot drift. Orval reads the committed file, so regeneration is reproducible.

**Why this matters:** a reviewer can verify the chain by changing a column name in the schema, running `pnpm gen:contract`, and watching the type change propagate to the generated frontend hook — which is exactly how the pipeline was verified during the initial spike.

## Zod v4 standardization

The pipeline's single biggest compatibility risk: `drizzle-zod`, `@hono/zod-openapi`, and `zod` must agree on a Zod major. This was **verified at install** (not assumed from docs):

- `zod@4.4.3`, `drizzle-zod@0.8.3`, `@hono/zod-openapi@1.4.0` — all on Zod 4.

Pinned deliberately. A casual `pnpm update` could break the pipeline if these drift.

## Money as integer cents

Every monetary value (menu prices, order line unit prices, order totals, customer spend aggregates) is stored and transmitted as an **integer count of cents**. No floats, no decimals, no `numeric` types. Columns are suffixed `_cents` to make this unmissable in the schema.

Formatting to `$12.90` happens at the display layer only (`formatMoney` in `packages/shared`), using `Intl.NumberFormat`. The number that travels through the API, the database, and the codegen chain is always an integer.

## Snapshot pricing

`order_items.unit_price_cents` captures the menu item's price **at order time**. It is not a foreign-key lookup of the menu item's current price. This means past orders don't change when menu prices are updated — a standard restaurant-ops requirement.

The order total is `sum(unit_price_cents × quantity)` over the order's items, computed server-side by `computeOrderTotal` — a pure function with its own unit tests.

## Server-computed totals (never trust the client)

The `POST /orders` endpoint accepts `{ customerId, type, items: [{ menuItemId, quantity }] }` via a Zod `strictObject`. It **rejects any extra field** — a client cannot send a total, a price, or a status. The server snapshots current menu prices, computes the total, and returns it.

The create form shows a client-side preview subtotal for UX. Price never enters the form's state (only `menuItemId` and `quantity` are stored), so it structurally cannot leak into the request body. The preview is labeled as an estimate; the returned `OrderDetail.totalCents` is the truth.

This was verified live: sending a body with an extra `total` field returns `400 VALIDATION_ERROR: Unrecognized key: "total"`.

## Order state machine

Six statuses, one forward path, cancellation from early states only:

```
pending → confirmed → preparing → ready → completed
  ↓          ↓           ↓
cancelled  cancelled   cancelled
```

`completed` and `cancelled` are terminal — nothing exits them. `ready → cancelled` is deliberately disallowed (once food is ready, the restaurant has committed the cost).

The transition rules live in **one place**: `src/domain/order-transitions.ts`, with `ALLOWED_TRANSITIONS` as the single source of truth. Route handlers call `canTransition(from, to)` — they do not contain transition logic themselves.

Transitions are exposed as **five named action endpoints** (`POST /orders/:id/{confirm,preparing,ready,complete,cancel}`), not a generic status-setter. This makes the API self-documenting and prevents the client from setting arbitrary statuses.

## Computed `allowedActions`

The `OrderDetail` response includes `allowedActions: OrderAction[]`, computed at read time from the order's current status and the transition rules. This tells the frontend which action buttons to show without duplicating the state machine.

The computation is attached at a single enrichment point (`loadOrderDetail`), so all seven handlers that return an `OrderDetail` (create, get, and the five actions) carry it automatically — no handler can forget it.

`OrderAction` is a generated enum (derived from `ORDER_ACTION_TARGET`), so the frontend's `satisfies Record<OrderAction, string>` exhaustiveness check on button labels catches any new action at compile time.

## Computed-on-read aggregates (no stored totals)

Customer spend (`totalSpendCents`) and order count are not stored columns. They are computed on read by aggregating the customer's orders (`SUM(total_cents)`, `COUNT(id)`). This avoids write-time maintenance of a running total that can drift from the order data.

The same principle applies to the dashboard stats endpoint: total revenue, orders-by-status counts, and popular items are all computed from the orders and order_items tables, never cached in a summary table.

## Settings singleton

The `settings` table uses a `CHECK (id = 1)` constraint ensuring at most one row can ever exist. The seed inserts it; the app reads it. `GET /settings` returns the row; `PATCH /settings` updates it with the same partial-update pattern as menu items (`strictObject.partial()`, reject empty body, reject unknown fields).

Two settings have live behavioral effects:

### `autoAcceptOrders` — initial order status
Extracted as a pure function `initialStatusFor(settings)` in `src/domain/order-initial-status.ts`, consistent with the `computeOrderTotal` pattern. The function is trivial (one ternary), but extracting it makes the behavior testable without a route harness, documents the logic in one place, and keeps the create handler focused on orchestration. Three unit tests cover the cases: undefined settings → pending, false → pending, true → confirmed.

### `serviceAvailable` — order creation guard
Checked at the top of `POST /orders`, before any business logic (customer lookup, menu item validation, total computation). When false, the endpoint short-circuits with `422 SERVICE_UNAVAILABLE`. This ordering is deliberate: rejecting a closed restaurant should not waste a database round-trip validating the order payload.

### `openingHours` — read-only
Stored as typed JSONB (`Record<Weekday, { open: string | null; close: string | null }>`). Served in `GET /settings` with an explicit Zod schema so Orval emits a usable TypeScript type. Excluded from `PATCH /settings` — `strictObject` rejects it. The UI displays hours; it does not edit them.

### `defaultPrepTimeMinutes` — config, not behavior
Editable via the settings page and persisted. Not currently read by any backend logic — no flow computes estimated ready times. Stored as configuration for a future feature, displayed honestly as a number.

## Enum display discipline

The design system (`packages/shared`) is generic — it has no dependency on the API client. Status colors are keyed by generic string; the `StatusBadge` doesn't know about `OrderStatus`.

The **dashboard** (which can import the generated client) bridges the gap with explicit label maps typed as `satisfies Record<OrderStatus, string>` (and similarly for `OrderType`, `OrderAction`). This means:

- Adding a new enum value in the Drizzle schema propagates through generation and causes a **compile error** at the label map if the label is missing.
- `shared` stays reusable and dependency-free.
- No string transforms that guess formatting — every display label is explicit.

Label maps live in `apps/dashboard/src/orders/labels.ts` and are covered by runtime tests that verify exact coverage against the generated enum values (no missing labels, no stale extras).

## Styling: RN StyleSheet + tokens (no NativeWind)

The dashboard is React Native rendered to web via `react-native-web`. Styling uses plain `StyleSheet.create` with a centralized token system in `packages/shared`. No `className`, no CSS files, no Tailwind.

NativeWind was rejected because the web platform is required and RNW compatibility was an unacceptable risk for the required target. The token system (colors, spacing, radii, typography, elevation) is the single source for every visual value — no inline literals.

## Custom sidebar (no Drawer)

The nav shell uses expo-router `Slot` + `Link` with a custom sidebar built from design-system primitives, not expo-router's `Drawer` layout. This avoids pulling in `react-native-gesture-handler` and `react-native-reanimated` — heavy dependencies with compatibility risk on React 19.2 / RN 0.86.

Shell components (`NavShell`, `PageStub`) live in `src/shell/`, outside the `app/` directory, because expo-router treats every file in `app/` as a route.

## ApiError alignment with ErrorResponse

The hand-written `fetch-client.ts` throws `ApiError` on non-2xx responses. The generated client types errors as `ErrorResponse` (the backend's error shape: `{ error, code, details? }`). For the frontend's `onError` handlers to read `error.code` (e.g. to detect `ILLEGAL_TRANSITION`), `ApiError` extracts `code`, `error`, and `details` from the response body.

This is a load-bearing coupling: if the backend's `ErrorResponse` shape changes, `fetch-client.ts` must be updated to match. The generated types will update automatically; the extraction in `fetch-client.ts` will not.

## ESLint: type-aware, minimal plugins

ESLint 9 (pinned — ESLint 10 requires Node ≥20.19.0) with one root flat config, type-aware via `typescript-eslint` `projectService: true` and `recommendedTypeChecked`. Plugins: `typescript-eslint` + `eslint-plugin-react-hooks` (rules-of-hooks as error, exhaustive-deps as warn).

Generated code (`packages/api-client/src/generated/**`) is fully ignored — not leniently linted, because any finding there is unactionable without hand-editing generated output (which is banned). The `.wrangler/` dev bundle is also ignored (flat config doesn't read `.gitignore`).

## Cache strategy after mutations

Status actions, order creation, menu item updates, and settings changes use the same pattern: the mutation returns the fresh entity, which is used to **seed the detail/singleton cache** via `setQueryData`, then related lists are **invalidated** via `invalidateQueries` (prefix-match on the list key, covering all filter variants). This avoids a stale detail after an action and a stale list after navigation, with one round-trip instead of two refetches.

Settings mutations use separate mutation instances for inline toggles vs. explicit Save actions (same pattern as the Menu page), so pending states don't interfere across controls.