import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Runtime deps stay external - this is a library bundle, not an app.
const external = ["jotai", "jotai/vanilla", "jotai-location"];

// Three passes: dts plugin refuses `format: "cjs"`, so emit .d.cts via ESM
// with "[name].cjs" entry name (use [name] placeholder or derivation skips).
//
// Don't set `entryFileNames` on the dts pass below: the plugin derives the
// declaration filename from it, and overriding it makes the plugin emit
// declarations through the JS pipeline instead (producing a mangled
// `index.mts` full of `var [Type] = [...]` rather than real types).
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
