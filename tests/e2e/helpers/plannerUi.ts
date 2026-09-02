import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { authenticateE2EUser, E2E_USER_SLUG } from "./auth";

type PlannerMode = "planner" | "map" | "budget";

export async function goToUserPlanners(page: Page) {
  await authenticateE2EUser(page);
  await page.goto(`/u/${E2E_USER_SLUG}`);
  await expect(page.getByRole("heading", { name: /your trips/i })).toBeVisible();
}

export async function goToPlannerPage(page: Page, planSlug = "plan-e2e-001") {
  await authenticateE2EUser(page);
  await page.goto(`/p/${planSlug}`);
  await expect(page.getByRole("list", { name: /days/i })).toBeVisible();
}

export async function openPlannerMode(page: Page, mode: PlannerMode) {
  const modeButton = page
    .locator(`[data-testid="planner-mode-${mode === "planner" ? "overview" : mode}"]:visible`)
    .first();
  await expect(modeButton).toBeVisible();

  if ((await modeButton.getAttribute("aria-pressed")) !== "true") {
    await modeButton.click();
  }

  await expect(modeButton).toHaveAttribute("aria-pressed", "true");
  await waitForPlannerMode(page, mode);

  return modeButton;
}

export async function openInlineActivity(page: Page) {
  const addButton = page.getByRole("button", { name: /add activity/i }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  const inlineInput = page.getByRole("dialog").locator("#title");
  await expect(inlineInput).toBeVisible();

  return inlineInput;
}

export async function openShareDialog(page: Page) {
  const shareButton = page.getByRole("button", { name: /share planner/i });
  await expect(shareButton).toBeVisible();
  await shareButton.click();

  const shareDialog = page.getByRole("dialog", { name: /share planner/i });
  await expect(shareDialog).toBeVisible();

  return shareDialog;
}

export async function openPlannerCreationPopover(page: Page) {
  const createButton = page.getByTestId("create-trip-trigger");
  await expect(createButton).toBeVisible();
  await createButton.click();

  const heading = page.getByRole("heading", { name: /create a trip/i });

  return heading;
}

export function getPlannerDatePicker(page: Page) {
  return page.getByTestId("date-picker");
}

async function waitForPlannerMode(page: Page, mode: PlannerMode) {
  if (mode === "planner") {
    await expect(page.getByRole("list", { name: /days/i })).toBeVisible();
    return;
  }

  if (mode === "map") {
    await expect(page.getByRole("button", { name: /zoom in/i }).first()).toBeVisible();
    return;
  }

  await expect(page.getByRole("region", { name: /summary/i })).toBeVisible();
}
