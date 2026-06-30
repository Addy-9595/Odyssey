import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { registerPingRoutes } from "./routes/ping.ts";

/**
 * Builds the OpenAPIHono app. Shared by the Worker runtime entry (index.ts)
 * and the OpenAPI emit script (scripts/generate-openapi.ts) so the served API
 * and the committed contract can never drift.
 */
export function createApp() {
  const app = new OpenAPIHono();

  // Dashboard runs on a different origin (Expo web dev server) than the Worker.
  app.use("*", cors());

  registerPingRoutes(app);

  return app;
}

export const openApiDocConfig = {
  openapi: "3.1.0",
  info: {
    title: "Odyssey API",
    version: "0.0.0",
    description: "Restaurant operations API — pipeline spike.",
  },
} as const;

export type AppType = ReturnType<typeof createApp>;
