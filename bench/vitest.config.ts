import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Render-count comparison only, so it is deterministic under CI; the timed
// benchmarks are behind vitest.bench.config.ts and `npm run bench`.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    fileParallelism: false,
  },
});
