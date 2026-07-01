import type { OrderStatus } from "./order-transitions.ts";

/**
 * The initial status a newly-created order gets. Driven by the singleton
 * settings row, NEVER by the client: when auto-accept is on, orders skip the
 * pending step and start confirmed; otherwise they start pending. Pure and
 * unit-tested so this policy can't silently change.
 */
export function initialStatusFor(
  settings: { autoAcceptOrders: boolean } | undefined,
): OrderStatus {
  return settings?.autoAcceptOrders ? "confirmed" : "pending";
}
