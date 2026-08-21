# Registry smoke test

A throwaway consumer project that installs `jarl-atoms` and `jarl-react` **as a real npm
dependency** — a `file:` tarball, not a workspace link or path alias — and uses them the way a
third party would. It exercises the actual packed artifacts: the bundled `dist/`, the `exports`
map, the emitted `.d.ts`, and the dependency ranges npm resolves from the manifest.

```bash
npm run test:smoke:install   # builds packages/{jarl-atoms,jarl-react} and packs them here
npm run test:smoke
```

`npm test` here runs three checks in order:

1. **`typecheck`** — `tsc` over the consumer sources with `skipLibCheck` off, so the
   packed declaration files are themselves typechecked.
2. **`test:entrypoints`** — `esm-smoke.mjs` and `cjs-smoke.cjs` load both packages through
   real Node resolution (not Vite's), asserting the full export list is present and that
   route matching works with no DOM.
3. **`test:unit`** — a jsdom app covering routing, link reversal, click and programmatic
   navigation, query params, redirects, `asyncRouteAtom` and server rendering from a seeded
   location.

## Tracking source renames (ticket 823)

Until 2026-08-21 this project installed `jarl-atoms`/`jarl-react` **from the npm registry at
`latest`**, on a job wired to `workflow_dispatch` only — never a PR. That tests the *published*
package, which is the point, but it meant a source rename (`resolvedAtom` removed by ticket 675,
five atoms gaining a `Route` suffix by ticket 789) went unnoticed here: the test kept passing
against whatever was already on the registry and would only have broken in a job nobody watches,
the moment the next release republished.

Three ways to close that were on the table:

1. update this project in lockstep with every source rename — it then tests the *next* release
   rather than the current one, and still can't fail until someone remembers to touch it;
2. pin to an explicit `jarl-atoms`/`jarl-react` version, so a mismatch is at least legible when
   someone looks;
3. run it on every PR against a **locally-packed tarball** of this branch, so drift is caught the
   moment it's introduced.

(3) is what's implemented, via `pack-local.mjs` and the `registry-smoke` CI job running
unconditionally alongside `build-and-test` (see `.github/workflows/ci.yml`) rather than only on
manual dispatch. **What this trades away**: the job no longer proves the currently-published npm
tarball works end-to-end — a botched `npm publish`, a stale `files`/`exports` entry that only a
real publish would expose, can't be caught this way. What it buys back: the build this job packs
uses the same `files`/`main`/`exports`/`types` fields and the same `dist/` a release would ship,
so it catches everything short of the publish step itself, and it catches it on every PR rather
than after a release ships broken.

To point it at a real published version instead — e.g. to actually smoke-test a release —
override the dependency after install:

```bash
npm --prefix e2e/registry-smoke install jarl-atoms@2.7.0 jarl-react@2.7.0
```

`pack-local.mjs` packs both packages from the working tree and installs the tarballs here.
Repeat runs must remove the previously-extracted `node_modules/` copies and `package-lock.json`
first — npm treats an unchanged `file:` dependency spec as satisfied and won't re-read a
same-named tarball whose contents changed. (The script does this itself.)

## CommonJS consumer under `node16`/`nodenext` resolution

`cjs-nodenext/` type-checks a CommonJS consumer against `dist/index.d.cts` — the
declaration file the `require` condition's `types` points at — under
`moduleResolution: node16` (the only setting that actually raises TS1479 for a
masquerading-as-ESM package; `nodenext` resolves the same files but the compiler's
own gate for that diagnostic excludes it). It uses the same locally-packed-tarball
approach as the rest of this project, via its own `pack-local.mjs`:

```bash
npm run build --workspace packages/jarl-atoms --workspace packages/jarl-react
npm --prefix e2e/registry-smoke run test:cjs-nodenext
```
