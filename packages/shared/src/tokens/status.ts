/**
 * Status color palette — one distinct semantic hue per order status, each with
 * the fill / text / border shades a badge needs. Applied IDENTICALLY everywhere
 * a status appears (this is the design signature).
 *
 * NOTE ON ENUM DISCIPLINE: this is a color palette keyed by status *names*. It
 * deliberately does NOT declare an order-status union type — the single source
 * for the OrderStatus type is the generated client (`@odyssey/api-client`).
 * `packages/shared` stays generic and does not depend on that package. The
 * dashboard enforces that this palette covers every OrderStatus via a
 * `satisfies Record<OrderStatus, StatusColorSet>` check.
 */
import { gray } from "./colors.ts";

export interface StatusColorSet {
  fill: string; // badge background
  text: string; // badge label + icon
  border: string; // badge border
}

export const statusColors = {
  pending: { fill: "#fef3c7", text: "#92400e", border: "#fcd34d" }, // amber
  confirmed: { fill: "#dbeafe", text: "#1e40af", border: "#93c5fd" }, // blue
  preparing: { fill: "#ede9fe", text: "#6d28d9", border: "#c4b5fd" }, // violet
  ready: { fill: "#ccfbf1", text: "#0f766e", border: "#5eead4" }, // teal
  completed: { fill: "#dcfce7", text: "#166534", border: "#86efac" }, // green
  cancelled: { fill: "#ffe4e6", text: "#9f1239", border: "#fda4af" }, // rose
} satisfies Record<string, StatusColorSet>;

// Neutral fallback so the generic StatusBadge never crashes on an unknown key.
export const neutralStatusColor: StatusColorSet = {
  fill: gray[100],
  text: gray[700],
  border: gray[300],
};

/** Generic lookup by status name, with a neutral fallback for unknown keys. */
export function getStatusColorSet(status: string): StatusColorSet {
  return (
    (statusColors as Record<string, StatusColorSet>)[status] ??
    neutralStatusColor
  );
}
