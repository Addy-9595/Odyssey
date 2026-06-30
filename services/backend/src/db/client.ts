import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";

/**
 * Builds a Drizzle client over Neon's HTTP driver. Created lazily by callers
 * (seed script now; route handlers later) — never instantiated at import time,
 * so importing the schema/app for codegen never opens a DB connection.
 *
 * The connection string comes from the environment: process.env.DATABASE_URL
 * in Node (seed), or the Worker's bound DATABASE_URL secret at runtime.
 */
export function createDb(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };
