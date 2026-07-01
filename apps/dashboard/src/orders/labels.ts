import { OrderAction, OrderStatus, OrderType } from "@odyssey/api-client";

/**
 * Human-readable labels for the generated enums. These live in the dashboard
 * (the layer allowed to import the generated client), NOT in @odyssey/shared,
 * and are explicit maps — not string transforms. Each `satisfies Record<Enum,
 * string>` so adding an enum variant without a label fails typecheck.
 */

export const orderTypeLabel = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
} satisfies Record<OrderType, string>;

export const orderStatusLabel = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
} satisfies Record<OrderStatus, string>;

export const orderActionLabel = {
  confirm: "Confirm",
  preparing: "Start preparing",
  ready: "Mark ready",
  complete: "Complete",
  cancel: "Cancel",
} satisfies Record<OrderAction, string>;
