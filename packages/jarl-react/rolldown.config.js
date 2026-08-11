import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Runtime/peer deps stay external - this is a library bundle, not an app.
const external = ["react", "react/jsx-runtime", "jotai", "jarl-atoms"];

// Same two-pass shape as jarl-atoms: rolldown-plugin-dts only attaches
// declaration output to an ESM build, and the dts pass must not set
// `entryFileNames` (see packages/jarl-atoms/rolldown.config.js for why).
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
]);
