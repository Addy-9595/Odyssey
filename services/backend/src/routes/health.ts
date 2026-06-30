import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";

/**
 * Static service health check. Touches no table and contains no business logic
 * — it exists so the contract chain (OpenAPI -> Orval -> hook) has a stable,
 * dependency-free endpoint to generate from while the domain routes are built
 * in a later step. Replaces the throwaway /ping spike route.
 */
const HealthSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("Health", { example: { status: "ok" } });

const getHealthRoute = createRoute({
  method: "get",
  path: "/health",
  operationId: "getHealth",
  summary: "Service health check",
  tags: ["system"],
  responses: {
    200: {
      description: "Service is up",
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono) {
  app.openapi(getHealthRoute, (c) => c.json({ status: "ok" as const }, 200));
}
