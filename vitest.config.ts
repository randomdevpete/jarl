import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The workspace packages run their own vitest configs (jsdom, their own aliases); this one
    // covers only the repo-root tooling in scripts/.
    include: ["scripts/**/__tests__/**/*.test.mts"],
  },
});
