import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve the sibling workspace package to its TypeScript source rather
      // than its built `dist/`. Without this, running these tests would first
      // require `npm run build` in jarl-atoms (its package.json "exports"
      // point at dist/), and the tests would then exercise a build that may be
      // stale relative to the source in the same commit.
      "jarl-atoms": fileURLToPath(new URL("../jarl-atoms/src/index.ts", import.meta.url)),
    },
  },
  test: {
    // The atoms read/write location via jotai-location's atomWithLocation(),
    // which talks to window.location/history — jsdom gives that a real (if
    // fake) browser environment to run against.
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
  },
});
