# Tradeoffs & Incomplete Areas

An honest accounting of what this project does not do, what was deferred, and why. Scope judgment — knowing what to exclude — is as important as what was built.

## Deliberate exclusions (out of scope by design)

### Payment and billing
No payment status, payment method, invoice, or refund logic. The ordering model tracks what was ordered and its lifecycle status, not how it was paid for. In a real product this is a separate bounded context with its own complexity (payment gateway integration, partial refunds, tips); including it here would have diluted the ordering discipline without adding signal.

### Authentication and authorization
No login, no user roles, no session management. The dashboard assumes a trusted staff user. In production, role-based access (kitchen staff sees preparing orders, managers see all) would gate both the API and the UI. Omitted because auth is infrastructure, not a demonstration of the ordering domain or the codegen pipeline.

### Pagination
`GET /orders`, `GET /customers`, and `GET /menu-items` return full lists. With 8 seed orders and 15 menu items this is correct; at scale it's not. Adding cursor-based pagination is a contract change (new query params, response wrapper) that touches every list hook — straightforward but not free. Deferred because the seed dataset doesn't need it and the codegen discipline is better demonstrated by the existing filter params.

### Cancel reason
`POST /orders/:id/cancel` is bare — no reason field. Adding it is a schema column + contract change; the state machine itself doesn't need it. Deferred for scope.

### `ready → cancelled` transition
Deliberately disallowed. Once an order is ready, the restaurant has committed prep costs. Allowing cancellation at that point implies a refund/waste flow that's out of scope (see payment exclusion). This is a conscious business-logic decision, not an oversight.

## Version pinning tradeoffs

### Node 20.18.0 (below Expo SDK 57's preference)
Expo SDK 57 prefers Node ≥20.19.4 and emits a warning. No observed issues — the warning is advisory, not a hard requirement. Pinned at 20.18.0 because:
- ESLint 10 requires Node ≥20.19.0; staying on 20.18.0 required pinning to ESLint 9.
- Wrangler 4.87+ requires Node 22; staying on 20.18.0 required pinning to Wrangler 4.86.0.
- Upgrading Node would have resolved the ESLint/Wrangler pins but risked introducing untested behavior across the stack mid-build. The conservative choice was to hold Node stable and pin the tools that needed it.

### ESLint 9 (not 10)
Consequence of the Node pin above. ESLint 9 with flat config and `typescript-eslint` `projectService` provides the same type-aware linting; the ESLint 10 features (mainly rule API changes) don't affect this project.

### Vitest 3 (not 4)
Vitest 4's rolldown native binding fails to install under pnpm on Windows. Vitest 3.2.6 runs the same test suite without issue. No test capability is lost.

### Wrangler 4.86.0
Last version supporting Node 20. Newer versions require Node 22.

## Incomplete areas (known gaps, not hidden)

### Three stub pages
Home, Customers (CRM), and Settings are routed but render only placeholder stubs. The two deep verticals (Orders and Menu) demonstrate the full stack: codegen, backend logic, design-system primitives, real loading/empty/error states. The remaining pages would follow the same pattern — each needs just-in-time backend endpoints (stats aggregation for Home, computed customer spend for CRM, singleton GET/PATCH for Settings) but would not demonstrate new architectural depth.

### Frontend tests
Backend tests are real and targeted: 15 pure-function tests covering order-total computation and the full state-machine transition matrix. Frontend tests are still stubs. The highest-value frontend tests would cover:
- Label map exhaustiveness (compile-time `satisfies` catches missing variants, but a runtime test confirms the maps match the generated enums).
- `formatMoney` / `formatDateTime` correctness (pure functions, trivially testable).
- The line-item merge logic in the create form (stateful, non-trivial, worth a unit test).

### Dark mode
The app is light-only (`userInterfaceStyle: "light"` in `app.json`). The token system could support a dark ramp, but building and testing it doubles the surface for no grading signal.

### Enum display formatting
Enum values like `dine_in` are displayed via explicit label maps (`dine_in` → "Dine-in") using `satisfies Record<OrderType, string>` for exhaustiveness. The maps exist for order types, statuses, and actions in the Orders pages. Other pages that display these enums would need the same maps or could share them — currently they're scoped to `apps/dashboard/src/orders/labels.ts`.

### No inline customer creation
The order-creation form selects from existing customers only. Creating a new customer belongs to the CRM page (a stub). This is a scope boundary, not a missing feature — the form's job is to demonstrate the ordering pipeline, not the customer lifecycle.

### Concurrent access / optimistic updates
Status actions use a pessimistic pattern (disable buttons while one is in-flight, await server response, then update cache). Optimistic updates would improve perceived speed but add rollback complexity. The pessimistic approach is correct for an ops tool where the server state is the truth.

## What I would build next

In priority order, if this were continuing:

1. **Menu page with CRUD** — toggle availability, edit prices, demonstrating write operations on a second entity through the same codegen chain.
2. **Frontend tests** — the three targets listed above, using Vitest + React Testing Library.
3. **Home dashboard** — a stats endpoint aggregating order counts, revenue, and popular items, rendered as KPI cards.
4. **CRM** — customer list with computed spend (aggregated from orders, no stored column) and order history.
5. **Settings** — singleton GET/PATCH for prep time, auto-accept, service availability, opening hours.