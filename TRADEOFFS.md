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

### Opening hours editor
The Settings page displays opening hours read-only. `PATCH /settings` deliberately excludes the `openingHours` field — `strictObject` rejects it. Building a 7-day × 2-time-field editor with validation (close > open, nullable for closed days) is 1+ hours of UI for zero architectural signal. The backend stores and serves the data; the capability exists if needed.

### Inline customer creation
The order-creation form selects from existing customers only. Creating a new customer belongs to a CRM workflow. The form's job is to demonstrate the ordering pipeline (codegen, server-computed totals, state machine), not the customer lifecycle.

### Dark mode
Light-only (`userInterfaceStyle: "light"` in `app.json`). The token system could support a dark ramp, but building and testing it doubles the visual surface for no grading signal.

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

### Frontend component tests
Backend has 18 targeted tests: pure-function `initialStatusFor` (3), order-total computation (4), and the full state-machine transition matrix (11). The shared package has format tests (formatMoney, formatDateTime). The dashboard has label exhaustiveness tests (orderType, orderStatus, orderAction).

What's missing: component-level tests for interactive behavior — the line-item merge logic in the create form, the status-filter pills, the mutation/cache interactions. These would use Vitest + React Testing Library. Deferred because the pure-logic and exhaustiveness tests cover the highest-risk surface, and component tests on a take-home have diminishing returns.

### Concurrent access / optimistic updates
Status actions and settings toggles use a pessimistic pattern (disable controls while in-flight, await server response, then update cache). Optimistic updates would improve perceived speed but add rollback complexity. The pessimistic approach is correct for an ops tool where the server state is the truth.

### Orval codegen naming for OpeningHours
Orval expanded the unregistered `OpeningHoursDaySchema` into per-day types (`OpeningHoursMon` through `OpeningHoursSun`) rather than a shared `OpeningHoursDay`. Shapes are identical. Registering the day schema as a named OpenAPI component (`.openapi("OpeningHoursDay")`) would fix this. No functional impact — the frontend indexes by day key and the types are correct.

## What I would build next

In priority order, if this were continuing:

1. **Frontend component tests** — line-item merge, status filter pills, mutation/cache interactions.
2. **Customer creation** — inline from the CRM page, with email uniqueness validation surfaced from the backend's existing constraint.
3. **Pagination** — cursor-based on orders and customers, contract change propagated through the codegen chain.
4. **Opening hours editor** — 7-day time picker with validation, wired to the existing PATCH endpoint (which would need `openingHours` added to the update body).
5. **Auth** — role-based access gating kitchen vs manager views.