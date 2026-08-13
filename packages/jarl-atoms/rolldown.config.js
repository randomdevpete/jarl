import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Runtime deps stay external - this is a library bundle, not an app.
const external = ["jotai", "jotai/vanilla", "jotai-location"];

// Three passes. rolldown-plugin-dts refuses to bundle declarations into a
// `format: "cjs"` output ("Cannot bundle dts files with cjs format"), so the
// CJS-flavoured declaration file is produced by an ESM-format pass instead:
// `entryFileNames: "[name].cjs"` makes the plugin's own filename derivation
// (which maps `[name].js` -> `[name].d.ts`) land on `[name].d.cts`, and
// `emitDtsOnly` drops the accompanying JS chunk this pass would otherwise
// also emit. Keep the `[name]` placeholder in the template - a literal
// filename here (e.g. "index.cjs") skips the plugin's `.d.` insertion and
// produces a bare `index.cts`.
//
// Don't set `entryFileNames` on the main dts pass below: the plugin derives
// the declaration filename from it, and overriding it makes the plugin emit
// the declarations through the JS pipeline instead (producing a mangled
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
  {
    input: "src/index.ts",
    external,
    plugins: [dts({ emitDtsOnly: true })],
    output: { dir: "dist", format: "es", entryFileNames: "[name].cjs" },
  },
]);
