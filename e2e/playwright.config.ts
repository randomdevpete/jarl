import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for ticket 57 (port e2e tests to Playwright).
 *
 * `webServer` builds and serves a minimal Vite "fixture app"
 * (fixture-app/) that renders the draft v2 route atoms
 * (packages/jarl-atoms + packages/jarl-react)
 * against pages that mirror the old Cypress demo suites
 * (demo/cypress/integration/*.js on master). It is a test fixture, not the
 * real jarl-react demo/docs site (that's ticket 58).
 *
 * Chromium-only for now, per ticket 57's guidance - add more browsers once
 * the suite is closer to green.
 *
 * Decision on 05CodeSplitting.js: dropped, not ported. It was already fully
 * commented out on master (blocked historically by
 * https://github.com/randomdevpete/jarl/issues/17, an unrelated webpack
 * build problem) and code splitting isn't yet a stated goal of the v2
 * rewrite. Revisit as a new ticket if/when v2 grows a code-splitting story.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
