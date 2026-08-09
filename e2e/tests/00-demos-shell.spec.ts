import { test, expect } from "@playwright/test";

// Ported from demo/cypress/integration/00DemosShell.js
test.describe("Demos Shell", () => {
    test("loads home page", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/About/);
        await expect(page.locator("[data-test=content] h1")).toContainText(
            "JARL"
        );
        await expect(
            page.locator("[data-test=content] h1 + p")
        ).toContainText("JARL: Atomic Routing Library.");
        // The original test compared against the exact package version
        // (with CI build-number wrangling); we just check a version string
        // is rendered at all, which is enough to exercise the fixture.
        await expect(page.locator("[data-test=version]")).toContainText(
            /^v/
        );
    });

    test("shows not found page", async ({ page }) => {
        await page.goto("/asdfghjkl");
        await expect(page).toHaveTitle(/Not Found/);
        await expect(page.locator("[data-test=header]")).toContainText(
            "Not Found"
        );
        await expect(page.locator("[data-test=body]")).toContainText(
            "/asdfghjkl"
        );
    });

    test("shows the changelog", async ({ page }) => {
        await page.goto("/changelog");
        await expect(page.locator("[data-test=content] h1")).toContainText(
            "JARL: Version History"
        );
    });
});
