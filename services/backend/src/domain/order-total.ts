/**
 * Pure order-total calculation. No DB, no request, no side effects — this is
 * the SINGLE source of truth for how an order total is derived, so it can be
 * unit-tested directly and reused by any handler.
 *
 * Money is integer cents everywhere (locked decision). Inputs are the
 * snapshotted unit prices captured at order time, never live menu prices.
 */
export interface OrderTotalLine {
  unitPriceCents: number;
  quantity: number;
}

export function computeOrderTotal(lines: readonly OrderTotalLine[]): number {
  return lines.reduce(
    (total, line) => total + line.unitPriceCents * line.quantity,
    0,
  );
}
