import { describe, expect, it } from "vitest";
import { OrderAction, OrderStatus, OrderType } from "@odyssey/api-client";
import {
  orderActionLabel,
  orderStatusLabel,
  orderTypeLabel,
} from "./labels.ts";

/**
 * Runtime complement of the compile-time `satisfies Record<Enum, string>` in
 * labels.ts: proves every generated enum value has a non-empty label and that
 * no stale/extra keys exist. Catches the case where an enum value is added in
 * the Drizzle schema and regenerated but a label is forgotten.
 */
function expectExactLabelCoverage(
  map: Record<string, string>,
  enumValues: string[],
) {
  const enumSet = new Set(enumValues);
  const mapKeys = Object.keys(map);

  // Every enum value has a non-empty string label.
  for (const value of enumValues) {
    expect(map).toHaveProperty(value);
    const label = map[value];
    expect(typeof label).toBe("string");
    // Truthy catches both a missing (undefined) and an empty-string label.
    expect(label).toBeTruthy();
  }

  // No extra/stale keys beyond the enum.
  for (const key of mapKeys) {
    expect(enumSet.has(key)).toBe(true);
  }

  // Counts line up exactly.
  expect(mapKeys.length).toBe(enumValues.length);
}

describe("orderTypeLabel", () => {
  it("covers every OrderType value with a non-empty label, and no extras", () => {
    expectExactLabelCoverage(orderTypeLabel, Object.values(OrderType));
  });
});

describe("orderStatusLabel", () => {
  it("covers every OrderStatus value with a non-empty label, and no extras", () => {
    expectExactLabelCoverage(orderStatusLabel, Object.values(OrderStatus));
  });
});

describe("orderActionLabel", () => {
  it("covers every OrderAction value with a non-empty label, and no extras", () => {
    expectExactLabelCoverage(orderActionLabel, Object.values(OrderAction));
  });
});
