import { test, expect } from "@playwright/test";

const root = "/advancedRouting";

// Ported from demo/cypress/integration/02AdvancedRouting.js
test.describe("Advanced Routing", () => {
    test("loads home page", async ({ page }) => {
        await page.goto(root);
        await expect(page).toHaveTitle(/Advanced Routing/);
        await expect(page).toHaveTitle(/Home/);
        await expect(page.locator("[data-test=header]")).toContainText("Home");
        await expect(page.locator("[data-test-demo-link=advancedRouting]")).toHaveAttribute("data-test-active", "true");
    });

    test("defaults to details tab on product page", async ({ page }) => {
        await page.goto(root);
        await page.locator("[data-test=product-link]").click();
        await expect(page.locator("[data-test=details-tab]")).toBeVisible();
        await expect(page.locator("[data-test=details-tab]")).toContainText("Details");
        await expect(page.locator("[data-test=ratings-tab]")).toHaveCount(0);
        await expect(page.locator("[data-test=gallery-tab]")).toHaveCount(0);
    });

    test("navigates to other tabs on product page", async ({ page, baseURL }) => {
        await page.goto(`${root}/product`);

        await page.locator("[data-test=ratings-tab-link]").click();
        await expect(page).toHaveURL(`${baseURL}${root}/product/ratings`);
        await expect(page.locator("[data-test=ratings-tab]")).toBeVisible();
        await expect(page.locator("[data-test=ratings-tab]")).toContainText("Ratings");
        await expect(page.locator("[data-test=image-full-size]")).toHaveCount(0);

        await page.locator("[data-test=gallery-tab-link]").click();
        await expect(page).toHaveURL(`${baseURL}${root}/product/gallery/1`);
        await expect(page.locator("[data-test=gallery-tab]")).toBeVisible();
        await expect(page.locator("[data-test=gallery-tab]")).toContainText("Gallery");
        await expect(page.locator("[data-test=image-full-size]")).toHaveAttribute(
            "src",
            "https://picsum.photos/200/300?image=0",
        );

        await page.locator("[data-test=details-tab-link]").click();
        await expect(page).toHaveURL(`${baseURL}${root}/product`);
        await expect(page.locator("[data-test=details-tab]")).toBeVisible();
        await expect(page.locator("[data-test=details-tab]")).toContainText("Details");
    });

    test("navigates to different pictures in the gallery", async ({ page }) => {
        await page.goto(`${root}/product/gallery/1`);
        for (let n = 2; n <= 10; n += 1) {
            await page.locator(`[data-test=gallery-image-link-${n}]`).click();
            await expect(page.locator("[data-test=image-full-size]")).toHaveAttribute(
                "src",
                `https://picsum.photos/200/300?image=${n - 1}`,
            );
        }
    });

    test("has missing image id for missing image", async ({ page }) => {
        await page.goto(`${root}/product/gallery/11`);
        await expect(page.locator("[data-test=missing-image]")).toContainText("Image id 11 not found!");
    });
});
