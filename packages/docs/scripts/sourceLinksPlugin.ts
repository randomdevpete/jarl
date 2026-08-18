// Regenerates the source-file list `lib/localSource.ts` resolves imports against. Runs at
// build start and again whenever a file is added or removed under src/, mirroring
// apiReferencePlugin.mjs's own regenerate-on-change shape.
import path from "node:path";
import type { Plugin } from "vite";
import { writeSourceFiles } from "./sourceLinks.ts";

const docsRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(docsRoot, "../..");
const srcDir = path.join(docsRoot, "src");
const outputPath = path.join(docsRoot, "src/content/generated/source-files.json");

const regenerate = (): void => {
  writeSourceFiles({ srcDir, repoRoot, outputPath });
};

export const sourceLinksPlugin = (): Plugin => ({
  name: "jarl-source-links",
  buildStart: regenerate,
  configureServer(server) {
    server.watcher.add(srcDir);
    for (const event of ["add", "unlink"] as const) {
      server.watcher.on(event, (file) => {
        if (file.startsWith(srcDir) && /\.tsx?$/.test(file)) regenerate();
      });
    }
  },
});
