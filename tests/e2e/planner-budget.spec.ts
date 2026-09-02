import { expect, test } from "@playwright/test";

import { goToPlannerPage, openPlannerMode } from "./helpers/plannerUi";

test.describe("Budget Management", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
    await openPlannerMode(page, "budget");
  });

  test("displays budget summary section", async ({ page }) => {
    const summary = page.getByRole("region", { name: /summary/i });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("heading", { name: /total spent/i })).toBeVisible();
    await expect(summary.getByRole("img", { name: /total spent/i })).toBeVisible();
  });

  test("displays expenses table", async ({ page }) => {
    const expensesSection = page.getByRole("region", { name: /expenses/i });
    await expect(expensesSection).toBeVisible();

    await expect(expensesSection.getByRole("table")).toBeVisible();
    await expect(expensesSection.getByRole("columnheader", { name: /description/i })).toBeVisible();
    await expect(expensesSection.getByRole("columnheader", { name: /category/i })).toBeVisible();
    await expect(expensesSection.getByRole("columnheader", { name: /amount/i })).toBeVisible();
    await expect(expensesSection.getByRole("columnheader", { name: /actions/i })).toBeVisible();
  });

  test("adds a new expense", async ({ page }) => {
    const expensesSection = page.getByRole("region", { name: /expenses/i });

    const descriptionInput = expensesSection.getByRole("textbox", { name: /description/i }).first();
    await expect(descriptionInput).toBeVisible();

    await descriptionInput.fill("Hotel");

    const categorySelect = expensesSection.getByRole("combobox", { name: /category/i }).first();
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption("lodging");

    const amountInput = expensesSection.getByRole("textbox", { name: /amount/i }).first();
    await expect(amountInput).toBeVisible();
    await amountInput.fill("200");
    await amountInput.press("Tab");

    const addButton = expensesSection.getByRole("button", { name: /add expense/i });
    await addButton.scrollIntoViewIfNeeded();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(expensesSection.getByRole("rowheader", { name: "Hotel" })).toBeVisible();
    await expect(expensesSection.getByRole("cell", { name: "Lodging", exact: true })).toBeVisible();
  });

  test("has add expense button enabled when amount is filled", async ({ page }) => {
    const expensesSection = page.getByRole("region", { name: /expenses/i });

    const addButton = expensesSection.getByRole("button", { name: /add expense/i });
    const amountInput = expensesSection.getByRole("textbox", { name: /amount/i }).first();

    await amountInput.fill("100");
    await expect(addButton).toBeEnabled();
  });
});
