import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Bindings } from "./env.ts";
import { errorBody } from "./contract/errors.ts";
import { registerHealthRoutes } from "./routes/health.ts";
import { registerOrderRoutes } from "./routes/orders.ts";
import { registerCustomerRoutes } from "./routes/customers.ts";
import { registerMenuRoutes } from "./routes/menu.ts";
import { registerStatsRoutes } from "./routes/stats.ts";

/**
 * Builds the OpenAPIHono app. Shared by the Worker runtime entry (index.ts)
 * and the OpenAPI emit script (scripts/generate-openapi.ts) so the served API
 * and the committed contract can never drift.
 */
export function createApp() {
  const app = new OpenAPIHono<{ Bindings: Bindings }>({
    // Turns request schema-validation failures into our typed 400 error shape
    // instead of Hono's default ZodError dump.
    defaultHook: (result, c) => {
      if (!result.success) {
        const details = result.error.issues.map(
          (issue) =>
            `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        );
        return c.json(
          errorBody("VALIDATION_ERROR", "Request validation failed", details),
          400,
        );
      }
    },
  });

  // Dashboard runs on a different origin (Expo web dev server) than the Worker.
  app.use("*", cors());

  registerHealthRoutes(app);
  registerOrderRoutes(app);
  registerCustomerRoutes(app);
  registerMenuRoutes(app);
  registerStatsRoutes(app);

  return app;
}

export const openApiDocConfig = {
  openapi: "3.1.0",
  info: {
    title: "Odyssey API",
    version: "0.0.0",
    description: "Restaurant operations API.",
  },
} as const;

export type AppType = ReturnType<typeof createApp>;
