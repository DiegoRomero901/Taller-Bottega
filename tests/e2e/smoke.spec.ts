import { expect, test } from "@playwright/test";

test("anonymous visitors are sent to the login page", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Taller Bottega" })).toBeVisible();
});

test("a malformed tracking link shows a friendly not-found page", async ({ page }) => {
  // The page streams, so the 404 arrives inside the stream rather than as the HTTP status.
  await page.goto("/o/not-a-real-token");
  await expect(page.getByRole("heading", { name: "No encontramos esta orden" })).toBeVisible();
});

test("the public page never asks for a login", async ({ page }) => {
  await page.goto("/o/not-a-real-token");
  await expect(page).not.toHaveURL(/\/login/);
});
