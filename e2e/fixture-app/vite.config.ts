import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const atomsPackageJson = JSON.parse(
    readFileSync(path.resolve(dirname, "../../packages/jarl-atoms/package.json"), "utf-8"),
);

// This is a minimal Vite app that exists purely as a Playwright test fixture
// for ticket 57 (port e2e tests to Playwright). It renders the real v2
// packages - route atoms from packages/jarl-atoms, bindings from
// packages/jarl-react - against pages that mirror the structure of the old
// Cypress demo suites. It is NOT the real jarl-react demo/docs site; that is
// ticket 58.
export default defineConfig({
    root: dirname,
    plugins: [react()],
    resolve: {
        alias: {
            // Resolve both workspace packages to their TypeScript source, so
            // the fixture exercises the source in this commit rather than a
            // possibly-stale dist/ build.
            "jarl-atoms": path.resolve(dirname, "../../packages/jarl-atoms/src"),
            "jarl-react": path.resolve(dirname, "../../packages/jarl-react/src"),
            // Those packages resolve their own dependencies from the repo
            // root, so their bare imports of
            // "react"/"jotai"/"jotai-location" need to be pointed at this
            // fixture app's copies. This also guarantees a single React and
            // a single jotai instance is loaded, which matters: two copies
            // of either would break hooks/atoms silently.
            react: path.resolve(dirname, "../node_modules/react"),
            "react-dom": path.resolve(dirname, "../node_modules/react-dom"),
            jotai: path.resolve(dirname, "../node_modules/jotai"),
            "jotai-location": path.resolve(dirname, "../node_modules/jotai-location"),
        },
    },
    define: {
        __JARL_VERSION__: JSON.stringify(atomsPackageJson.version),
    },
    server: {
        port: 4173,
        strictPort: true,
    },
    preview: {
        port: 4173,
        strictPort: true,
    },
});
