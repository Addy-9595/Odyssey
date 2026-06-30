import { createApp, openApiDocConfig } from "./app.ts";

const app = createApp();

// Live spec endpoint (handy in the browser). The COMMITTED contract that Orval
// reads is emitted by scripts/generate-openapi.ts from this same app.
app.doc("/openapi.json", openApiDocConfig);

// Cloudflare Workers entry.
export default app;
