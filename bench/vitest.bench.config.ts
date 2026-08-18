import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Timed benchmarks. Needs NODE_ENV=production (the `bench` script sets it) for the
// libraries' production builds, and a serial forked process with --expose-gc.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["src/**/*.benchmark.{ts,tsx}"],
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
    execArgv: ["--expose-gc"],
    testTimeout: 300_000,
  },
});
