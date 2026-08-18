// Router cost on the wire: each size entry is bundled with rolldown (minified,
// NODE_ENV=production, react/react-dom external) and reported min + gzip.
// Both routers are bundled from their published dist builds, i.e. what an npm
// consumer actually ships.
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";

const entry = (name: string) => fileURLToPath(new URL(`./size/${name}`, import.meta.url));

const reactExternals = [/^react($|\/)/, /^react-dom($|\/)/, /^scheduler($|\/)/];

const bundleSize = async (input: string, external: RegExp[]) => {
  const bundle = await rolldown({
    input,
    external,
    transform: { define: { "process.env.NODE_ENV": '"production"' } },
  });
  const { output } = await bundle.generate({ format: "esm", minify: true });
  const code = output
    .filter((chunk) => chunk.type === "chunk")
    .map((chunk) => chunk.code)
    .join("");
  await bundle.close();
  return { min: Buffer.byteLength(code), gzip: gzipSync(Buffer.from(code), { level: 9 }).byteLength };
};

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;

test("bundle size (min / min+gzip), react and react-dom external", async () => {
  const jarl = await bundleSize(entry("jarl-entry.tsx"), reactExternals);
  const jarlExternalJotai = await bundleSize(entry("jarl-entry.tsx"), [...reactExternals, /^jotai($|\/)/]);
  const reactRouter = await bundleSize(entry("react-router-entry.tsx"), reactExternals);

  console.log("\nBundle size of a minimal routed app (router code only, react/react-dom external):");
  console.log(`  jarl (jarl-atoms + jarl-react + jotai + jotai-location)   min ${kb(jarl.min)}  gzip ${kb(jarl.gzip)}`);
  console.log(
    `  jarl, app already using jotai (jotai external)            min ${kb(jarlExternalJotai.min)}  gzip ${kb(jarlExternalJotai.gzip)}`,
  );
  console.log(
    `  react-router                                              min ${kb(reactRouter.min)}  gzip ${kb(reactRouter.gzip)}`,
  );

  expect(jarl.min).toBeGreaterThan(0);
  expect(reactRouter.min).toBeGreaterThan(0);
});
