# Release strategy: semantic-release with suppressed majors ("romantic versioning")

This documents the versioning/release strategy for the two publishable packages,
`jarl-atoms` and `jarl-react` (`packages/docs` is `"private": true` and never published).
It replaces the old CircleCI/lerna/manual-tag-and-`npm publish` flow described in
[`docs/legacy-ci.md`](./legacy-ci.md); that flow's publish step was explicitly deferred
when CI moved to GitHub Actions and is what this ticket finally replaces.

See `.releaserc.json` at the repo root for the actual config this document explains.

## Chosen approach: semantic-release, lockstep-versioned, root-level config

**semantic-release**, per the author's stated preference, computing versions from
[Conventional Commits](https://www.conventionalcommits.org/) on `master`. Both
packages are released **in lockstep**: one semantic-release run, one computed version
number, applied to both `packages/jarl-atoms/package.json` and
`packages/jarl-react/package.json` at once, tagged once (`vX.Y.Z`) and published
together.

Concretely, `.releaserc.json` runs a single shared pipeline:

1. `@semantic-release/commit-analyzer` (custom `releaseRules`, see below) — decides
   whether this release is a `patch`, `minor`, or `no release`, from **all** commits
   on `master` since the last release tag (not scoped to either package's directory).
2. `@semantic-release/release-notes-generator` — builds release notes from the same
   commits.
3. `@semantic-release/changelog` — prepends those notes to the root `CHANGELOG.md`.
4. `@semantic-release/npm`, **listed twice** — once with
   `pkgRoot: "packages/jarl-atoms"`, once with `pkgRoot: "packages/jarl-react"`.
   semantic-release runs every plugin entry in the array at each lifecycle step, so
   both instances independently bump their package's `version` field to the same
   `nextRelease.version` and (when credentials are present) `npm publish` it.
5. `@semantic-release/git` — commits the two updated `package.json` files and
   `CHANGELOG.md` back to `master` with an `[skip ci]` release commit.
6. `@semantic-release/github` — creates a GitHub release with the generated notes.

### Why lockstep instead of `semantic-release-monorepo` / independent versioning

The alternative considered was giving each package its own independently-computed
version (via [`semantic-release-monorepo`](https://github.com/pmowrer/semantic-release-monorepo)
or hand-rolled path-scoped commit filtering + per-package git tags like
`jarl-atoms@2.3.0`). That's the more "correct" model for packages that genuinely
evolve independently, but for this repo it's not worth the complexity:

- `jarl-atoms` and `jarl-react` are already versioned in lockstep today (both `2.0.0`),
  and `jarl-react` exists specifically as the React binding _over_ `jarl-atoms` — they
  ship as one conceptual library with two entry points, not two independent products.
- Independent versioning needs two separate release configs/executions (one scoped per
  package directory), two tag namespaces, and — critically — some mechanism to reopen
  and bump `jarl-react`'s `"jarl-atoms": "^2.0.0"` dependency range whenever
  `jarl-atoms` releases a version outside that range. That's real ongoing maintenance
  for a 2-package workspace.
- With lockstep versioning **and** the major-suppression below, `jarl-react`'s
  `"jarl-atoms": "^2.0.0"` dependency range never needs to change: every future
  lockstep release stays a `2.x.y`, which `^2.0.0` already satisfies. No dependency-range
  bump step is needed release over release.

Tradeoff accepted: a change that only touches `jarl-react` (e.g. a React-only bugfix)
still bumps and republishes `jarl-atoms`, even with no functional diff in that package.
For a 2-package workspace this is a small, cheap redundant publish — far simpler than
maintaining independent version lines.

## How versions are derived from commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/)
(`type(scope)!: subject`, optional `BREAKING CHANGE:` footer). `commit-analyzer` is
configured with `preset: "conventionalcommits"` (the modern preset — recognizes both the
`!` shorthand, e.g. `feat!: ...`, and a `BREAKING CHANGE:`/`BREAKING-CHANGE:` footer as
breaking, unlike the older `angular` preset which only recognizes the footer).

Default mapping (standard Conventional Commits semantics):

| Commit type                                                       | Release bump                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `fix`, `perf`                                                     | patch                                                         |
| `feat`                                                            | minor                                                         |
| breaking change (`!` or `BREAKING CHANGE:` footer)                | **minor** (suppressed — see below; would normally be `major`) |
| `revert`                                                          | patch                                                         |
| `docs`, `style`, `chore`, `refactor`, `test`, `build`, `ci`, etc. | no release                                                    |

If multiple commits are included in one release, the highest applicable bump wins
(a `feat` and a `fix` together still only produce one `minor` release).

## Release cadence: releases are cut by hand, never by a push

`commit-analyzer` decides _what_ a release is; it never decides _whether_ now is the moment to
cut one. It always analyses every commit since the last `vX.Y.Z` tag, so while releases fired
automatically, one unreleased `feat` kept forcing a `minor` on every later push until something
finally released it — which is how `2.0.1 → 2.1.0 → 2.2.0 → 2.3.0 → 2.4.0 → 2.5.0` came out as
six consecutive minor bumps, several of them for pushes that were entirely docs.

Releasing is now a deliberate act. The `release` job in `.github/workflows/ci.yml` runs **only**
on a manual `workflow_dispatch` with the `release` input ticked; no push to `master` or `beta`
can trigger it. That way a release happens when enough has accumulated to be worth cutting, which
is a judgement no commit-message convention can make.

`on.push.branches` still includes `master` and `beta` — build, e2e and deploy are unchanged and do
belong on every push. Only the release is decoupled from it.

### Cutting a release

Actions tab → **CI** → _Run workflow_ → pick the branch (`master` for a normal release, `beta` for
a `-beta.N` prerelease) → tick **Release everything outstanding since the last tag** → run.

semantic-release then does what it always did: analyses every commit since the last tag, computes
one version bump from them, and publishes both packages in lockstep. Nothing is ever dropped by
waiting — the accumulated commits are all still there to be analysed whenever the release is cut.

The job keeps a `concurrency` group (`release-<ref>`, `cancel-in-progress: false`) so two
dispatches can't race each other's tag push and npm publishes, and so a run already mid-publish
always finishes.

### Commits with no Conventional Commits type

`commit-analyzer` matches release rules against a parsed `type`, so a commit whose subject has no
`type:` prefix is unreleasable no matter what it changed. `master` carries a couple of dozen of
these and several are real work — `Add notAtom for catch-all/unmatched routes` (a `feat`),
`Emit dist/index.d.cts for jarl-atoms/jarl-react, fix require condition types` (a `fix`),
`Make jotai a peerDependency of jarl-atoms and jarl-react` (a breaking `fix`). They reached npm
only because a later typed `feat` swept them into its release, and none of them appear in the
changelog. Enforcing the format at commit or PR time (commitlint) is a separate change.

## Major-version suppression ("romantic versioning")

Per the author's note on the ticket: breaking changes will happen often while the
library is still maturing, and racing up through major version numbers (v3, v4, v50...)
before there's ever a stable 2.0 doesn't help anyone. So major bumps are suppressed by
design, via a custom release rule in `.releaserc.json`:

```json
{
  "preset": "conventionalcommits",
  "releaseRules": [
    { "breaking": true, "release": "minor" },
    { "type": "revert", "release": "patch" }
  ]
}
```

`@semantic-release/commit-analyzer` checks custom `releaseRules` **before** falling back
to the preset's defaults, and uses whichever result the custom rules produce once any of
them match. The `{ "breaking": true, "release": "minor" }` rule matches any commit that
has a breaking-change marker (whether via `!` shorthand or a `BREAKING CHANGE:` footer)
and forces its release type to `minor`, so the preset's own default
(`{ "breaking": true, "release": "major" }`) is never reached for breaking commits.
Conventional Commits presets have no _other_ source of a `major` bump — breaking-change
markers are the only trigger — so with this rule in place, `commit-analyzer` can never
return `"major"` for this repo, full stop.

This was verified directly against `@semantic-release/commit-analyzer`'s `analyzeCommits`
function with synthetic commits (see "Verification" below): a `fix!:` commit with a
`BREAKING CHANGE:` footer, a `feat:` commit with a `BREAKING CHANGE:` footer, and a
`feat!:` commit using only the shorthand marker all resolved to `minor`, never `major`.

### Lifting the suppression later

When the library is ready to start incrementing majors normally (e.g. a deliberate,
planned 3.0 breaking release), remove the `{ "breaking": true, "release": "minor" }`
override from `.releaserc.json`'s `commit-analyzer` config (or change its `release` value
to `"major"`). From that point on, a breaking-change commit produces a normal major bump
again. No other config changes are needed — this is a single-line, single-place toggle.

## One-time bootstrap: the `v2.0.0` baseline tag

semantic-release determines "the last release" by finding the newest git tag matching
`tagFormat` (`v${version}` here) that's reachable from the release branch — it has no
awareness of the `"version": "2.0.0"` already sitting in each package's `package.json`.
This repo's newest matching tag today is `v1.0.0-beta.5` (from the pre-rewrite v1 line);
without a `v2.0.0` tag, the **first** semantic-release run would compute its bump from
that old v1 baseline instead, which is wrong.

**Before the first automated release runs**, someone (a human step, or the first run of
ticket 106's CI wiring) must create and push a `v2.0.0` tag pointing at the commit on
`master` where the v2 packages first shipped at version `2.0.0`:

```bash
git tag v2.0.0 <sha-of-the-v2.0.0-commit-on-master>
git push origin v2.0.0
```

This ticket deliberately does **not** create that tag (out of scope: "do NOT create
tags/releases in this task") — it's called out here and in the PR description instead so
it isn't missed.

## Beta prerelease branch (ticket 140)

Per the author's further thought on ticket 140: rather than publishing `2.0.0` straight
to `latest` as soon as the v2 rewrite is code-complete, a long-lived `beta` branch lets
work continue to be pushed out as installable, incrementing prereleases
(`2.0.0-beta.1`, `2.0.0-beta.2`, ...) while it's still settling — without ever touching
the `latest` dist-tag npm installs by default. Once the beta line feels ready to become
the real `2.0.0` (possibly via a release-candidate phase first — see below), the plan
reverts to what ticket 107 already describes: a real `2.0.0` published as `latest`. That
ticket's `depends_on` already includes 140 for exactly this reason.

### How it's wired

`.releaserc.json`'s `branches` array adds `beta` as a semantic-release **prerelease
branch**:

```json
{ "name": "beta", "prerelease": true }
```

`prerelease: true` tells semantic-release two things at once, both driven by the branch
name:

1. Computed versions on this branch get the `-beta.N` suffix appended, e.g. a `feat`
   commit pushed to `beta` when the last real release was `2.0.0` computes
   `2.0.1-beta.1` (or `2.0.0-beta.1` before any real release exists yet — see bootstrap
   below); a second push before promotion computes `...-beta.2`, and so on.
2. `@semantic-release/npm`'s publish **channel** for this branch also defaults to the
   branch name, so every `beta` publish goes out under the `beta` npm dist-tag —
   `npm install jarl-react` (no tag) keeps resolving whatever `latest` currently points
   at; only `npm install jarl-react@beta` picks up the prerelease train.

The rest of the pipeline — commit-analyzer's rules (including the major-suppression
above), release-notes-generator, the changelog, `@semantic-release/git`, and
`@semantic-release/github` — all run unchanged on `beta`, same as on `master`. CI wiring
is the same `release` job in `.github/workflows/ci.yml` for both branches; see that
file's comments for the branch-triggering and `if:` details.

### Bootstrap: reuses the same `v2.0.0` tag, no separate beta baseline needed

The "One-time bootstrap" section above already requires a `v2.0.0` tag on `master`
before the _first_ automated release of any kind runs, because without it
semantic-release would otherwise find this same repo's old pre-rewrite `v1.0.0-beta.5`
tag as "the last release" and continue that lineage instead. That requirement applies
identically to `beta`: as long as the `beta` branch is created from `master` **after**
the `v2.0.0` tag has been pushed, the tag is an ancestor of `beta` too, so semantic-release
resolves the same correct baseline on either branch. No second, beta-specific bootstrap
tag is required — but the ordering matters (tag first, branch second), and pushing to
`beta` before the tag exists would carry over the wrong (v1) baseline just as it would on
`master`.

### Version bumps landed by this ticket

`packages/jarl-atoms/package.json` and `packages/jarl-react/package.json`'s resting
`"version"` fields are bumped from `2.0.0` to `2.0.0-beta.1` in this ticket, to reflect
that the repo is now in the beta phase rather than presenting as an already-released
`2.0.0`. This is a documentation/dev-state convenience only — semantic-release computes
the version actually published from git tags, not from whatever is checked into
`package.json` at push time (it overwrites both files' `version` field itself as part of
each release commit). `packages/jarl-react/package.json`'s dependency on `jarl-atoms` is
also updated, from `^2.0.0` to `^2.0.0-beta.1`: npm's semver treats prerelease versions
specially — a plain `^2.0.0` range never matches _any_ prerelease version (`2.0.0-beta.1`
included), only a range with a prerelease comparator on the same `major.minor.patch`
does, and that comparator still matches later betas, an eventual real `2.0.0`, and any
`2.x.y` after that. Without this change, installing `jarl-react@beta` would fail to
resolve its own `jarl-atoms` dependency.

### Not done by this ticket

- **The `beta` branch itself is not created or pushed.** This ticket lands the
  configuration and CI wiring only; creating `beta` (and thus triggering its first real
  publish) is left as a follow-up action once the owner is ready to start iterating in
  public beta — consistent with the "do NOT create tags/releases" scoping already
  observed above for the `v2.0.0` bootstrap tag.
- **No `rc`/release-candidate prerelease branch is added.** The ticket's title
  ("...until ready to move to release candidate") anticipates an eventual RC step, but
  doesn't require building it now. If a formal RC phase turns out to be wanted later, the
  same pattern extends directly — add another prerelease branch entry (e.g.
  `{ "name": "rc", "prerelease": true }`) publishing under an `rc` dist-tag — but that's
  left for a future ticket rather than spun up speculatively here. The simplest path from
  beta to stable remains: merge `beta` back into `master` and let master's existing
  non-prerelease pipeline cut the real `2.0.0`.
- **GitHub Actions billing lock (ticket 82).** Same blocker noted throughout this
  document already applies to the `beta` branch's runs of the `release` job: Actions is
  billing-locked for this repo, so no CI run — beta or master — can be proven green from
  outside GitHub until that's resolved.

## Workspace scripts

Added to the root `package.json`:

```bash
npm run release           # semantic-release — full run, needs NPM_TOKEN + GH_TOKEN/GITHUB_TOKEN
npm run release:dry-run   # semantic-release --dry-run --no-ci — computes and prints the
                           # next version/notes without publishing, tagging, or committing
```

`ci-publish` (`npm publish --workspace packages/jarl-atoms --workspace packages/jarl-react`)
already existed from ticket 104 and is unrelated to this — it's a manual/ad-hoc publish
escape hatch, not part of the automated release path.

## Verification performed (no credentials available)

- `npm install` resolves all new `semantic-release`/`@semantic-release/*` dependencies
  cleanly under the existing workspace setup.
- `npx semantic-release --dry-run --no-ci` loads `.releaserc.json` successfully: every
  plugin (including both `@semantic-release/npm` instances, one per `pkgRoot`) resolves
  and initializes without error. On the `master` branch it stops (as designed —
  semantic-release only releases from `master`); pointed at a local `--repository-url`
  override to exercise it from a branch, it correctly proceeds to `verifyConditions` and
  fails only on the expected missing-credential errors (`ENONPMTOKEN` ×2 — one per
  package — and `ENOGHTOKEN`), confirming the pipeline is wired correctly end to end
  short of actual publishing.
- `@semantic-release/commit-analyzer`'s `analyzeCommits` was called directly (bypassing
  the full pipeline, so no credentials needed) with the exact `releaseRules` from
  `.releaserc.json`, against synthetic commits covering `fix`, `feat`, `docs`,
  `fix!` + footer, `feat` + footer, `feat!` shorthand, and `chore`. Results: `patch`,
  `minor`, `null`, `minor`, `minor`, `minor`, `null` — every breaking-change form
  resolved to `minor`, confirming the major-suppression rule works as intended.

## What ticket 106 (CI wiring) needs to provide

This ticket only adds config/scripts/docs — it does not wire anything into GitHub
Actions. For the automated release to actually run, ticket 106 needs to:

- Add a job to `.github/workflows/ci.yml` (or a new workflow) that runs `npm run release`
  after `build-and-test` succeeds, never on PRs — semantic-release itself also refuses to run
  on PR builds, but the job shouldn't even attempt it. See "Release cadence" above for the
  trigger that job uses.
- Provide these as repository secrets, injected as env vars for that job:
  - `NPM_TOKEN` — an npm automation/publish token with publish rights to both `jarl-atoms`
    and `jarl-react` on the registry.
  - `GH_TOKEN` or `GITHUB_TOKEN` — the default `secrets.GITHUB_TOKEN` GitHub Actions
    provides is sufficient for `@semantic-release/github`, as long as the job's
    `permissions:` block grants at least `contents: write` (to push the release commit
    and tag) and ideally `issues: write` / `pull-requests: write` (so
    `@semantic-release/github` can comment on issues/PRs referenced by release notes).
- Create and push the one-time `v2.0.0` baseline tag described above, before the first
  release job run — otherwise the first computed version will be wrong (based on the old
  v1.x tag history instead of the v2 baseline).
- Note: GitHub Actions is currently billing-locked for this repo (ticket 82), so any CI
  run — including this new release job once ticket 106 adds it — is expected to show as
  failed/not-run until that's resolved, independent of whether the release config itself
  is correct.
