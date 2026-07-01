import { defineConfig } from "vitest/config";

// NOTE: .mjs (not .ts) on purpose. The dashboard package is CommonJS (no
// "type":"module", as Expo expects), so a .ts config would be require()'d and
// fail on ESM `vite` (ERR_REQUIRE_ESM). An .mjs config is unambiguously ESM.
export default defineConfig({
  test: {
    // Pure-logic unit tests only (label-map coverage) — no DOM, no
    // component rendering, no jsdom.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
