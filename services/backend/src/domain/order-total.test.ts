import { describe, expect, it } from "vitest";
import { computeOrderTotal } from "./order-total.ts";

describe("computeOrderTotal", () => {
  it("sums quantity * snapshotted unit price, in cents", () => {
    // 2 × 500 + 1 × 350 = 1350
    expect(
      computeOrderTotal([
        { unitPriceCents: 500, quantity: 2 },
        { unitPriceCents: 350, quantity: 1 },
      ]),
    ).toBe(1350);
  });

  it("returns 0 for an empty order", () => {
    expect(computeOrderTotal([])).toBe(0);
  });

  it("handles a single line", () => {
    expect(computeOrderTotal([{ unitPriceCents: 1290, quantity: 3 }])).toBe(
      3870,
    );
  });

  it("uses each line's own snapshotted price, not a shared one", () => {
    // 1 × 2950 + 2 × 950 + 4 × 300 = 6050
    expect(
      computeOrderTotal([
        { unitPriceCents: 2950, quantity: 1 },
        { unitPriceCents: 950, quantity: 2 },
        { unitPriceCents: 300, quantity: 4 },
      ]),
    ).toBe(6050);
  });
});
