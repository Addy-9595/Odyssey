import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  IllegalTransitionError,
  ORDER_ACTION_TARGET,
} from "./order-transitions.ts";

describe("canTransition — legal moves", () => {
  it("allows the full forward chain, one step at a time", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "preparing")).toBe(true);
    expect(canTransition("preparing", "ready")).toBe(true);
    expect(canTransition("ready", "completed")).toBe(true);
  });

  it("allows cancel from pending, confirmed, and preparing", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("preparing", "cancelled")).toBe(true);
  });
});

describe("canTransition — illegal moves", () => {
  it("rejects skipping forward steps (pending -> ready)", () => {
    expect(canTransition("pending", "ready")).toBe(false);
  });

  it("rejects moving backward out of a terminal state (completed -> preparing)", () => {
    expect(canTransition("completed", "preparing")).toBe(false);
  });

  it("rejects cancel once ready or completed", () => {
    expect(canTransition("ready", "cancelled")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });

  it("rejects any exit from terminal states", () => {
    expect(canTransition("completed", "completed")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });

  it("rejects backward moves (confirmed -> pending)", () => {
    expect(canTransition("confirmed", "pending")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("does not throw on a legal transition", () => {
    expect(() => assertTransition("pending", "confirmed")).not.toThrow();
  });

  it("throws IllegalTransitionError on an illegal transition", () => {
    expect(() => assertTransition("pending", "ready")).toThrow(
      IllegalTransitionError,
    );
  });

  it("carries the attempted from/to on the error", () => {
    try {
      assertTransition("ready", "cancelled");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(IllegalTransitionError);
      expect((err as IllegalTransitionError).from).toBe("ready");
      expect((err as IllegalTransitionError).to).toBe("cancelled");
    }
  });
});

describe("ORDER_ACTION_TARGET", () => {
  it("maps each named action to the status it drives", () => {
    expect(ORDER_ACTION_TARGET).toEqual({
      confirm: "confirmed",
      preparing: "preparing",
      ready: "ready",
      complete: "completed",
      cancel: "cancelled",
    });
  });
});
