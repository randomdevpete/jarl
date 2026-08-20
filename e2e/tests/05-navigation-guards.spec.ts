import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const root = "/navigationGuards";

const answerConfirm = (page: Page, accept: boolean) => {
  page.on("dialog", (dialog) => (accept ? dialog.accept() : dialog.dismiss()));
};

// A blocked traversal never commits, so Playwright's own navigation wait has nothing to resolve
// against: give it a short deadline and let the URL assertion be the real check.
const tryGoBack = (page: Page) => page.goBack({ timeout: 2000 }).catch(() => null);

const startEditing = async (page: Page) => {
  await page.goto(root);
  await page.locator("[data-test=dirty-toggle]").check();
};

test.describe("Navigation guards", () => {
  test("navigates freely while nothing is dirty", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await page.goto(root);

    await page.locator("[data-test=away-link]").click();

    await expect(page).toHaveURL(`${baseURL}${root}/away`);
    await expect(page.locator("[data-test=header]")).toContainText("Away");
  });

  test("blocks a Link click while edits are unsaved", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await startEditing(page);

    await page.locator("[data-test=away-link]").click();

    await expect(page).toHaveURL(`${baseURL}${root}`);
    await expect(page.locator("[data-test=header]")).toContainText("Editor");
    await expect(page.locator("[data-test=dirty-toggle]")).toBeChecked();
  });

  test("follows a Link click once the prompt is accepted", async ({ page, baseURL }) => {
    answerConfirm(page, true);
    await startEditing(page);

    await page.locator("[data-test=away-link]").click();

    await expect(page).toHaveURL(`${baseURL}${root}/away`);
  });

  test("blocks a useNavigate call", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await startEditing(page);

    await page.locator("[data-test=navigate-away]").click();

    await expect(page).toHaveURL(`${baseURL}${root}`);
  });

  test("blocks a history.pushState from outside jarl", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await startEditing(page);

    await page.evaluate((to) => history.pushState(null, "", to), `${root}/away`);

    await expect(page).toHaveURL(`${baseURL}${root}`);
    await expect(page.locator("[data-test=header]")).toContainText("Editor");
  });

  test("follows a history.pushState from outside jarl once accepted", async ({ page, baseURL }) => {
    answerConfirm(page, true);
    await startEditing(page);

    await page.evaluate((to) => history.pushState(null, "", to), `${root}/away`);

    await expect(page).toHaveURL(`${baseURL}${root}/away`);
    await expect(page.locator("[data-test=header]")).toContainText("Away");
  });

  test("blocks the browser's back button", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await page.goto(root);
    await page.locator("[data-test=away-link]").click();
    await expect(page).toHaveURL(`${baseURL}${root}/away`);
    await page.locator("[data-test=dirty-toggle]").check();

    await tryGoBack(page);

    await expect(page).toHaveURL(`${baseURL}${root}/away`);
    await expect(page.locator("[data-test=header]")).toContainText("Away");
  });

  test("goes back once the prompt is accepted", async ({ page, baseURL }) => {
    answerConfirm(page, true);
    await page.goto(root);
    await page.locator("[data-test=away-link]").click();
    await expect(page).toHaveURL(`${baseURL}${root}/away`);
    await page.locator("[data-test=dirty-toggle]").check();

    await page.goBack();

    await expect(page).toHaveURL(`${baseURL}${root}`);
    await expect(page.locator("[data-test=header]")).toContainText("Editor");
  });

  test("blocks the browser's forward button", async ({ page, baseURL }) => {
    answerConfirm(page, false);
    await page.goto(root);
    await page.locator("[data-test=away-link]").click();
    await page.goBack();
    await expect(page).toHaveURL(`${baseURL}${root}`);
    await page.locator("[data-test=dirty-toggle]").check();

    await page.goForward({ timeout: 2000 }).catch(() => null);

    await expect(page).toHaveURL(`${baseURL}${root}`);
  });
});
