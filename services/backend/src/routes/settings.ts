import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb } from "../db/client.ts";
import { settings } from "../db/schema.ts";
import {
  SettingsSchema,
  UpdateSettingsBodySchema,
} from "../contract/orders.ts";
import { ErrorResponseSchema, errorBody } from "../contract/errors.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

function jsonError(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  };
}

const getSettingsRoute = createRoute({
  method: "get",
  path: "/settings",
  operationId: "getSettings",
  summary: "Get restaurant settings",
  tags: ["settings"],
  responses: {
    200: {
      description: "Settings",
      content: { "application/json": { schema: SettingsSchema } },
    },
    404: jsonError("Settings not found"),
  },
});

const updateSettingsRoute = createRoute({
  method: "patch",
  path: "/settings",
  operationId: "updateSettings",
  summary: "Update restaurant settings",
  tags: ["settings"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: UpdateSettingsBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Updated settings",
      content: { "application/json": { schema: SettingsSchema } },
    },
    400: jsonError("Invalid body or an empty update"),
    404: jsonError("Settings not found"),
  },
});

export function registerSettingsRoutes(app: App) {
  app.openapi(getSettingsRoute, async (c) => {
    return withDb(c.env.DATABASE_URL, async (db) => {
      const row = await db.query.settings.findFirst();
      if (!row) {
        return c.json(
          errorBody("SETTINGS_NOT_FOUND", "Settings have not been initialized"),
          404,
        );
      }
      return c.json(row, 200);
    });
  });

  app.openapi(updateSettingsRoute, async (c) => {
    const body = c.req.valid("json");

    // A PATCH with nothing to change is a client error, not a no-op.
    if (Object.keys(body).length === 0) {
      return c.json(
        errorBody("EMPTY_UPDATE", "At least one field must be provided"),
        400,
      );
    }

    return withDb(c.env.DATABASE_URL, async (db) => {
      const existing = await db.query.settings.findFirst();
      if (!existing) {
        return c.json(
          errorBody("SETTINGS_NOT_FOUND", "Settings have not been initialized"),
          404,
        );
      }

      const [updated] = await db
        .update(settings)
        .set(body)
        .where(eq(settings.id, 1))
        .returning();
      return c.json(updated!, 200);
    });
  });
}
