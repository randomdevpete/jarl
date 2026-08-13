# Registry smoke test

A throwaway consumer project that installs `jarl-atoms` and `jarl-react` **from the npm
registry** and uses them the way a third party would. Nothing here resolves to
`packages/*` — no workspace link, no path alias — so it is the only test in this repo that
exercises the actual published tarballs: the bundled `dist/`, the `exports` map, the
emitted `.d.ts`, and the dependency ranges npm resolves from the manifest.

Run it after a release; it says nothing useful about uncommitted work.

```bash
npm run test:smoke:install   # from the repo root, once per version under test
npm run test:smoke
```

`npm test` here runs three checks in order:

1. **`typecheck`** — `tsc` over the consumer sources with `skipLibCheck` off, so the
   published declaration files are themselves typechecked.
2. **`test:entrypoints`** — `esm-smoke.mjs` and `cjs-smoke.cjs` load both packages through
   real Node resolution (not Vite's), asserting the full export list is present and that
   route matching works with no DOM.
3. **`test:unit`** — a jsdom app covering routing, link reversal, click and programmatic
   navigation, query params, redirects, `resolvedAtom` and server rendering from a seeded
   location.

## Versions under test

Both packages are declared as `latest` and the lockfile is gitignored, so `npm install`
always fetches whatever is currently published. To pin a specific version instead:

```bash
npm --prefix e2e/registry-smoke install jarl-atoms@2.0.1 jarl-react@2.0.1
```

## CommonJS consumer under `node16`/`nodenext` resolution

`cjs-nodenext/` type-checks a CommonJS consumer against `dist/index.d.cts` — the
declaration file the `require` condition's `types` points at — under
`moduleResolution: node16` (the only setting that actually raises TS1479 for a
masquerading-as-ESM package; `nodenext` resolves the same files but the compiler's
own gate for that diagnostic excludes it).

It runs against **local tarballs**, not the registry: this check exists to catch
regressions before a release, so it must work against uncommitted `dist/` output,
and separately the registry can carry a broken version of either package.

```bash
npm run build --workspace packages/jarl-atoms --workspace packages/jarl-react
npm --prefix e2e/registry-smoke run test:cjs-nodenext
```

`cjs-nodenext/pack-local.mjs` packs both packages from the working tree and installs
the tarballs here. Repeat runs must remove the previously-extracted `node_modules/`
copies and `package-lock.json` first — npm treats an unchanged `file:` dependency
spec as satisfied and won't re-read a same-named tarball whose contents changed.
