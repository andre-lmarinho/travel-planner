import { expect, test } from "@playwright/test";

import { goToPlannerPage, openShareDialog } from "./helpers/plannerUi";

test.describe("Planner Members", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
  });

  test("opens share dialog when share button is clicked", async ({ page }) => {
    const shareDialog = await openShareDialog(page);
    await expect(shareDialog.first()).toBeVisible();
  });

  test("share dialog contains members section", async ({ page }) => {
    const shareDialog = await openShareDialog(page);
    await expect(shareDialog).toBeVisible();

    // Check for members-related content in the dialog
    const membersContent = shareDialog.getByText(/member|invite/i);
    await expect(membersContent.first()).toBeVisible();
  });

  test("share dialog contains invite form", async ({ page }) => {
    const shareDialog = await openShareDialog(page);

    const emailInput = shareDialog.getByRole("textbox", { name: /email/i });
    await expect(emailInput.first()).toBeVisible();
  });

  test("share dialog has close button", async ({ page }) => {
    const shareDialog = await openShareDialog(page);

    const closeButton = shareDialog.getByRole("button", { name: /close/i });
    await expect(closeButton.first()).toBeVisible();
  });

  test("can close share dialog", async ({ page }) => {
    const shareDialog = await openShareDialog(page);
    await expect(shareDialog.first()).toBeVisible();

    const closeButton = shareDialog.getByRole("button", { name: /close/i }).first();
    await closeButton.click();

    await expect(shareDialog.first()).not.toBeVisible();
  });
  test("invites a member and shows the new member", async ({ page }) => {
    const shareDialog = await openShareDialog(page);
    const emailInput = shareDialog.getByRole("textbox", { name: /email/i });

    await emailInput.fill("new-member@example.com");
    await shareDialog.getByRole("button", { name: "Share", exact: true }).click();

    await expect(shareDialog.getByText("Member added.")).toBeVisible();
    await expect(shareDialog.getByText("new-member", { exact: true })).toBeVisible();
  });
});
