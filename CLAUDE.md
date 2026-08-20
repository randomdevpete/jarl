# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Overview

JARL ("JARL: Atomic Routing Library") is a controlled-component router for React, managed as an npm workspaces monorepo. Packages are bundled with rolldown; the demo/docs site is built with Vite.

## Packages

- `packages/jarl-atoms` — framework-agnostic routing atoms (jotai; no React dependency)
- `packages/jarl-react` — React bindings (components + hooks) over `jarl-atoms`
- `packages/docs` — the docs/demo site: a self-contained Vite SSR/SSG build that
  dogfoods the two packages above for its own navigation
- `e2e/` — Playwright suite plus the minimal Vite fixture app it drives. A separate
  npm project (not a workspace) with its own deps: `npm run test:e2e:install` first.
- `e2e/registry-smoke/` — a consumer project that installs both packages from the npm
  registry and uses them unlinked, so the published tarballs get exercised. Also a
  separate npm project; run it after a release, not against working-tree changes.
  `cjs-nodenext/` inside it is the exception: it packs and installs from the working
  tree, to typecheck a `node16`-resolution CommonJS consumer against uncommitted builds.
- `infra/` — AWS CDK app provisioning the hosting for jarl.randomdev.co.uk. Also a separate
  npm project, kept out of the workspaces so it is never published: `infra/README.md`.

A new atom's name says what it returns: `*RouteAtom` if its value is a `RouteAtom`, `*Atom`
otherwise. See `packages/jarl-atoms/DESIGN-NOTES.md`.

The two packages are deliberately separate import paths: `jarl-react` does **not** re-export
`jarl-atoms`. Consumers get route atoms from `jarl-atoms` and the React bindings from
`jarl-react`, so the framework boundary stays visible and `jarl-atoms` is usable on its own.

Each package's `vitest.config.ts` / `tsconfig.json` alias `jarl-atoms` to its TypeScript
**source** rather than its built `dist/`, so tests and typechecks never depend on build order
or run against a stale build.

## Commands

```bash
npm install          # installs and links all workspace packages
npm run build         # build all packages (rolldown) and the docs site (vite SSG)
npm test              # run the root and per-package tests (vitest)
npm run ci-test        # CI test run
npm run lint            # oxlint across the repo
npm run lint:commits    # commitlint over local commit messages
npm run format           # oxfmt across the repo
npm run dev / npm start   # run the docs site's SSR dev server (see Dev ports)
npm run ports             # print this worktree's derived dev port block
npm run typecheck         # tsc over packages/ and scripts/ (e2e and infra typecheck separately)
npm run test:e2e          # Playwright suite (see test:e2e:install)
npm run test:smoke        # published-package smoke test (see test:smoke:install)
npm run release           # semantic-release (needs NPM_TOKEN + GH_TOKEN — CI only)
npm run release:dry-run   # semantic-release --dry-run --no-ci, no credentials needed
```

`jarl-atoms` and `jarl-react` are released together via semantic-release, versioned in
lockstep from Conventional Commits, with major version bumps suppressed (breaking-change
commits produce a minor bump instead) until that's explicitly lifted. Releases are cut by hand, never
by a push: run the CI workflow manually with the `release` input ticked, on `master` for a normal
release (`latest` dist-tag) or on the long-lived `beta` branch for a `2.0.0-beta.N`-style
prerelease under the `beta` dist-tag, so iteration can ship installable builds before committing
to a real `2.0.0`. See
[`docs/release-strategy.md`](./docs/release-strategy.md) for the full mechanism,
rationale, and what CI needs to wire it up.

Linting is via `oxlint` and formatting via `oxfmt` (both part of the Vite+ toolchain) — there is no
separate ESLint/Prettier config. No pre-commit hook is currently wired up (husky/lint-staged were
removed with the rest of the old tooling).

Each package's tests run under Vitest with jsdom (the atoms talk to
`window.location`/`history` via jotai-location, and the bindings render React).

## Dev ports

Ports are derived from the worktree's branch name, never hardcoded — `scripts/devPorts.mts` implements
the scheme. `npm run ports`
prints this worktree's block; `npm run ports -- --write-env` also writes a gitignored `.env.ports`
for anything that can't import the module.

**Offset map** — the only project-specific part:

| offset | service                                                |
| ------ | ------------------------------------------------------ |
| `+0`   | docs site SSR dev server (`npm run dev`)               |
| `+5`   | docs production-build preview (`npm run docs:preview`) |
| `+6`   | Playwright fixture app (`npm run test:e2e`)            |

`+1`–`+4` and `+7`–`+9` are unused. `+0` is served by `packages/docs/scripts/dev-server.mjs` (Vite
in middleware mode, so the port is the script's rather than `vite.config.ts`'s); `+5` comes from
`packages/docs/vite.config.ts`, and `+6` from `e2e/fixture-app/vite.config.ts`, which
`e2e/playwright.config.ts` dials as its `baseURL`.

`packages/docs/src/prod-server.ts` is production rather than dev: it takes `PORT` from the
`jarl-ssr` systemd unit in `infra/lib/jarl-stacks.ts` and refuses to start without it.
## Coding & commenting style

[`docs/coding-style.md`](./docs/coding-style.md) is the binding coding and commenting style guide
for this project — comment types and their rules, hard bans, test/config conventions. Rules live
there once; don't duplicate them here.
