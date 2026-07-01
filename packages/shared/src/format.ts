/**
 * Generic display formatters (en-US). Pure, no API-client dependency, so they
 * live in the design system and are reusable everywhere.
 */

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Integer cents -> "$1,234.56". */
export function formatMoney(cents: number): string {
  return MONEY.format(cents / 100);
}

/** ISO timestamp -> localized "Jun 30, 2026, 7:32 PM". */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
