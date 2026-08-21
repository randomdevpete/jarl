# jarl-react-docs

The docs & demo site for JARL. Self-contained Vite SSR/SSG build (see the "Stack
decision" section of PR for ticket 58) - not wired into the root Lerna/npm pipeline, on
purpose, to avoid conflicting with the several other tickets converting the rest of
this repo to TypeScript / new tooling at the same time. Install and run it from inside
this directory.

## Commands

Run from `packages/docs/`:

```
npm install
npm run docs:dev      # custom SSR dev server (Vite in middleware mode), on this worktree's `+0` port
npm run docs:build    # produces a static, deployable build in dist/
npm run docs:preview  # serve the built dist/ output locally, on this worktree's `+5` port
npm run typecheck     # tsc --noEmit
```

Or from the repo root: `npm run docs:build --prefix packages/docs`.

Both servers derive their port from the worktree's branch name rather than taking a fixed one —
`npm run ports` at the repo root prints this worktree's block, and the root `CLAUDE.md` has the
offset map.

`docs:build` is the command a later deploy step (ticket 60's GitHub Actions workflow)
should run and then upload the contents of `dist/` as-is to static hosting - every page
is prerendered to a real `.html` file (see `scripts/build.mjs`), there is no Node
server to run at request time. `dist/404.html` is written for hosts that support a
static not-found document (S3 + CloudFront, etc).

## Structure

* `src/router/` - a small SSR-safe router built on `jotai` atoms, vendored and adapted
  from the jarl-react-v2 draft (commit `44f8439`). See the comment at the top of
  `src/router/routeAtom.ts` for why it's vendored here rather than importing
  `packages/jarl-react-v2` directly, and the [/history](src/content/history.md) page
  for the full design writeup.
* `src/router/routes.ts` - the site's own route table, defined with those atoms. Both
  the top-level site navigation and the `/demos/basic-routing` live demo dogfood this
  router.
* `src/pages/` - one component per page (Home, Docs, Api, Changelog, History, Demos).
* `src/content/` - hand-written markdown (History, guides, and the orientation section
  of each API page). `Home` and `Changelog` instead import the repo's root
  `README.md`/`CHANGELOG.md` directly (via Vite's `?raw` imports) as a single source of
  truth, and `Docs` similarly imports the existing guide markdown from
  `demo/source/docs/guides/`.
* `src/content/generated/` - the API reference itself, generated from the doc comments
  in `packages/jarl-atoms` and `packages/jarl-react`. Gitignored and rebuilt on every
  `docs:build`, and on every source change while `docs:dev` is running.
* `src/entry-client.tsx` / `src/entry-server.tsx` - hydration and SSR render entry
  points.
* `scripts/dev-server.mjs` / `scripts/build.mjs` - the custom SSR dev server and SSG
  build script (plain Node + Vite's JS API, no framework).
* `scripts/apiReference.mjs` / `scripts/apiReferencePlugin.mjs` - the API reference
  generator and the Vite plugin that runs it.
