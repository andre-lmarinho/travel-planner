import { expect, test } from "@playwright/test";

test.describe("Auth", () => {
  test("shows username taken message on blur", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("textbox", { name: "Username" }).fill("e2e-owner");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/trpc/public.profile.availability") && response.status() === 200
      ),
      page.getByRole("textbox", { name: "Email" }).click(),
    ]);

    await expect(page.getByText("Username already taken.")).toBeVisible();
  });
});
