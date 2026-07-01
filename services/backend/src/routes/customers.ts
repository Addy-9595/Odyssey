import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { asc } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { customers } from "../db/schema.ts";
import { CustomerSchema } from "../contract/orders.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

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

export function registerCustomerRoutes(app: App) {
  app.openapi(listCustomersRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      const rows = await db.query.customers.findMany({
        orderBy: asc(customers.name),
      });
      return c.json(rows, 200);
    });
  });
}
