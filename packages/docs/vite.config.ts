import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { apiReferencePlugin } from "./scripts/apiReferencePlugin.mjs";
import { sourceLinksPlugin } from "./scripts/sourceLinksPlugin.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The repo root two levels up (packages/docs -> packages -> repo root). The docs site
// reads a couple of files directly from there (README.md, CHANGELOG.md) as the single
// source of truth rather than duplicating copies, so the dev server's fs allow-list has
// to be widened to reach them.
const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  root: __dirname,
  plugins: [react(), apiReferencePlugin(), sourceLinksPlugin()],
  resolve: {
    // Same convention as the packages' own vitest/tsconfig setups: resolve the
    // workspace packages to their TypeScript *source*, not their built dist/,
    // so the docs site never builds against a stale bundle or depends on
    // package build order.
    alias: {
      "jarl-atoms": path.resolve(repoRoot, "packages/jarl-atoms/src/index.ts"),
      "jarl-react": path.resolve(repoRoot, "packages/jarl-react/src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [__dirname, repoRoot],
    },
  },
});
