import { expect, test } from "@playwright/test";
import { PASSWORD, createHabit, signUp } from "./helpers";

const EMAIL = "flow@e2e.test";

// The core happy path end-to-end: create an account, prove the explicit login
// path works, then create a habit, check in, and see the streak on the stats page.
test("sign up → log out → log in → create habit → check in → view stats", async ({
  page,
}) => {
  // Sign up (auto-logs in and redirects home).
  await signUp(page, EMAIL);
  await expect(
    page.getByRole("heading", { name: "Your Habits" }),
  ).toBeVisible();

  // Log out, then log back in with the same credentials (exercises /login).
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  // Create a habit (defaults to an every-day target).
  await createHabit(page, "Drink Water");
  const card = page.locator("article", { hasText: "Drink Water" });
  await expect(card).toBeVisible();

  // Check in today: the toggle flips its aria-pressed state and label.
  const toggle = card.locator("button[aria-pressed]");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toContainText("Checked in today");

  // View stats: one check-in today on an every-day habit ⇒ a 1-day streak.
  await page.getByRole("link", { name: "Stats" }).click();
  await expect(page).toHaveURL(/\/stats$/);
  const row = page.locator("tr", { hasText: "Drink Water" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("1 day");
});
