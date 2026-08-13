import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Runtime/peer deps stay external - this is a library bundle, not an app.
const external = ["react", "react/jsx-runtime", "jotai", "jarl-atoms"];

// Same three-pass shape as jarl-atoms (see packages/jarl-atoms/rolldown.config.js
// for why the third pass is ESM-format with a `.cjs` entry name).
export default defineConfig([
  {
    input: "src/index.ts",
    external,
    plugins: [dts()],
    output: { dir: "dist", format: "es" },
  },
  {
    input: "src/index.ts",
    external,
    output: { dir: "dist", format: "cjs", entryFileNames: "index.cjs", exports: "named" },
  },
  {
    input: "src/index.ts",
    external,
    plugins: [dts({ emitDtsOnly: true })],
    output: { dir: "dist", format: "es", entryFileNames: "[name].cjs" },
  },
]);
