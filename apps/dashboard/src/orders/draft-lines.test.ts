import { describe, expect, it } from "vitest";
import { addDraftLine, removeDraftLine } from "./draft-lines.ts";

describe("addDraftLine", () => {
  it("appends a new line when menuItemId is not present", () => {
    const result = addDraftLine([], 1, 2);
    expect(result).toEqual([{ menuItemId: 1, quantity: 2 }]);
  });

  it("merges quantity when menuItemId already exists", () => {
    const lines = [{ menuItemId: 1, quantity: 2 }];
    const result = addDraftLine(lines, 1, 3);
    expect(result).toEqual([{ menuItemId: 1, quantity: 5 }]);
  });

  it("does not mutate the original array", () => {
    const lines = [{ menuItemId: 1, quantity: 2 }];
    const result = addDraftLine(lines, 1, 3);
    expect(lines[0]?.quantity).toBe(2);
    expect(result).not.toBe(lines);
  });

  it("leaves other lines untouched when merging", () => {
    const lines = [
      { menuItemId: 1, quantity: 1 },
      { menuItemId: 2, quantity: 4 },
    ];
    const result = addDraftLine(lines, 1, 2);
    expect(result).toEqual([
      { menuItemId: 1, quantity: 3 },
      { menuItemId: 2, quantity: 4 },
    ]);
  });
});

describe("removeDraftLine", () => {
  it("removes the line with the given menuItemId", () => {
    const lines = [
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 2, quantity: 3 },
    ];
    const result = removeDraftLine(lines, 1);
    expect(result).toEqual([{ menuItemId: 2, quantity: 3 }]);
  });

  it("returns an empty array when removing the only line", () => {
    const lines = [{ menuItemId: 1, quantity: 2 }];
    const result = removeDraftLine(lines, 1);
    expect(result).toEqual([]);
  });

  it("returns the same contents when menuItemId is not found", () => {
    const lines = [{ menuItemId: 1, quantity: 2 }];
    const result = removeDraftLine(lines, 99);
    expect(result).toEqual([{ menuItemId: 1, quantity: 2 }]);
  });

  it("does not mutate the original array", () => {
    const lines = [{ menuItemId: 1, quantity: 2 }];
    const result = removeDraftLine(lines, 1);
    expect(lines).toEqual([{ menuItemId: 1, quantity: 2 }]);
    expect(result).not.toBe(lines);
  });
});
