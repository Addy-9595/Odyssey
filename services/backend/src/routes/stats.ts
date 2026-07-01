import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { count, desc, eq, sum } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { menuItems, orderItems, orders, orderStatus } from "../db/schema.ts";
import { OrderListItemSchema } from "../contract/orders.ts";
import type { OrderStatus } from "../domain/order-transitions.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

/* -------------------------------------------------------------------------- */
/* Response schema (registered as OpenAPI components)                          */
/* -------------------------------------------------------------------------- */

// Per-status counts. Keys are built from the order_status pgEnum (single
// source) so the shape can never drift from the database enum.
const OrdersByStatusSchema = z
  .object(
    Object.fromEntries(
      orderStatus.enumValues.map((status) => [status, z.number().int()]),
    ),
  )
  .openapi("OrdersByStatus");

const PopularItemSchema = z
  .object({
    name: z.string(),
    totalQuantity: z.number().int(),
  })
  .openapi("PopularItem");

const DashboardStatsSchema = z
  .object({
    totalOrders: z.number().int(),
    totalRevenueCents: z.number().int(),
    ordersByStatus: OrdersByStatusSchema,
    // Reuses the existing list-row shape — recent orders are ordinary list
    // items (no allowedActions; that belongs to OrderDetail).
    recentOrders: z.array(OrderListItemSchema),
    popularItems: z.array(PopularItemSchema),
  })
  .openapi("DashboardStats");

const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  operationId: "getDashboardStats",
  summary: "Dashboard overview statistics",
  tags: ["dashboard"],
  responses: {
    200: {
      description: "Dashboard statistics",
      content: { "application/json": { schema: DashboardStatsSchema } },
    },
  },
});

/* -------------------------------------------------------------------------- */
/* Registration                                                               */
/* -------------------------------------------------------------------------- */

export function registerStatsRoutes(app: App) {
  app.openapi(getStatsRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      // Totals — a single aggregate row, not a scan. SUM is null when there
      // are no orders, so default to 0.
      const [totals] = await db
        .select({
          totalOrders: count(),
          totalRevenueCents: sum(orders.totalCents),
        })
        .from(orders);

      // Counts per status. Initialized from enumValues so EVERY status key is
      // present (even at zero); the grouped query only returns non-empty ones.
      const ordersByStatus = Object.fromEntries(
        orderStatus.enumValues.map((status) => [status, 0]),
      ) as Record<OrderStatus, number>;
      const statusRows = await db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .groupBy(orders.status);
      for (const row of statusRows) {
        ordersByStatus[row.status] = Number(row.count);
      }

      // Latest 5 orders with their customer — same shape as listOrders rows.
      const recentOrders = await db.query.orders.findMany({
        with: { customer: true },
        orderBy: desc(orders.createdAt),
        limit: 5,
      });

      // Top 5 menu items by total quantity ordered.
      const quantitySum = sum(orderItems.quantity);
      const popularRows = await db
        .select({ name: menuItems.name, totalQuantity: quantitySum })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .groupBy(menuItems.id, menuItems.name)
        .orderBy(desc(quantitySum))
        .limit(5);

      return c.json(
        {
          totalOrders: Number(totals?.totalOrders ?? 0),
          totalRevenueCents: Number(totals?.totalRevenueCents ?? 0),
          ordersByStatus,
          recentOrders,
          popularItems: popularRows.map((r) => ({
            name: r.name,
            totalQuantity: Number(r.totalQuantity ?? 0),
          })),
        },
        200,
      );
    });
  });
}
