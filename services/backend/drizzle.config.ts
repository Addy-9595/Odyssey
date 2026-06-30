import { defineConfig } from "drizzle-kit";

// Loads the repo-root .env so DATABASE_URL is available to drizzle-kit
// (generate reads only the schema; migrate/push connect to Neon).
// Resolved from cwd — package scripts run with cwd = services/backend.
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), "../../.env") });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
