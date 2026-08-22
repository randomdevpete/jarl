# Legacy CI/CD: CircleCI + Now (Zeit) — archived reference

This document captures what the pre-v2 CircleCI pipeline and Now (Zeit) deployment
were doing, at the point they were removed in favour of GitHub Actions (#112). It exists so
the new GitHub Actions workflow
(`.github/workflows/ci.yml`) can be checked against it and nothing that mattered
gets silently dropped. The original source files were `.circleci/config.yml` and
`now/now.json` (both deleted by this change) — see git history on `master` prior
to this commit if the raw files are needed again.

## Runtime environment

- Docker image: `cypress/base:8` (Node 8, with Cypress system deps preinstalled).
- Package manager: `yarn` (`yarn.lock` present; `package-lock.json` also present but
  yarn was the CI-driven tool via `yarn bootstrap`/lerna).
- Monorepo managed with **Lerna**; most "run across packages" steps are
  `lerna run <script> --stream`.

## Caching

- CircleCI `restore_cache`/`save_cache` keyed on
  `v5-dependencies-{{ checksum "package.json" }}-{{ checksum "demo/package.json" }}-{{ checksum "packages/jarl-react/package.json" }}-{{ checksum "packages/jarl-react-native/package.json" }}-{{ checksum "packages/jarl-react-redux/package.json" }}`,
  falling back to the latest `v5-dependencies-` cache on miss.
- Cached paths: `node_modules`, `demo/node_modules`,
  `packages/jarl-react/node_modules`, `packages/jarl-react-native/node_modules`,
  `packages/jarl-react-redux/node_modules`.
- There was a commented-out, never-reactivated attempt at Docker layer caching for
  the demo-site image (`v4-dockerlayer-...`) — dead code, not carried forward.

## Workflows (CircleCI `workflows:` block)

Two workflows, both built from the single `build` job (and `publish` only on the
second):

1. **`pr_build`** — runs the `build` job on every branch _except_ `master`
   (i.e. PR/branch validation).
2. **`master_deploy`** — runs `build` then `publish` (requires `build`) only on
   `master` (i.e. deploy pipeline after merge).

## `build` job — CI validation duties

Steps, in order:

1. `checkout`
2. Restore dependency cache (see above).
3. **Setup**: `touch env` (placeholder env file), `yarn`, `yarn bootstrap`
   (lerna bootstrap — links workspace packages together).
4. **Tag detection**: `git describe`, and if it matches `vX.Y.Z` (with optional
   `-prerelease.N` suffix), export `JARL_VERSION` for later steps.
5. Discord notify: `yarn notify build` (posts PR number / version / generic
   "building for staging" message to a Discord webhook, using
   `DISCORD_WEBHOOK_ID`/`DISCORD_WEBHOOK_TOKEN` secrets — see `scripts/notify.js`).
6. Save dependency cache (see above).
7. **Lint**: `yarn lint` (→ `lerna run lint --stream`, ESLint across packages,
   `--max-warnings 0` per-package).
8. **Build**: `yarn build` (→ `node ./scripts/build.js`), with
   `JARL_BUILD_NUMBER=${CIRCLE_BUILD_NUM}` exported first. Builds all packages
   and the demo site.
9. **Unit tests**: `yarn ci-test` (→ `lerna run ci-test --stream`, which in each
   package (`jarl-react`, `jarl-react-native`, `jarl-react-redux`) runs
   `jest --colors`).
10. **E2E — start server**: in `demo/`, `yarn ci-start` (→
    `babel-node ./server/production.js`) run **in the background**.
11. **E2E — run Cypress**: in `demo/`, `yarn ci-cypress` (→
    `cypress run --record --key ${CYPRESS_DASHBOARD} --env JARL_VERSION=...,CIRCLE_BUILD_NUM=...`
    — records to the Cypress Dashboard using the `CYPRESS_DASHBOARD` secret).
12. **E2E — stop server**: in `demo/`, `yarn ci-stop` (→ `pkill -SIGINT JARLDEMO`).
13. Persist build artifacts to the CircleCI workspace for the `publish` job:
    `demo/dist`, `demo/cypress/screenshots`, and the compiled `*.js` output of
    all three packages (CJS + `es/` builds).

## `publish` job — deploy duties (master only, after `build`)

Steps, in order:

1. `checkout`, restore cache, setup (`yarn` + `yarn bootstrap`), re-detect
   `JARL_VERSION` tag, attach the workspace artifacts from `build`.
2. Write an npm auth token file (`~/.npmrc`) from the `NPM_TOKEN` secret.
3. **Publish to npm, only if tagged** (`JARL_VERSION` set): `npm publish` in
   each of `packages/jarl-react`, `packages/jarl-react-native`,
   `packages/jarl-react-redux` (run manually per-package rather than via
   `lerna publish`, because lerna wasn't picking up the auth file), then
   Discord-notify `published`.
4. **Docker**: `setup_remote_docker`, manually install a pinned Docker CLI
   (`17.03.0-ce`) since the Cypress base image didn't have one, then
   `docker build -t app demo` (uses `demo/Dockerfile`, not present in this
   repo checkout — likely lived only inside `demo/`).
5. **Tag and push the Docker image**: `docker login` with
   `DOCKER_USER`/`DOCKER_PASS` secrets, tag as
   `downplay/jarl-demos:${JARL_VERSION}` if tagged, else
   `downplay/jarl-demos:${CIRCLE_SHA1}`, push to Docker Hub, and append a
   `FROM <tag>` line to `now/Dockerfile` (built at CI time, not committed).
6. **Deploy to Now (Zeit) staging**: `yarn global add now`, then from `now/`
   run `now -t ${NOW_TOKEN}` against `now/now.json`
   (`{ "name": "jarl-downplay-co" }`, i.e. deploying the just-built Docker
   image under that Now project name), scrape the resulting deploy URL out of
   `now`'s CLI output, export it as `NOW_DEPLOY`, Discord-notify `staging`
   (posts the staging URL plus a Cypress homepage screenshot).
7. **E2E against staging**: in `demo/`, `yarn ci-cypress` again, this time
   with `CYPRESS_baseUrl=${NOW_DEPLOY}` — smoke-tests the actual deployed
   staging instance rather than the local server.
8. **Alias to production, only if tagged**: `now -t ${NOW_TOKEN} alias
${NOW_DEPLOY} jarl.downplay.co` — promotes the staging deploy to the
   production alias, then Discord-notifies `deployed`.

## Secrets/env vars referenced (CircleCI project settings, not in-repo)

- `DISCORD_WEBHOOK_ID`, `DISCORD_WEBHOOK_TOKEN` — build/deploy notifications
  to Discord (`scripts/notify.js`).
- `CYPRESS_DASHBOARD` — Cypress Dashboard recording key.
- `NPM_TOKEN` — publish packages to the npm registry.
- `DOCKER_USER`, `DOCKER_PASS` — Docker Hub credentials.
- `NOW_TOKEN` — Now (Zeit) deploy token.
- CircleCI-provided: `CIRCLE_BUILD_NUM`, `CIRCLE_BUILD_URL`, `CIRCLE_SHA1`,
  `CIRCLE_COMMIT`, `CIRCLE_PULL_REQUEST`.

## Environments

- **PR/branch builds** (`pr_build` workflow): build + lint + unit test + local
  E2E only, no deploy.
- **`master` builds** (`master_deploy` workflow): everything above, plus
  Docker image build/push, deploy to a Now "staging" URL, E2E re-run against
  that staging URL, and (only on a version-tagged commit) promotion of that
  staging deploy to the production alias `jarl.downplay.co`, plus npm package
  publish.
- There was no separate persistent "staging" environment — every `master`
  build got its own ephemeral Now deployment URL, tested, then optionally
  aliased to production.

## What's carried forward vs. explicitly deferred

Carried forward into `.github/workflows/ci.yml` (ticket 60):

- checkout, Node setup, install, build, unit tests as an always-on job.
- an e2e job invoking a conventional `npm run test:e2e` script (the actual
  Playwright suite is being ported by ticket 57 in parallel; this job is
  `continue-on-error` for now, see the workflow comments).

Explicitly **not** re-implemented yet (left as placeholders/comments in the
new workflow, or simply dropped as no-longer-relevant):

- **Deployment** — the target service is undecided (probably AWS, as a
  subdomain of the randomdev business site; see ticket 58 for the site build
  and ticket 60/50 for the decision). The workflow has a clearly-marked
  placeholder job for this.
- **Now (Zeit) itself** — the service jarl.downplay.co was aliased to is
  being retired outright, not replaced 1:1.
- **Docker Hub publish of the demo site image** — superseded by whatever the
  new deploy target turns out to be; not carried forward.
- **npm package publish on tagged builds** — out of scope for this ticket;
  can be re-added as its own workflow/job once the v2 package boundaries
  (tickets 51/52/54/55/56) have settled. (Re-added, but not tag-triggered —
  ticket 106 wires a `release` job into `ci.yml` that runs on every push to
  master and lets `semantic-release` itself decide, from Conventional
  Commits, whether and what to publish and tag. See
  `docs/release-strategy.md`.)
- **Discord build/deploy notifications** — cosmetic, not CI-critical; can be
  re-added later if wanted.
- **Cypress Dashboard recording** — Cypress itself is being replaced by
  Playwright (ticket 57); no direct equivalent set up yet.
- **Dependency caching** — GitHub Actions' own `actions/setup-node` cache
  (keyed on the lockfile) is the intended equivalent once ticket 51 settles
  the package manager/lockfile story; not hand-rolled in this pass.

## Why the new workflow is expected to fail for a while

The new GitHub Actions workflow calls the _conventional_ v2 scripts
(`npm run build`, `npm test`, `npm run test:e2e`) that several sibling
tickets are introducing in parallel (51 tooling, 52 TypeScript conversion,
54 atoms core, 55 bindings, 57 Playwright e2e). Until those land on `master`,
those scripts may not exist yet or may fail — that's expected and by design,
not a regression to fix here. **No branch-protection required check should
be added for this workflow yet** (that's a repository setting, out of scope
for this PR anyway) — turning the whole pipeline green is the milestone that
marks the v2 rewrite as substantially complete.
