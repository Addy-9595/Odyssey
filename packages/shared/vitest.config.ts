import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-logic unit tests only — no DOM, no component rendering.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
