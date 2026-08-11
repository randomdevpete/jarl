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
  /** @type {{ render: (path: string) => { html: string }, staticPaths: string[] }} */
  const { render, staticPaths } = await import(entryServerUrl);

  // eslint-disable-next-line no-console
  console.log(`[docs:build] prerendering ${staticPaths.length} routes...`);
  await Promise.all(
    staticPaths.map(async (routePath) => {
      const { html } = render(routePath);
      const page = template.replace("<!--app-html-->", html);
      const outFile = routePath === "/" ? path.join(outDir, "index.html") : path.join(outDir, routePath, "index.html");
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, page, "utf-8");
    }),
  );

  // A 404.html at the root - the convention most static hosts (S3 + CloudFront,
  // GitHub Pages, etc.) use for their "not found" error document.
  const notFoundHtml = render("/__not_found__").html;
  await fs.writeFile(path.join(outDir, "404.html"), template.replace("<!--app-html-->", notFoundHtml), "utf-8");

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
