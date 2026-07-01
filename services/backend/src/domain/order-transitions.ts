import { orderStatus } from "../db/schema.ts";

/**
 * The order state machine — the SINGLE source of truth for which status
 * changes are legal. Route handlers call into this; the rules live nowhere
 * else (not duplicated across handlers, not re-declared on the frontend).
 *
 * Status values come from the `order_status` pgEnum (defined once in the
 * schema), so this map can never drift from the database enum.
 */
export type OrderStatus = (typeof orderStatus.enumValues)[number];

/**
 * Allowed target statuses keyed by current status:
 *  - forward, one step at a time, no skipping:
 *      pending -> confirmed -> preparing -> ready -> completed
 *  - cancel allowed from pending / confirmed / preparing
 *  - cancel NOT allowed from ready / completed
 *  - completed and cancelled are terminal (no exits)
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Thrown when a status change violates the state machine. */
export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Illegal order transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new IllegalTransitionError(from, to);
  }
}

/**
 * Maps a named action endpoint to the target status it drives. Keeping this
 * here (next to the transition rules) means the five action routes are thin:
 * they look up the target and delegate the legality check to assertTransition.
 * This is NOT a generic client-controlled status setter.
 */
export const ORDER_ACTION_TARGET = {
  confirm: "confirmed",
  preparing: "preparing",
  ready: "ready",
  complete: "completed",
  cancel: "cancelled",
} as const satisfies Record<string, OrderStatus>;

export type OrderAction = keyof typeof ORDER_ACTION_TARGET;

/** All action names in a stable order, derived from the target map (single source). */
export const ORDER_ACTIONS = Object.keys(ORDER_ACTION_TARGET) as OrderAction[];

/**
 * Computes which actions are legal from a given status — the actions whose
 * target status passes `canTransition`. Computed on read, never stored (same
 * principle as customer spend). Keeps transition logic in its single home.
 */
export function computeAllowedActions(status: OrderStatus): OrderAction[] {
  return ORDER_ACTIONS.filter((action) =>
    canTransition(status, ORDER_ACTION_TARGET[action]),
  );
}
