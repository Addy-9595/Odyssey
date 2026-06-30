import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createApp, openApiDocConfig } from "../src/app.ts";

/**
 * Emits a committed openapi.json from the live Hono app. This is the chosen
 * approach: Hono is the single source of the contract, the spec is a build
 * artifact (committed for reproducible Orval runs), and it is never hand-edited.
 */
const app = createApp();
const doc = app.getOpenAPIDocument(openApiDocConfig);

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "openapi.json",
);

writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
console.log(`Wrote ${outPath}`);
