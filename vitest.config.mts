import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The unit suite exercises pure library/schema modules only (no React, no DB),
// so a Node environment is enough. The "@/…" alias mirrors tsconfig `paths` so
// modules like lib/habit-schema (which imports "@/lib/colors") resolve here too.
const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    // Only the Vitest unit tests; Playwright specs (tests/e2e/*.spec.ts) are run
    // by `npm run test:e2e` and must not be picked up here.
    include: ["tests/unit/**/*.test.ts"],
  },
});
