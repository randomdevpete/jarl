// Regenerates the API reference markdown the /api pages import, from the doc comments in
// each package's source. Runs at build start and again whenever a package source file
// changes in dev, so the reference can never drift from the code it documents.
import path from "node:path";
import { writeApiReference } from "./apiReference.mjs";

const DOCUMENTED_PACKAGES = ["jarl-atoms", "jarl-react"];

const docsRoot = path.resolve(import.meta.dirname, "..");
const packagesRoot = path.resolve(docsRoot, "..");

// Output is gitignored; src/content/generated/ is reconstructed by this plugin.
const targets = DOCUMENTED_PACKAGES.map((packageName) => ({
  sourceDir: path.join(packagesRoot, packageName, "src"),
  entryPoint: path.join(packagesRoot, packageName, "src/index.ts"),
  tsconfigPath: path.join(packagesRoot, packageName, "tsconfig.json"),
  outputPath: path.join(docsRoot, "src/content/generated", `api-${packageName}.md`),
}));

const regenerate = () => targets.forEach((target) => writeApiReference(target));

export const apiReferencePlugin = () => ({
  name: "jarl-api-reference",
  buildStart: regenerate,
  configureServer(server) {
    for (const { sourceDir } of targets) server.watcher.add(sourceDir);
    for (const event of ["add", "change", "unlink"]) {
      server.watcher.on(event, (file) => {
        if (targets.some((target) => file.startsWith(target.sourceDir))) regenerate();
      });
    }
  },
});
