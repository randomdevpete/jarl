import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Timed benchmarks. Run with NODE_ENV=production (the `bench` script does) so
// React and react-router load their production builds; files run one at a
// time, in a forked process with --expose-gc so samples can start GC-clean.
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
