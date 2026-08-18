import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Parity/render-count comparison only (deterministic, CI-safe). The timed
// benchmarks live behind vitest.bench.config.ts and `npm run bench`.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    fileParallelism: false,
  },
});
