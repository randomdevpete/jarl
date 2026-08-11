import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Runtime deps stay external - this is a library bundle, not an app.
const external = ["jotai", "jotai/vanilla", "jotai-location"];

// Two passes. rolldown-plugin-dts only attaches declaration output to an ESM
// build ("Cannot bundle dts files with cjs format"), so the .d.ts comes out of
// the ESM pass and the CJS pass is bundle-only.
//
// Don't set `entryFileNames` on the dts pass: the plugin derives the
// declaration filename from it, and overriding it makes the plugin emit the
// declarations through the JS pipeline instead (producing a mangled
// `index.mts` full of `var [Type] = [...]` rather than real types). The
// package is `"type": "module"`, so the default `index.js` is already ESM.
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
