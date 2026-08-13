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

## What this does not cover

TypeScript consumers using `moduleResolution: node16`/`nodenext` from a CommonJS package
cannot import either package: both ship a single ESM-flavoured `dist/index.d.ts` for the
`require` condition too, which TypeScript rejects with TS1479. The `require` call itself
works at runtime (`cjs-smoke.cjs` proves it) — only the types are unusable. Fixing it means
emitting a `dist/index.d.cts` and pointing the `require` condition's `types` at it.
