import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The atoms core reads/writes location via jotai-location's
    // atomWithLocation(), which talks to window.location/history — jsdom
    // gives that a real (if fake) browser environment to run against.
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
