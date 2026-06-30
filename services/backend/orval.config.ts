import { defineConfig } from "orval";

/**
 * Orval reads the committed openapi.json (emitted from the Hono app) and
 * generates React Query hooks + types into @odyssey/api-client. Generated
 * files are never hand-edited. Every hook routes through the customInstance
 * fetch wrapper (see fetch-client.ts) so the app has no raw fetch and no axios.
 *
 * mode "split" -> odyssey.ts (hooks) + odyssey.schemas.ts (types).
 */
export default defineConfig({
  odyssey: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "split",
      target: "../../packages/api-client/src/generated/odyssey.ts",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "../../packages/api-client/src/fetch-client.ts",
          name: "customInstance",
        },
        fetch: {
          // Return the parsed body (T) from hooks, not { data, status, headers }.
          includeHttpResponseReturnType: false,
        },
        // No global query override: let Orval pick per method — GET -> useQuery,
        // POST/action endpoints -> useMutation.
      },
    },
  },
});
