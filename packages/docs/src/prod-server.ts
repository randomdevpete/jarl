// Runtime entry point the jarl-ssr systemd unit runs in production — see the unit
// definition in infra/lib/jarl-stacks.ts. Built to dist-ssr/server.mjs by
// scripts/build.mjs, alongside a template.html captured from the same build.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "./entry-server";

const port = Number(process.env.PORT) || 3000;
const template = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "template.html"), "utf-8");

/** Matches `ssrPathPattern` in infra/lib/jarl-stacks.ts: CloudFront forwards the whole /ssr/* request. */
const ssrPrefix = "/ssr";

const server = createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (!url.startsWith(ssrPrefix)) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const { html, head, status } = await render(url.slice(ssrPrefix.length) || "/");
    res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
    res.end(template.replace("<!--app-head-->", head).replace("<!--app-html-->", html));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`jarl SSR server listening on :${port}`);
});
