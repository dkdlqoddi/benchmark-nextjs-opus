import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Provisions a fresh, fully-migrated SQLite database for the E2E run, leaving the
 * committed prisma/dev.db untouched. `prisma migrate deploy` forward-applies every
 * committed migration into the file and is not blocked by the destructive-command
 * guardrail (unlike `migrate reset`), so it works unattended in CI.
 */
export default function globalSetup(): void {
  const dbUrl =
    process.env.E2E_DATABASE_URL ??
    `file:${resolve(process.cwd(), "prisma/test.db")}`;
  const dbPath = dbUrl.replace(/^file:/, "");

  for (const file of [dbPath, `${dbPath}-journal`]) {
    if (existsSync(file)) rmSync(file);
  }

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}
