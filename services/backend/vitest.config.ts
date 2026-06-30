import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-logic unit tests only — no DB, no environment setup.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
