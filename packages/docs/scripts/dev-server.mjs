// Minimal custom SSR dev server (no framework, per ticket 58's stack decision - see
// PR description). Uses Vite's own dev server in middleware mode for module
// transforms/HMR, and a plain Node http server for the SSR render + HTML fallback.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 4321;

async function main() {
    const vite = await createViteServer({
        root,
        server: { middlewareMode: true },
        appType: "custom",
    });

    const server = http.createServer((req, res) => {
        vite.middlewares(req, res, async () => {
            const url = req.url || "/";
            try {
                let template = await fs.readFile(path.resolve(root, "index.html"), "utf-8");
                template = await vite.transformIndexHtml(url, template);
                const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
                const { html } = render(url);
                const page = template.replace("<!--app-html-->", html);
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                res.end(page);
            } catch (error) {
                vite.ssrFixStacktrace(error);
                // eslint-disable-next-line no-console
                console.error(error);
                res.statusCode = 500;
                res.end(error instanceof Error ? error.stack : String(error));
            }
        });
    });

    server.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`JARL docs dev server running at http://localhost:${port}`);
    });
}

main();
