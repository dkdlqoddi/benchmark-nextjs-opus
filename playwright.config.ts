import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

// A dedicated port so the E2E server never collides with a running `next dev`.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// The E2E run uses a throwaway SQLite database (absolute path so the Prisma CLI
// in global-setup and the server's Prisma client resolve the exact same file)
// and never touches the committed prisma/dev.db. global-setup reads this too.
const TEST_DB_URL = `file:${resolve(process.cwd(), "prisma/test.db")}`;
process.env.E2E_DATABASE_URL = TEST_DB_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // Tests share one SQLite database, so run them serially to avoid write locks.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    // Headless is the default; set explicitly so CI and local runs behave alike.
    headless: true,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    // Build then serve the production app against the test database. `next build`
    // outputs to .next and `next start` serves it, independent of any `next dev`.
    command: `npm run build && npm run start -- -p ${PORT} -H 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
    // process.env is inherited; this overrides DATABASE_URL for the server so it
    // talks to the migrated test DB rather than the .env dev database.
    env: { DATABASE_URL: TEST_DB_URL },
  },
});
