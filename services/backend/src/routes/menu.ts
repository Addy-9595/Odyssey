import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { asc } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { menuItems } from "../db/schema.ts";
import { MenuItemSchema } from "../contract/orders.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

// Returns ALL menu items, including unavailable ones (each carries its
// `isAvailable` flag). Deliberately NOT filtered: the order form shows
// unavailable items disabled so the server-side unavailable-item rejection
// stays visible and testable through the UI.
const listMenuItemsRoute = createRoute({
  method: "get",
  path: "/menu-items",
  operationId: "listMenuItems",
  summary: "List all menu items (including unavailable ones)",
  tags: ["menu"],
  responses: {
    200: {
      description: "Menu items",
      content: {
        "application/json": { schema: z.array(MenuItemSchema) },
      },
    },
  },
});

export function registerMenuRoutes(app: App) {
  app.openapi(listMenuItemsRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      const rows = await db.query.menuItems.findMany({
        orderBy: [asc(menuItems.categoryId), asc(menuItems.name)],
      });
      return c.json(rows, 200);
    });
  });
}
