import { expect, type Page } from "@playwright/test";

/** Shared password for E2E accounts (satisfies the 8-char signup minimum). */
export const PASSWORD = "password123";

/** Signs up a brand-new account through the UI; signup auto-logs-in and lands home. */
export async function signUp(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
}

/**
 * Creates a habit from the home page (name only; other fields use their defaults)
 * and returns the habit's detail path, e.g. "/habits/<id>".
 */
export async function createHabit(page: Page, name: string): Promise<string> {
  await page.getByRole("link", { name: "New habit" }).click();
  await expect(page).toHaveURL(/\/habits\/new$/);
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create habit" }).click();
  await expect(page).toHaveURL("/");

  const link = page.locator('a[href^="/habits/"]', { hasText: name });
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`No detail link found for habit "${name}".`);
  return href;
}
