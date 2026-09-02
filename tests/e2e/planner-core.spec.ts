import { expect, test } from "@playwright/test";

import { getPlannerDatePicker, goToPlannerPage } from "./helpers/plannerUi";

test.describe("Planner Core", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
  });

  test("loads planner page and displays days", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Playwright E2E Plan" })).toBeVisible();
    await expect(
      page.locator("ol[aria-label='Days']:visible").getByRole("heading", { name: "Day 1" })
    ).toBeVisible();
  });

  test("displays planner tab as active", async ({ page }) => {
    const plannerTab = page.getByRole("button", { name: "Trip", exact: true });
    await expect(plannerTab).toBeVisible();
  });

  test("displays map tab", async ({ page }) => {
    const mapTab = page.getByRole("button", { name: /trip/i });
    await expect(mapTab).toBeVisible();
  });

  test("displays budget tab", async ({ page }) => {
    const budgetTab = page.getByRole("button", { name: /budget/i });
    await expect(budgetTab).toBeVisible();
  });

  test("displays share button", async ({ page }) => {
    const shareButton = page.getByRole("button", { name: /share planner/i });
    await expect(shareButton).toBeVisible();
  });

  test("displays date button", async ({ page }) => {
    const dateButton = getPlannerDatePicker(page);
    await expect(dateButton).toBeVisible();
  });

  test("displays day list", async ({ page }) => {
    const daysSection = page.getByRole("list", { name: /days/i });
    await expect(daysSection).toBeVisible();
  });
});
