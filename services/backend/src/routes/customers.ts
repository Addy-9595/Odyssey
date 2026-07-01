import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { customers, orders } from "../db/schema.ts";
import {
  CustomerDetailSchema,
  CustomerIdParamSchema,
  CustomerSchema,
} from "../contract/orders.ts";
import { ErrorResponseSchema, errorBody } from "../contract/errors.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

function jsonError(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  };
}

const listCustomersRoute = createRoute({
  method: "get",
  path: "/customers",
  operationId: "listCustomers",
  summary: "List all customers",
  tags: ["customers"],
  responses: {
    200: {
      description: "Customers",
      content: {
        "application/json": { schema: z.array(CustomerSchema) },
      },
    },
  },
});

const getCustomerRoute = createRoute({
  method: "get",
  path: "/customers/{id}",
  operationId: "getCustomer",
  summary: "Get a customer with computed spend and order history",
  tags: ["customers"],
  request: { params: CustomerIdParamSchema },
  responses: {
    200: {
      description: "Customer detail",
      content: { "application/json": { schema: CustomerDetailSchema } },
    },
    400: jsonError("Invalid id"),
    404: jsonError("Customer not found"),
  },
});

export function registerCustomerRoutes(app: App) {
  app.openapi(listCustomersRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      const rows = await db.query.customers.findMany({
        orderBy: asc(customers.name),
      });
      return c.json(rows, 200);
    });
  });

  app.openapi(getCustomerRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, id),
      });
      if (!customer) {
        return c.json(
          errorBody("CUSTOMER_NOT_FOUND", `Customer ${id} not found`),
          404,
        );
      }

      // Spend + count COMPUTED ON READ (no stored total_spend column). SUM is
      // null on an empty set, so coalesce to 0; scope is all orders.
      const [totals] = await db
        .select({
          totalSpendCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
          orderCount: sql<number>`count(${orders.id})`,
        })
        .from(orders)
        .where(eq(orders.customerId, id));

      // Order history — newest first, same relational shape as listOrders rows.
      const history = await db.query.orders.findMany({
        where: eq(orders.customerId, id),
        with: { customer: true },
        orderBy: desc(orders.createdAt),
      });

      return c.json(
        {
          ...customer,
          totalSpendCents: Number(totals?.totalSpendCents ?? 0),
          orderCount: Number(totals?.orderCount ?? 0),
          orders: history,
        },
        200,
      );
    });
  });
}
