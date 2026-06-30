import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Odyssey data model. Persisted data truth starts here and flows one direction:
 * schema -> drizzle-zod -> OpenAPI -> Orval. Nothing upstream of this file.
 *
 * MONEY RULE: every monetary value is an integer count of cents. Never float,
 * decimal, or numeric. Columns are suffixed `_cents` to make this unmissable.
 */

/* -------------------------------------------------------------------------- */
/* Enums — each defined ONCE here and never re-declared downstream.           */
/* -------------------------------------------------------------------------- */

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export const orderType = pgEnum("order_type", [
  "dine_in",
  "takeaway",
  "delivery",
]);

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  // Controls left-to-right / top-to-bottom ordering in the menu UI.
  displayOrder: integer("display_order").notNull().default(0),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  // Current menu price in cents. Snapshotted onto order_items at order time.
  priceCents: integer("price_cents").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // NOTE: no stored total_spend column by design — customer spend is computed
  // on read by aggregating the customer's orders.
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  status: orderStatus("status").notNull().default("pending"),
  type: orderType("type").notNull(),
  // Order total in cents. The column exists now; it is calculated/verified
  // server-side in a later step — never trusted from the client.
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  // Price captured AT ORDER TIME in cents — a snapshot, not a live lookup of
  // the menu item's current price. Menu prices may change after the order.
  unitPriceCents: integer("unit_price_cents").notNull(),
});

/**
 * Per-day opening hours. `open`/`close` are "HH:MM" 24h strings; both null
 * means the restaurant is closed that day.
 */
export interface OpeningHoursDay {
  open: string | null;
  close: string | null;
}
export type Weekday =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";
export type OpeningHours = Record<Weekday, OpeningHoursDay>;

/**
 * Singleton settings row. Typed columns (NOT key-value). A check constraint
 * pins the primary key to 1 so at most one row can ever exist.
 */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    defaultPrepTimeMinutes: integer("default_prep_time_minutes")
      .notNull()
      .default(15),
    autoAcceptOrders: boolean("auto_accept_orders").notNull().default(false),
    // Master switch for whether the restaurant is currently accepting orders.
    serviceAvailable: boolean("service_available").notNull().default(true),
    openingHours: jsonb("opening_hours").$type<OpeningHours>().notNull(),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));
