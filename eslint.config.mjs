import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/**
 * One root flat config for the whole monorepo. Each package runs `eslint .`,
 * which walks up to this file. Rules are file-glob-scoped per package.
 *
 * Type-aware: typescript-eslint `recommendedTypeChecked` with `projectService`,
 * so each package's own tsconfig is picked up automatically (no hand-maintained
 * `project` array).
 */
export default tseslint.config(
  // ---- Global ignores -----------------------------------------------------
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/web-build/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/.wrangler/**",
      "**/coverage/**",
      // drizzle-kit generated migrations + journal
      "services/backend/drizzle/**",
      // GENERATED API client output — editing it is banned, so never lint it.
      // Scoped to src/generated ONLY; the rest of api-client is hand-written
      // and IS linted.
      "packages/api-client/src/generated/**",
    ],
  },

  // ---- Base: JS recommended + type-checked TS -----------------------------
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Type-aware service, rooted at the repo so each package tsconfig is used.
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ---- Per-package environments -------------------------------------------
  // Backend: Cloudflare Workers + Node.
  {
    files: ["services/backend/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.serviceworker },
    },
  },
  // Dashboard, shared, and the hand-written api-client: browser/RNW runtime.
  {
    files: [
      "apps/dashboard/**/*.{ts,tsx}",
      "packages/shared/**/*.{ts,tsx}",
      "packages/api-client/**/*.ts",
    ],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // ---- React hooks (React packages only) ----------------------------------
  // Minimum set per the plan: rules-of-hooks + exhaustive-deps. NOT the v7
  // `recommended-latest` bundle (that adds ~15 experimental React-Compiler
  // rules — out of scope for this pass).
  {
    files: ["apps/dashboard/**/*.{ts,tsx}", "packages/shared/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ---- Files not covered by any tsconfig -----------------------------------
  // ESM config files (eslint.config.mjs, etc.): disable type-aware rules and
  // the project service so they don't error for being outside a tsconfig.
  {
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
  },
  // CommonJS config files (metro.config.js, babel.config.js). require() is the
  // correct module system here, so no-require-imports does not apply.
  {
    files: ["**/*.{js,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // TS config files (vitest.config.ts, orval.config.ts, drizzle.config.ts):
  // some are outside their package tsconfig, so drop the project service and
  // type-aware rules for the config-file glob.
  {
    files: ["**/*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
  },
);
