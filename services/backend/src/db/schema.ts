import { pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * Pipeline-spike table only. This exists solely to prove the
 * Drizzle -> drizzle-zod -> OpenAPI -> Orval chain end to end.
 * The real data model (menu, orders, customers, ...) replaces this in a
 * later build step. Persisted data truth starts here and flows one way.
 */
export const pings = pgTable("pings", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
});
