import { expect, test } from "@playwright/test";

import { goToPlannerPage, openPlannerMode } from "./helpers/plannerUi";

test.describe("Map View", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlannerPage(page);
    await openPlannerMode(page, "map");
  });

  test("displays zoom controls", async ({ page }) => {
    const zoomIn = page.getByRole("button", { name: /zoom in/i });
    await expect(zoomIn).toBeVisible();

    const zoomOut = page.getByRole("button", { name: /zoom out/i });
    await expect(zoomOut).toBeVisible();
  });

  test("displays Leaflet map when map tab is active", async ({ page }) => {
    const leafletLink = page.getByRole("link", { name: /leaflet/i });
    await expect(leafletLink).toBeVisible();
  });

  test("map tab has correct aria state when active", async ({ page }) => {
    const mapTab = page.getByRole("button", { name: /trip/i });
    await expect(mapTab).toHaveAttribute("aria-pressed", "true");
  });

  test("map displays OpenStreetMap attribution", async ({ page }) => {
    const attribution = page.getByText(/openstreetmap/i);
    await expect(attribution.first()).toBeVisible();
  });

  test("map has zoom in button visible", async ({ page }) => {
    const zoomIn = page.getByRole("button", { name: /zoom in/i });
    await expect(zoomIn).toBeVisible();
  });
});
