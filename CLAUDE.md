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
- `e2e/registry-smoke/` — a consumer project that installs both packages as a real npm
  dependency, unlinked from the workspace — `pack-local.mjs` packs them from the working
  tree and installs the tarballs, so it exercises the same `dist`/`exports`/`.d.ts` a
  release would ship, on every PR (see its README, "Tracking source renames"). Also a
  separate npm project. `cjs-nodenext/` inside it does the same pack-and-install, to
  typecheck a `node16`-resolution CommonJS consumer.
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
npm test              # run each package's tests (vitest)
npm run ci-test        # CI test run
npm run lint            # oxlint across the repo
npm run format           # oxfmt across the repo
npm run dev / npm start   # run the docs site's Vite dev server
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

## Coding & commenting style

`<root>/TODOS/CODING-STYLE.md` is the binding coding and commenting style guide for this project — comment types and their rules, hard bans, test/config conventions. Rules live there once; don't duplicate them here.

## TODOs

Active and completed tasks for this project are tracked as tickets in `<root>/TODOS/board/` (filename-prefixed `jarl-*`; `<root>` is the repos root, one level above TODOS - resolve it fresh, don't hardcode it). When adding a TODO comment or TODO.md here, turn it into a ticket there instead.
