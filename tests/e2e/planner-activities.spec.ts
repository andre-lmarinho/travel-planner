import { expect, test } from "@playwright/test";

import { goToPlannerPage, openInlineActivity } from "./helpers/plannerUi";

test.describe("Planner Activities", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
  });

  test("displays add activity button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add activity/i }).first();
    await expect(addButton).toBeVisible();
  });

  test("displays inline activity input when add button is clicked", async ({ page }) => {
    const inlineInput = await openInlineActivity(page);
    await expect(inlineInput).toBeVisible();
  });

  test("cancels activity creation by clicking cancel button", async ({ page }) => {
    const inlineInput = await openInlineActivity(page);
    await expect(inlineInput).toBeVisible();

    const cancelButton = page.getByRole("button", { name: /cancel/i }).first();
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    await expect(inlineInput).not.toBeVisible();
  });

  test("has action buttons when adding activity", async ({ page }) => {
    await openInlineActivity(page);

    const cancelButton = page.getByRole("button", { name: /cancel/i }).first();
    await expect(cancelButton).toBeVisible();

    const saveButton = page.getByRole("button", { name: /done/i }).first();
    await expect(saveButton).toBeVisible();
  });
});
