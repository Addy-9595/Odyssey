import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { asc, eq } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { categories, menuItems } from "../db/schema.ts";
import {
  CategorySchema,
  MenuItemIdParamSchema,
  MenuItemSchema,
  UpdateMenuItemBodySchema,
} from "../contract/orders.ts";
import { ErrorResponseSchema, errorBody } from "../contract/errors.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

function jsonError(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  };
}

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

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  operationId: "listCategories",
  summary: "List all menu categories in display order",
  tags: ["menu"],
  responses: {
    200: {
      description: "Categories",
      content: {
        "application/json": { schema: z.array(CategorySchema) },
      },
    },
  },
});

const updateMenuItemRoute = createRoute({
  method: "patch",
  path: "/menu-items/{id}",
  operationId: "updateMenuItem",
  summary: "Partially update a menu item",
  tags: ["menu"],
  request: {
    params: MenuItemIdParamSchema,
    body: {
      required: true,
      content: { "application/json": { schema: UpdateMenuItemBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Updated menu item",
      content: { "application/json": { schema: MenuItemSchema } },
    },
    400: jsonError("Invalid id or body, or an empty update"),
    404: jsonError("Menu item not found"),
    422: jsonError("categoryId does not reference an existing category"),
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

  app.openapi(listCategoriesRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      const rows = await db.query.categories.findMany({
        orderBy: asc(categories.displayOrder),
      });
      return c.json(rows, 200);
    });
  });

  app.openapi(updateMenuItemRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    // A PATCH with nothing to change is a client error, not a no-op.
    if (Object.keys(body).length === 0) {
      return c.json(
        errorBody("EMPTY_UPDATE", "At least one field must be provided"),
        400,
      );
    }

    return withDb(c.env.DATABASE_URL, async (db) => {
      const existing = await db.query.menuItems.findFirst({
        where: eq(menuItems.id, id),
      });
      if (!existing) {
        return c.json(
          errorBody("MENU_ITEM_NOT_FOUND", `Menu item ${id} not found`),
          404,
        );
      }

      // If moving the item to a category, that category must exist.
      if (body.categoryId !== undefined) {
        const category = await db.query.categories.findFirst({
          where: eq(categories.id, body.categoryId),
        });
        if (!category) {
          return c.json(
            errorBody(
              "CATEGORY_NOT_FOUND",
              `Category ${body.categoryId} does not exist`,
            ),
            422,
          );
        }
      }

      const [updated] = await db
        .update(menuItems)
        .set(body)
        .where(eq(menuItems.id, id))
        .returning();
      return c.json(updated!, 200);
    });
  });
}
