/**
 * Pure operations over the local order-draft line list. Kept out of the
 * component so the merge/remove rules are unit-testable and can't drift.
 *
 * A DraftLine stores ONLY what the create body needs (menuItemId + quantity);
 * display fields (name, price) are resolved from the fetched menu list so there
 * is a single source for item data and the request body can never carry a
 * price or a total.
 */
export interface DraftLine {
  menuItemId: number;
  quantity: number;
}

/** Add a line or merge quantity into an existing line with the same menuItemId. */
export function addDraftLine(
  lines: DraftLine[],
  menuItemId: number,
  quantity: number,
): DraftLine[] {
  const existing = lines.find((l) => l.menuItemId === menuItemId);
  if (existing) {
    return lines.map((l) =>
      l.menuItemId === menuItemId
        ? { ...l, quantity: l.quantity + quantity }
        : l,
    );
  }
  return [...lines, { menuItemId, quantity }];
}

/** Remove all lines with the given menuItemId. */
export function removeDraftLine(
  lines: DraftLine[],
  menuItemId: number,
): DraftLine[] {
  return lines.filter((l) => l.menuItemId !== menuItemId);
}
