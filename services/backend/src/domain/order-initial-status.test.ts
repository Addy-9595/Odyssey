import { describe, expect, it } from "vitest";
import { initialStatusFor } from "./order-initial-status.ts";

describe("initialStatusFor", () => {
  it("defaults to pending when settings are absent", () => {
    expect(initialStatusFor(undefined)).toBe("pending");
  });

  it("is pending when auto-accept is off", () => {
    expect(initialStatusFor({ autoAcceptOrders: false })).toBe("pending");
  });

  it("is confirmed when auto-accept is on", () => {
    expect(initialStatusFor({ autoAcceptOrders: true })).toBe("confirmed");
  });
});
