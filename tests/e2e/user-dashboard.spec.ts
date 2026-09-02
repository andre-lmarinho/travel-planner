import { expect, test } from "@playwright/test";

import { goToUserPlanners, openPlannerCreationPopover } from "./helpers/plannerUi";

test.describe("User dashboard", () => {
  test("loads planners and creates a new planner", async ({ page }) => {
    await goToUserPlanners(page);

    await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Playwright E2E Plan" })).toBeVisible();

    await openPlannerCreationPopover(page);

    await page.getByPlaceholder("Destination").fill("Paris");
    await page.getByTestId("create-trip-submit").click();

    await expect(page).toHaveURL(/\/p\/plan-e2e-001/);
  });

  test("renders the travel map section", async ({ page }) => {
    await goToUserPlanners(page);

    await expect(page.getByRole("heading", { name: "Your travel map" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  });
});
