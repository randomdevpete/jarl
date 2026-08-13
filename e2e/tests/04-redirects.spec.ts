import { test, expect } from "@playwright/test";

const root = "/redirects";

// Ported from demo/cypress/integration/04Redirects.js
test.describe("Redirects", () => {
  test("loads home page", async ({ page }) => {
    await page.goto(root);
    await expect(page).toHaveTitle(/Redirects/);
    await expect(page).toHaveTitle(/Landing/);
    await expect(page.locator("[data-test=header]")).toContainText("Landing");
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("no redirect");
  });

  test("redirects from moved page", async ({ page, baseURL }) => {
    await page.goto(root);
    const link = page.locator("[data-test=moved-link]");
    await expect(link).toHaveAttribute("href", "/redirects/moved");
    await link.click();
    await expect(page).toHaveURL(`${baseURL}${root}?because=Permanently%20moved`);
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("Permanently moved");
  });

  test("redirects from admin page", async ({ page, baseURL }) => {
    await page.goto(root);
    const link = page.locator("[data-test=admin-link]");
    await expect(link).toHaveAttribute("href", "/redirects/admin");
    await link.click();
    await expect(page).toHaveURL(`${baseURL}${root}?because=Not%20authorised`);
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("Not authorised");
  });

  test("goes to admin page when authorised", async ({ page, baseURL }) => {
    await page.goto(root);
    const loginButton = page.locator("[data-test=login-button]");
    await expect(loginButton).toContainText("Login");
    await loginButton.click();
    await expect(loginButton).toContainText("Logout");
    await page.locator("[data-test=admin-link]").click();
    await expect(page).toHaveURL(`${baseURL}${root}/admin`);
    await expect(page.locator("[data-test=body]")).toContainText("super secret admin page");
  });

  test("goes to found content page", async ({ page, baseURL }) => {
    await page.goto(root);
    const link = page.locator("[data-test=found-content-link]");
    await expect(link).toHaveAttribute("href", "/redirects/content/about-us");
    await link.click();
    await expect(page).toHaveURL(`${baseURL}${root}/content/about-us`);
    await expect(page.locator("[data-test=body]")).toContainText("a Norse or Danish chief");
  });

  test("redirects to missing content page from landing", async ({ page, baseURL }) => {
    await page.goto(`${root}/content/not-a-real-page`);
    await expect(page).toHaveURL(`${baseURL}${root}?because=Content%20was%20not%20found:%20%27not-a-real-page%27`);
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("Content was not found: 'not-a-real-page'");
  });

  test("redirects to missing content page from link", async ({ page, baseURL }) => {
    await page.goto(root);
    const link = page.locator("[data-test=missing-content-link]");
    await expect(link).toHaveAttribute("href", "/redirects/content/not-a-real-page");
    await link.click();
    await expect(page).toHaveURL(`${baseURL}${root}?because=Content%20was%20not%20found:%20%27not-a-real-page%27`);
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("Content was not found: 'not-a-real-page'");
  });

  test("doesn't crash when visiting missing content after real content (regression)", async ({ page }) => {
    await page.goto(root);
    await page.locator("[data-test=found-content-link]").click();
    await expect(page.locator("[data-test=body]")).toContainText("a Norse or Danish chief");
    await page.locator("[data-test=missing-content-link]").click();
    await expect(page.locator("[data-test=redirect-reason]")).toContainText("Content was not found: 'not-a-real-page'");
  });
});
