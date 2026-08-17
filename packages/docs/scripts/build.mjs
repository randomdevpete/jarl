// Builds a client bundle, builds a server (SSR) bundle, then prerenders every known
// route to a static .html file using the SSR bundle, so dist/ is plain static files a
// deploy step can upload as-is - no Node server needed to serve them. Also builds the
// jarl-ssr systemd unit's server bundle into dist-ssr/, for the routes that aren't
// prerendered (see "Serving server-rendered routes" in infra/README.md).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(root, "dist");
const ssrOutDir = path.resolve(root, "dist/.ssr-tmp");
const ssrServerOutDir = path.resolve(root, "dist-ssr");

/**
 * An SSR-targeted vite build with a single entry, named `fileName` in `dir`.
 * `selfContained` inlines npm dependencies: the jarl-ssr instance runs dist-ssr/ with no
 * node_modules beside it, so a bare import there is an unstartable server.
 */
const buildSsrBundle = (entry, dir, fileName, { selfContained = false } = {}) =>
  build({
    root,
    // Node builtins stay external either way; noExternal only covers npm packages.
    ssr: selfContained ? { noExternal: true } : {},
    build: {
      outDir: dir,
      emptyOutDir: true,
      // A server bundle read off local disk is never downloaded by a browser.
      chunkSizeWarningLimit: selfContained ? Infinity : 500,
      // Neither SSR bundle serves public/ itself - the client build already copied it into dist/.
      copyPublicDir: false,
      ssr: entry,
      rollupOptions: {
        output: { entryFileNames: fileName },
      },
    },
  });

async function main() {
  // eslint-disable-next-line no-console
  console.log("[docs:build] building client bundle...");
  await build({
    root,
    build: {
      outDir,
      emptyOutDir: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log("[docs:build] building server (SSR) bundle...");
  await buildSsrBundle("src/entry-server.tsx", ssrOutDir, "entry-server.js");

  const templatePath = path.join(outDir, "index.html");
  const template = await fs.readFile(templatePath, "utf-8");

  const entryServerUrl = pathToFileURL(path.join(ssrOutDir, "entry-server.js")).href;
  /** @type {{ render: (path: string) => Promise<{ html: string, head: string, status: number }>, staticPaths: string[] }} */
  const { render, staticPaths } = await import(entryServerUrl);

  // Emotion's extracted <style> markup goes in <head>, so a prerendered page is fully
  // styled from the first paint rather than after hydration.
  const fillTemplate = async (routePath) => {
    const { html, head, status } = await render(routePath);
    return { status, page: template.replace("<!--app-head-->", head).replace("<!--app-html-->", html) };
  };

  // eslint-disable-next-line no-console
  console.log(`[docs:build] prerendering ${staticPaths.length} routes...`);
  await Promise.all(
    staticPaths.map(async (routePath) => {
      const { page, status } = await fillTemplate(routePath);
      // A prerendered path that renders a 404 means staticPaths has drifted from the route table.
      if (status !== 200) {
        throw new Error(`[docs:build] ${routePath} is in staticPaths but rendered a ${status}`);
      }
      const outFile = routePath === "/" ? path.join(outDir, "index.html") : path.join(outDir, routePath, "index.html");
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, page, "utf-8");
    }),
  );

  // A 404.html at the root - the convention most static hosts (S3 + CloudFront,
  // GitHub Pages, etc.) use for their "not found" error document.
  const notFound = await fillTemplate("/__not_found__");
  if (notFound.status !== 404) {
    throw new Error(`[docs:build] the 404 page rendered a ${notFound.status}`);
  }
  await fs.writeFile(path.join(outDir, "404.html"), notFound.page, "utf-8");

  // This SSR bundle is a build-time-only tool; the deployable static output is dist/.
  await fs.rm(ssrOutDir, { recursive: true, force: true });

  // eslint-disable-next-line no-console
  console.log("[docs:build] building SSR server bundle...");
  await buildSsrBundle("src/prod-server.ts", ssrServerOutDir, "server.mjs", { selfContained: true });
  // Node needs the template at runtime, not build time - prod-server.ts reads it off
  // disk next to server.mjs, using the same hashed-asset template every route prerenders
  // from.
  await fs.writeFile(path.join(ssrServerOutDir, "template.html"), template, "utf-8");

  // eslint-disable-next-line no-console
  console.log(`[docs:build] done. Static output in ${path.relative(process.cwd(), outDir)}/`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
