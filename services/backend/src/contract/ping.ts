import { createSelectSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { pings } from "../db/schema.ts";

/**
 * The Ping response contract is DERIVED from the Drizzle table via drizzle-zod
 * — never hand-written. `@hono/zod-openapi` extends the shared Zod prototype
 * with `.openapi()`, and because the whole workspace resolves to a single Zod
 * v4 instance, the drizzle-zod schema picks that method up. This is exactly the
 * one-direction chain: schema -> drizzle-zod -> OpenAPI metadata.
 */
export const PingSchema = createSelectSchema(pings)
  .openapi("Ping", {
    example: { id: 1, message: "pong" },
  });

export type Ping = z.infer<typeof PingSchema>;
