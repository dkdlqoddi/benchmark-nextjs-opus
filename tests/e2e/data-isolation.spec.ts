import { expect, test } from "@playwright/test";
import { createHabit, signUp } from "./helpers";

// Data is scoped per user at the data layer (requireUserId + habit findFirst by
// userId). This proves one account cannot read or reach another account's habit,
// even by navigating straight to its URL.
test("one user cannot see or reach another user's habit", async ({
  browser,
}) => {
  // The owner creates a habit in their own isolated session.
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await signUp(owner, "owner@e2e.test");
  const habitPath = await createHabit(owner, "Owner Secret Habit");
  await ownerContext.close();

  // A different user signs up in a fresh session (own cookies).
  const intruderContext = await browser.newContext();
  const intruder = await intruderContext.newPage();
  await signUp(intruder, "intruder@e2e.test");

  // The intruder's home page is empty — the owner's habit does not leak in.
  await expect(intruder.getByText("No habits yet.")).toBeVisible();
  await expect(intruder.locator("article")).toHaveCount(0);

  // Navigating directly to the owner's habit URL is blocked with a 404.
  const response = await intruder.goto(habitPath);
  expect(response?.status()).toBe(404);
  await expect(intruder.getByText("Owner Secret Habit")).toHaveCount(0);

  await intruderContext.close();
});
