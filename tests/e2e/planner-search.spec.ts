import { expect, test } from "@playwright/test";

import {
  goToPlannerPage,
  goToUserPlanners,
  openInlineActivity,
  openPlannerCreationPopover,
} from "./helpers/plannerUi";

test.describe("Search & Autocomplete", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
  });

  test("displays destination search on create planner page", async ({ page }) => {
    await goToUserPlanners(page);

    await openPlannerCreationPopover(page);

    const destinationInput = page.getByPlaceholder("Destination");
    await expect(destinationInput).toBeVisible();
  });

  test("can type in destination search", async ({ page }) => {
    await goToUserPlanners(page);

    await openPlannerCreationPopover(page);

    const destinationInput = page.getByPlaceholder("Destination");
    await destinationInput.fill("Tokyo");

    await expect(destinationInput).toHaveValue("Tokyo");
  });

  test("create planner dialog has destination field", async ({ page }) => {
    await goToUserPlanners(page);
    await openPlannerCreationPopover(page);

    await expect(page.getByRole("heading", { name: /create a trip/i })).toBeVisible();
    const destinationInput = page.getByPlaceholder("Destination");
    await expect(destinationInput).toBeVisible();
  });

  test("start planning button exists", async ({ page }) => {
    await goToUserPlanners(page);
    await openPlannerCreationPopover(page);

    const startButton = page.getByRole("button", { name: /create trip/i });
    await expect(startButton).toBeVisible();
  });

  test("inline activity search shows input when adding", async ({ page }) => {
    const searchInput = await openInlineActivity(page);
    await expect(searchInput).toBeVisible();

    await searchInput.fill("Museum");
    await expect(searchInput).toHaveValue("Museum");
  });
});
