import { expect, test } from "@playwright/test";

test.describe("Auth", () => {
  test("shows username taken message on blur", async ({ page }) => {
    await page.route("**/api/profile/availability*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ available: false }),
      });
    });

    await page.goto("/");

    await page.getByRole("textbox", { name: "Username" }).fill("e2e-owner");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/profile/availability") && response.request().method() === "GET"
      ),
      page.getByRole("textbox", { name: "Email" }).click(),
    ]);

    await expect(page.getByText("Username already taken.")).toBeVisible();
  });
});
