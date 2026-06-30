import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { PingSchema } from "../contract/ping.ts";

const getPingRoute = createRoute({
  method: "get",
  path: "/ping",
  operationId: "getPing",
  summary: "Health-check ping",
  description:
    "Pipeline-spike endpoint. Returns a single Ping shaped by the " +
    "drizzle-zod-derived contract. No DB access yet.",
  tags: ["ping"],
  responses: {
    200: {
      description: "A ping",
      content: {
        "application/json": {
          schema: PingSchema,
        },
      },
    },
  },
});

export function registerPingRoutes(app: OpenAPIHono) {
  app.openapi(getPingRoute, (c) => {
    // Static for the spike — proves the contract round-trips without a DB.
    return c.json({ id: 1, message: "pong" }, 200);
  });
}
