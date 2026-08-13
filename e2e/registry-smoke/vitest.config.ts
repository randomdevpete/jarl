import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setup.ts"],
    // jsdom startup dominates the first test's runtime on a cold machine.
    testTimeout: 20000,
  },
});
