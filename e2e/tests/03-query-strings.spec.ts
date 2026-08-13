import { test, expect } from "@playwright/test";

const root = "/queryStrings";

// Ported from demo/cypress/integration/03QueryStrings.js
test.describe("Query Strings", () => {
  test("loads home page", async ({ page }) => {
    await page.goto(root);
    await expect(page).toHaveTitle(/Query Strings/);
    await expect(page).toHaveTitle(/Home/);
    await expect(page.locator("[data-test=header]")).toContainText("Home");
    await expect(page.locator("[data-test=search-text]")).toBeVisible();
    await expect(page.locator("[data-test=search-button]")).toBeVisible();
  });

  test("searches", async ({ page }) => {
    await page.goto(root);
    await page.locator("[data-test=search-text]").fill("foo");
    await page.locator("[data-test=search-button]").click();
    await expect(page).toHaveURL(/\/search\?q=foo/);
    await expect(page.locator("[data-test=header]")).toContainText("Search");
    await expect(page.locator("[data-test=search-results]")).toContainText("foo");
    await expect(page.locator("[data-test=search-text]")).toHaveValue("foo");
  });

  test.describe("themes", () => {
    test("light theme", async ({ page }) => {
      await page.goto(root);
      await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(page.locator("[data-test=header]")).toHaveCSS("color", "rgb(0, 0, 0)");
    });

    test("dark theme", async ({ page }) => {
      await page.goto(`${root}?theme=dark`);
      await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
      await expect(page.locator("[data-test=header]")).toHaveCSS("color", "rgb(255, 255, 255)");
    });

    test("toggles theme", async ({ page }) => {
      await page.goto(root);
      await page.locator("[data-test=theme-link]").click();
      await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
      await expect(page.locator("[data-test=header]")).toHaveCSS("color", "rgb(255, 255, 255)");
    });

    test("toggles theme and preserves location", async ({ page, baseURL }) => {
      await page.goto(`${root}/search?q=hello`);
      await page.locator("[data-test=theme-link]").click();
      await expect(page).toHaveURL(`${baseURL}${root}/search?theme=dark&q=hello`);
      await expect(page.locator("[data-test=search-results]")).toContainText("hello");
      await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
    });
  });
});
