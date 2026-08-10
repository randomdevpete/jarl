import { test, expect } from "@playwright/test";

const root = "/queryStrings";

// Ported from demo/cypress/integration/03QueryStrings.js
//
// Most of this suite needs query (search) param support. The atoms have it
// (`queryAtom`, landed with ticket 56), but this fixture's QueryStrings page
// was written before that and is still a static shell, so the scenarios below
// are blocked on fixture work rather than on the library. Kept as faithful
// test.fixme() bodies
// so they're ready to flip on once that support lands.
test.describe("Query Strings", () => {
    test("loads home page", async ({ page }) => {
        await page.goto(root);
        await expect(page).toHaveTitle(/Query Strings/);
        await expect(page).toHaveTitle(/Home/);
        await expect(page.locator("[data-test=header]")).toContainText("Home");
        await expect(page.locator("[data-test=search-text]")).toBeVisible();
        await expect(page.locator("[data-test=search-button]")).toBeVisible();
    });

    // Blocked on the fixture app, not the library: `queryAtom` landed with
    // ticket 56, but this fixture's QueryStrings page is still a static shell.
    test.fixme("searches", async ({ page }) => {
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

        // Blocked on the fixture app, not the library: needs the QueryStrings
        // page wired to `queryAtom` for ?theme=.
        test.fixme("dark theme", async ({ page }) => {
            await page.goto(`${root}?theme=dark`);
            await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
            await expect(page.locator("[data-test=header]")).toHaveCSS("color", "rgb(255, 255, 255)");
        });

        // Blocked on fixture wiring (`queryAtom` exists): theme toggling needs query-string-aware
        // navigation.
        test.fixme("toggles theme", async ({ page }) => {
            await page.goto(root);
            await page.locator("[data-test=theme-link]").click();
            await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
            await expect(page.locator("[data-test=header]")).toHaveCSS("color", "rgb(255, 255, 255)");
        });

        // Blocked on fixture wiring (`queryAtom` exists): toggling theme while preserving other query
        // params needs query-string support.
        test.fixme("toggles theme and preserves location", async ({ page, baseURL }) => {
            await page.goto(`${root}/search?q=hello`);
            await page.locator("[data-test=theme-link]").click();
            await expect(page).toHaveURL(`${baseURL}${root}/search?theme=dark&q=hello`);
            await expect(page.locator("[data-test=search-results]")).toContainText("hello");
            await expect(page.locator("[data-test=page]")).toHaveCSS("background-color", "rgb(0, 0, 0)");
        });
    });
});
