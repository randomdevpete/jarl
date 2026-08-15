// Custom SSG build (ticket 58): builds a client bundle, builds a server (SSR) bundle,
// then prerenders every known route to a static .html file using the SSR bundle, so
// the final output in dist/ is plain static files a later deploy step (ticket 60's
// GitHub Actions workflow) can upload as-is - no Node server needed at runtime.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(root, "dist");
const ssrOutDir = path.resolve(root, "dist/.ssr-tmp");

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
  await build({
    root,
    build: {
      outDir: ssrOutDir,
      emptyOutDir: true,
      ssr: "src/entry-server.tsx",
      rollupOptions: {
        output: { entryFileNames: "entry-server.js" },
      },
    },
  });

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

  // The SSR bundle is a build-time-only tool; the deployable output is dist/ (static
  // files only).
  await fs.rm(ssrOutDir, { recursive: true, force: true });

  // eslint-disable-next-line no-console
  console.log(`[docs:build] done. Static output in ${path.relative(process.cwd(), outDir)}/`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
