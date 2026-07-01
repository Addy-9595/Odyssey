import { describe, expect, it } from "vitest";
import { formatMoney, formatDateTime } from "./format.ts";

describe("formatMoney", () => {
  it("formats a standard amount with a dollar sign and two decimals", () => {
    expect(formatMoney(1290)).toBe("$12.90");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats a single cent", () => {
    expect(formatMoney(1)).toBe("$0.01");
  });

  it("groups thousands with a comma", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
  });

  it("keeps trailing zeros for round dollar amounts", () => {
    expect(formatMoney(1000)).toBe("$10.00");
  });
});

describe("formatDateTime", () => {
  // Timezone can shift the exact clock/day, so assert structural substrings
  // rather than an exact string — the point is the function works, not
  // re-testing Intl.DateTimeFormat.
  const formatted = formatDateTime("2026-06-30T18:30:00Z");

  it("returns a non-empty string", () => {
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("includes the four-digit year", () => {
    expect(formatted).toContain("2026");
  });

  it("includes a time with hours:minutes and an AM/PM marker (en-US short time)", () => {
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    expect(formatted).toMatch(/(AM|PM)/);
  });

  it("includes a comma separating the medium date from the time", () => {
    expect(formatted).toContain(",");
  });
});
