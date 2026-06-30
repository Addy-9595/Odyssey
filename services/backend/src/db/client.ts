import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema.ts";

/**
 * Two Neon drivers, chosen per use:
 *
 *  - HTTP (createDb): one request per query, lowest overhead. Used by the seed
 *    script and anywhere a plain query is enough. Does NOT support interactive
 *    transactions.
 *  - WebSocket pool (withDb): supports real `tx` transactions, which the
 *    create-order flow requires so an order and its items commit atomically.
 *
 * Neither connects at import time — clients are built lazily by callers, so
 * importing the schema/app for codegen never opens a connection.
 */

export function createDb(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client");
  }
  return drizzleHttp(neon(databaseUrl), { schema });
}

export type Db = ReturnType<typeof createDb>;

export type PoolDb = ReturnType<typeof drizzleServerless<typeof schema>>;

/**
 * Runs `fn` against a transaction-capable pooled client, then always closes
 * the pool. Per-request in the Worker; the create-order handler opens a `tx`
 * inside `fn`.
 */
export async function withDb<T>(
  databaseUrl: string,
  fn: (db: PoolDb) => Promise<T>,
): Promise<T> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const db = drizzleServerless(pool, { schema });
    return await fn(db);
  } finally {
    await pool.end();
  }
}

export { schema };
