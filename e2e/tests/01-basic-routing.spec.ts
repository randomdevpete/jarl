import { test, expect } from "@playwright/test";

const root = "/basicRouting";

// Ported from demo/cypress/integration/01BasicRouting.js
test.describe("Basic Routing", () => {
  test("loads home page", async ({ page }) => {
    await page.goto(root);
    await expect(page).toHaveTitle(/Basic Routing/);
    await expect(page).toHaveTitle(/Home/);
    await expect(page.locator("[data-test=header]")).toContainText("Home");
    await expect(page.locator("[data-test=code]")).toContainText('import { routing } from "jarl-react";');
  });

  test("loads about page", async ({ page }) => {
    await page.goto(`${root}/about`);
    await expect(page).toHaveTitle(/About/);
    await expect(page.locator("[data-test=header]")).toContainText("About");
  });

  test("trigger 404 page", async ({ page }) => {
    await page.goto(`${root}/foo/bar`);
    await expect(page).toHaveTitle(/404/);
    await expect(page.locator("[data-test=header]")).toContainText("404");
    await expect(page.locator("[data-test=mordor]")).toContainText("foo/bar");
  });

  test("navigate to about page", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=about-link]").click();
    await expect(page.locator("[data-test=header]")).toContainText("About");
  });

  test("navigate back again", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=about-link]").click();
    await page.locator("[data-test=home-link]").click();
    await expect(page.locator("[data-test=header]")).toContainText("Home");
  });

  test("navigate with browser back button", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=about-link]").click();
    await page.goBack();
    await expect(page.locator("[data-test=header]")).toContainText("Home");
  });

  test("navigate with browser forward button", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=about-link]").click();
    await page.goBack();
    await page.goForward();
    await expect(page.locator("[data-test=header]")).toContainText("About");
  });

  test("sets some transient state", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=marker-button]").click();
    await expect(page.locator("[data-test=marker]")).toBeVisible();
  });

  test("clicking anchor reloads page", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=marker-button]").click();
    await page.locator("[data-test=marker-anchor]").click();
    await expect(page.locator("[data-test=marker]")).toHaveCount(0);
  });

  // Was blocked on the draft v2 <Link> never calling event.preventDefault()
  // (so the browser performed its own full navigation on the anchor, which
  // is exactly what this test rules out). Ticket 55's useLink hook fixes
  // that, and this branch now stacks on top of it - so this passes.
  test("clicking Link doesn't reload page", async ({ page }) => {
    await page.goto(`${root}/`);
    await page.locator("[data-test=marker-button]").click();
    await page.locator("[data-test=about-link]").click();
    // Marker should still exist as state should have been retained
    await expect(page.locator("[data-test=marker]")).toBeVisible();
  });
});
