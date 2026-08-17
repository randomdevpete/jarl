## [2.6.0](https://github.com/randomdevpete/jarl/compare/v2.5.0...v2.6.0) (2026-08-17)

### ⚠ BREAKING CHANGES

* **release:** suppression. Every burned version is a .0 and a patch
bump can only produce .1 or higher, so while that holds the guard
cannot fire and the version is decided entirely by the highest tag.

Opening a line is then one step — plant a tombstone tag on the last
release commit and release the .1. v2.1.0 is already tagged and stays,
so the next release is 2.1.1, carrying everything since it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>

### Features

* **atoms:** add asyncRouteAtom for routes an async lookup decides ([9cc4f6c](https://github.com/randomdevpete/jarl/commit/9cc4f6c7a5f027092ab6b7478b961e6f1eb30778))
* **atoms:** add numericRouteAtom for numeric path segments ([6199066](https://github.com/randomdevpete/jarl/commit/6199066cdddf0bb070974eb7edcb431ccf26e650))
* **atoms:** drop redundant module-level comment in asyncRouteAtom ([9c07ea7](https://github.com/randomdevpete/jarl/commit/9c07ea7b9c7fb990342a38f35777d547b3e7ba4a))
* **docs:** add blog routing demo ([409d271](https://github.com/randomdevpete/jarl/commit/409d2712747f1ab514b3b0db26549fc73f565442))
* **docs:** async-lookup demo, and a real 404 status from SSR ([6c0b9a1](https://github.com/randomdevpete/jarl/commit/6c0b9a107fdf3d6bed7981937cc2f65237011d49))
* **docs:** browse changelog releases with per-version routes ([a718546](https://github.com/randomdevpete/jarl/commit/a7185466ee799c2e81c08e6b9910bcb8aed2f7ad))
* **docs:** data grid filter/sort demo driven by query params ([d0c2557](https://github.com/randomdevpete/jarl/commit/d0c25571dca9140f9a82251d3c9afda7b558ff18))
* **docs:** syntax-highlight code blocks with highlight.js ([fa39824](https://github.com/randomdevpete/jarl/commit/fa39824c372f838df275af66b238df9a7a14a292))
* roll the SSR server on every deploy ([627a414](https://github.com/randomdevpete/jarl/commit/627a414de52146a3043c1e41bb864ccbfcff5480))

### Bug Fixes

* **docs:** await the now-async render in the production SSR server ([a615556](https://github.com/randomdevpete/jarl/commit/a615556da4a9e2fa7d6ddfb614876336c7ad8fdf))
* **docs:** keep release-note sections inside their changelog entry ([67da666](https://github.com/randomdevpete/jarl/commit/67da666eb5f08799473bb14e2bcbc2d76e145f4c))
* pin conventional-changelog-conventionalcommits to the release-notes-generator-compatible v8 line ([eec26a5](https://github.com/randomdevpete/jarl/commit/eec26a50ea7d69d0765e1af1c90db3846c9daa6b))

### Continuous Integration

* **release:** reset the published line to 2.0.1 and open 2.1.x at 2.1.1 ([25a5aa3](https://github.com/randomdevpete/jarl/commit/25a5aa364ab5f6cfff64a276c8aa49a6d50751e1))

## [2.5.0](https://github.com/randomdevpete/jarl/compare/v2.4.0...v2.5.0) (2026-08-15)

### Features

* **docs:** add GitHub, Discord and npm links to the toolbar ([ceb3ec8](https://github.com/randomdevpete/jarl/commit/ceb3ec8))
* **docs:** generate the API reference from package doc comments ([60d4351](https://github.com/randomdevpete/jarl/commit/60d4351))

### Code Refactoring

* **atoms:** split `routeAtom.ts` into one file per primitive atom ([1b777f5](https://github.com/randomdevpete/jarl/commit/1b777f5))
* **atoms:** restore the `Path` type export to keep the public API intact ([0b9ba90](https://github.com/randomdevpete/jarl/commit/0b9ba90))
* **docs:** replace `main.css` with `@emotion/styled` components ([71288ab](https://github.com/randomdevpete/jarl/commit/71288ab))

### Documentation

* point the doc site's links at `randomdev.co.uk` after the repo transfer ([7b4f2b9](https://github.com/randomdevpete/jarl/commit/7b4f2b9))
* new tagline, "Routing for the atomic age" ([2fb91d8](https://github.com/randomdevpete/jarl/commit/2fb91d8))

### Continuous Integration

* wire the deploy job — OIDC role, `cdk deploy --all`, S3 sync and invalidation ([eba8115](https://github.com/randomdevpete/jarl/commit/eba8115))
* bump `checkout`/`setup-node` to v5 for Node 24 action runtimes ([e716935](https://github.com/randomdevpete/jarl/commit/e716935))

## [2.4.0](https://github.com/randomdevpete/jarl/compare/v2.3.0...v2.4.0) (2026-08-15)

### Features

* **infra:** Route53 zone, ACM certificate and alias records for `jarl.randomdev.co.uk` ([78bb9a0](https://github.com/randomdevpete/jarl/commit/78bb9a0))

### Bug Fixes

* emit `dist/index.d.cts` for both packages and fix the `require` condition types ([433d863](https://github.com/randomdevpete/jarl/commit/433d863))
* make `jotai` a peer dependency of `jarl-atoms` and `jarl-react` rather than a bundled one ([80e88aa](https://github.com/randomdevpete/jarl/commit/80e88aa))

### Tests

* smoke-test the published packages from a clean consumer project ([450d7d5](https://github.com/randomdevpete/jarl/commit/450d7d5))

## [2.3.0](https://github.com/randomdevpete/jarl/compare/v2.2.0...v2.3.0) (2026-08-15)

### Features

* **jarl-react:** add `Switch` for first-match routing with a fallback ([3ab1ca5](https://github.com/randomdevpete/jarl/commit/3ab1ca5))

## [2.2.0](https://github.com/randomdevpete/jarl/compare/v2.1.0...v2.2.0) (2026-08-15)

### Features

* add `notAtom` for catch-all and unmatched routes ([7de8802](https://github.com/randomdevpete/jarl/commit/7de8802))
* **infra:** static-site stack — private S3 bucket behind CloudFront ([0231ced](https://github.com/randomdevpete/jarl/commit/0231ced))
* **infra:** SSR stack — EC2 behind the shared CloudFront front ([3f2dca6](https://github.com/randomdevpete/jarl/commit/3f2dca6))

### Documentation

* Viking dark theme, gold accents and a monospace code font ([cfed963](https://github.com/randomdevpete/jarl/commit/cfed963), [df7bdb6](https://github.com/randomdevpete/jarl/commit/df7bdb6))
* adopt the chosen font pairing — Cinzel headings, Source Sans 3 body ([4406851](https://github.com/randomdevpete/jarl/commit/4406851))
* adopt the candidate-01 helmet as the logo and favicon ([b400fd0](https://github.com/randomdevpete/jarl/commit/b400fd0))

### Tests

* wire the e2e fixture app to `queryAtom`/`redirectAtom`/`resolvedAtom` ([39d3ced](https://github.com/randomdevpete/jarl/commit/39d3ced))

## [2.1.0](https://github.com/randomdevpete/jarl/compare/v2.0.1...v2.1.0) (2026-08-14)

Published no library change: the only edits under `packages/` were the version fields themselves
and a Discord invite link in both READMEs. The work below is the first infrastructure for the doc
site, under `infra/`, which is not published — it reached npm because the release pipeline
analysed every commit on `master`, not only those touching the published packages.

### Features

* **infra:** add the CDK app scaffold for `jarl.randomdev.co.uk` ([d419da0](https://github.com/randomdevpete/jarl/commit/d419da0))

### Documentation

* update the Discord invite link in both package READMEs ([aef4bec](https://github.com/randomdevpete/jarl/commit/aef4bec))

## [2.0.1](https://github.com/randomdevpete/jarl/compare/v2.0.0...v2.0.1) (2026-08-11)

**The first release of the v2 rewrite.**

JARL v2 is a ground-up rewrite around an atomic routing model. Routing state lives in
[jotai](https://jotai.org/) atoms rather than in a router component's internal state: a route
resolves into atoms, and anything that needs the current location, query or resolved route reads
the atom directly instead of threading props or context down the tree. `jarl-atoms` holds that
framework-agnostic core, and `jarl-react` is the React binding over it — the two are released
together and always share a version number.

The v1 implementation and its `url-pattern` dependency are gone; v2 is not a drop-in upgrade from
the v1 beta line.

`2.0.1` rather than `2.0.0` because `v2.0.0` exists only as a baseline tag marking where the
rewrite reached version 2 — it was never published to npm, so this is the first v2 version
installable from the registry.

### Features

* rewrite the docs around the atomic routing model ([c303649](https://github.com/randomdevpete/jarl/commit/c303649))
* wire semantic-release into a CI publish job, with major-bump suppression ([7973010](https://github.com/randomdevpete/jarl/commit/7973010), [084cda5](https://github.com/randomdevpete/jarl/commit/084cda5))
* add a `beta` prerelease branch to the release pipeline ([1831d5a](https://github.com/randomdevpete/jarl/commit/1831d5a))

### Bug Fixes

* correct package metadata and tarball contents for `jarl-atoms` and `jarl-react` ([fed93f0](https://github.com/randomdevpete/jarl/commit/fed93f0))
* **release:** unblock the first publish ([0371bbd](https://github.com/randomdevpete/jarl/commit/0371bbd))

### Code Refactoring

* remove the v1 implementation ([8c5c36e](https://github.com/randomdevpete/jarl/commit/8c5c36e))
* remove `url-pattern` and its remaining references ([f724632](https://github.com/randomdevpete/jarl/commit/f724632))

### Continuous Integration

* fix the e2e job to install its own dependencies, and drop `continue-on-error` ([c699f10](https://github.com/randomdevpete/jarl/commit/c699f10))
* bump CI to Node 24 to match the jsdom/undici engine requirements ([d9d4e8b](https://github.com/randomdevpete/jarl/commit/d9d4e8b))

# JARL: Version History

## v1.0.0-beta.5

*   Minor fix to avoid mangling URLs in some contexts

## v1.0.0-beta.4

*   Started testing React Native integration
*   Interim release to get this working

## v1.0.0-beta.3

*   Fix: Got `active` working everywhere properly, in particular inside demos
*   Fix: Edge case crash on redirect demos
*   Demo: Code splitting now loads something substantial and is actually code splitting properly
*   Demo: Code splitting shows a PDF which can also be navigated via routing
*   Build: Made Webpack more aggressive about chunks

## v1.0.0-beta.2

*   New feature: improved API to accessing `resolve` objects. They are now available
    via the `routing` HOC or the `Router` FaC, alongside the `location`props
*   Huge improvements and additions to docs
*   Code splitting demo and main JARL API docs finally work properly

## v1.0.0-beta.1

*   Really actually fix deployment for good this time
*   Got the code samples and Markdown docs looking much better
*   Decided this can probably be called beta now 🎉

## v1.0.0-alpha.15

*   Fix rendering CHANGELOG
*   Added some E2E tests around the demo shell

## v1.0.0-alpha.14

*   I screwed up. Had to bump another couple of versions to test the pipeline.
*   Some improvments on the demo site:
    *   Syntax highlighted code examples
    *   Removed broken Redux Integration demo
    *   Switched UI over to Semantic UI
    *   Added the CHANGELOG
    *   Added API docs for JARL Native

## v1.0.0-alpha.12

### CI/CD

*   Only tagged builds publish and deploy to production
*   PRs and master untagged builds will deploy a staging demo site
*   Build number added on docs site
*   Really fixed prod deployment
*   Created a Discord server: https://discord.gg/6yGq39rJ63
*   Added a Discord bot to make build announcments in #build

## v1.0.0-alpha.11

*   Final deployment to production site was not working correctly, fixed this
*   Run E2E against staging site, because why not

## v1.0.0-alpha.10

*   Some more work on generating API docs
*   Added version number from package.json to site header

## v1.0.0-alpha.9

*   Moved away from Yarn workspaces (was being pretty buggy)
*   Docker build and deployment of demo site (finally!)
*   Docs and demos live at: https://jarl.downplay.co ❤️

## v1.0.0-alpha.7

### Deployment

*   CircleCI!
*   Jest, Cypress, eslint, plus builds all running in a shiny new CI pipeline
*   Fixed some flaky time-based tests
*   Got a build working for the demo/docs site
*   Added new E2E tests and fixed all the broken ones
*   Started adding tests to RN package
*   Improved some of the local dev scripts
*   Moved to Yarn workspaces
*   Continuous deployment to npm
*   Version took a large bump since last release due to multiple deployments
    whilst figuring out CI

### Bugs

*   Fixed that active status of links would be wrong on first page load

## v1.0.0-alpha.4

*   Fixed error due to missing actionTypes.js in `jarl-react-redux`

## v1.0.0-alpha.3

*   Slightly relaxed error throwing in the case of an invalid Link. Don't really want to stop the whole app rendering (or even really throw at all) just because a Link was null, but we do want pretty obvious console errors if a location is unresolvable as that definitely indicates a bug.

## v1.0.0-alpha.2

*   React Native support! A new package `jarl-react-native` brings a reasonably comprehensive RN compatible integration including:
    *   A router wrapper, `NativeProvider`, using createMemoryHistory
    *   A variant of the Link component using TouchableHighlight
    *   Back Button (Android) and Deep Linking support. Both optional via props on the NativeProvider.

## v1.0.0-alpha

### Breaking

*   The big rename landed! Massively simplified the API while providing more flexibility. (I hope!)

    *   `NavigationProvider` is now `RoutingProvider`
    *   `performInitialNavigation` -> `performInitialRouting`
    *   `onNavigateStart` and `onNavigateEnd` are collapsed into a single `onChange`. The router is fully controlled: any additional transitions or preloading can be executed before you update location so advanced possibilities are still accounted for. Redux integration's API is unchanged but the whole package might be heading for deprecation.
    *   `SimpleProvider` is now `StateProvider`
    *   `withContext`, `withLocation`, `withNavigate` all disappeared and are replaced by `routing`
    *   `RouteMapper` is now `RouteMap`
    *   `state` has been renamed to `location` _in some places_:
        *   `RoutingProvider` and `StateProvider`'s state prop
        *   Signature of `onChange` callback
        *   Return of `match` function on `RouteMap`
        *   It has _not_ changed on `Route` as this is clearly distinct and is generally just part of the whole location.

*   Other breaking:
    *   `resolve` functions now execute in series; results aren't stored in state anymore but they are made available thru `resolved` on the onChange handler

### New features

*   Brand new `routing` HOC which provides all the functionality of the old HOCs (but with default parameters acts just like `withLocation` used to)
*   `Router` component is a new function-as-child version of `withLocation`
*   Recent changes to `Link` support all the functionality of `withContext` and `withNavigate` (i.e. URL serialization, and navigate/redirect) with a function-as-child API.

## v0.8.0

*   Breaking: renamed `component` prop on `Link` to `element` to be more consistent with PropTypes
*   Breaking: changed the method signature of onNavigateStart and onNavigateEnd callbacks. They now emit an event object in the form `{ state, path, branch, action }` and are now consistent with onNavigateError.
*   Added `action` to the callback emitted from onNavigateStart/onNavigateEnd/onNavigateError. This will be the action received from the `history` listener and be one of: PUSH, REPLACE, or POP for actions triggered by `history`, or INITIAL or RELOAD for initial navigation or reloaded routes triggered by JARL.
*   Fixed nested stringifiers
*   Proper implementation of isActive. Now considers the route hierarchy rather than looking purely at the URL -- meaning it will work with partial paths and query strings
*   Added a function-as-child API to `<Link>`; provides `href`, `active` and `onClick` props so you can render anything that links to a route
*   Redirect now causes a history.replace() instead of history.push()
*   Another big push on documentation
*   Upgraded demos site to Webpack 4 / React Hot Loader 4
*   Added `sideEffects: false` to package.json, for Webpack 4's "pure module" support
*   Bug fixes and other minor improvements

## v0.7.2

*   Fixed nested match
*   Add a `component` prop to Link to override default anchor rendering

## v0.7.1

*   Fixed the build process for IE11 and other older browsers

## v0.7.0

*   New feature: redirects. Can be triggered from `state`, `match`, or `resolve` by returning a `redirect` object. See examples in demos.
*   Added a half-decent example to the README

## v0.6.0

*   Now supports `match` and `stringify` functions on routes. These allow custom transforming both ways between state and URLs, for example converting :year/:month/:day into a Date object and back again
*   Fix: Removed usage of Object.values due to no support in older browsers and requirement of a polyfill

## v0.5.1

*   Fix: ES5 build was missing a file so imports would fail in some conditions

## v0.5.0

*   Major: official support for query strings (adds dependency on `qs` from `hapijs`)
*   Support most of path syntax within query strings, e.g. `/foo?q=:searchTime&bar=(:optionalParam)&*=:rest`
*   Added property to NavigationProvider: `performInitialNavigation`
*   Added property to NavigationProvider: `basePath`
*   Breaking: renamed `withState` HOC to `withLocation` to avoid naming conflict with `recompose` (and `state` in general)
*   New `withContext` HOC to get access to `stringify` and other functions from the provider
*   Additional logic can now be added to route matching use `resolve` property on your routes
*   Use empty location `{}` for default Redux state
*   NavigationProvider's `routes` property can now accept an array instead of a RouteMapper
*   Can now use `resolve` on route objects
*   Allow `path` to be empty on routes; these can be used as containers to apply state, resolvers, query fragments in a grouped fashion; see `themes` in the `queryStrings` demo!
*   Big sort out of the demos! A lot more use cases are now demonstrated and working properly
*   Added tests to many things

## v0.3.2

*   Easier integration with and a new demo for Redux
*   `<Provider/>` component in `jarl-react-redux` is a standard integration that will (probably) do what you need
*   Named matches now automatically run through decodeURIComponent to handle special characters properly
*   Correctly reattach to history in CWRP (necessary for React Hot Reload among other things)

## v0.3.1

*   Fix withNavigate's default props mapper

## v0.3.0

*   Breaking: Rename resolve->stringify. Resolve is already an overloaded term in JS. Stringify is much clearer meaning.
*   Breaking: Rename withRouting->withNavigate. This HOC only injects a `navigate` function so the name was confusing
*   Breaking: Restructured to monorepo design with `lerna`. Redux extensions are now in separate `jarl-react-redux` package
*   Properly sorted out build targets (CJS, UMD, ES) in both packages
*   Better errors on stringification failure to debug state problems
*   Add a new withState HOC to inject the current route's state
*   Added many tests! Including E2E tests with cypress
*   Started writing some proper documentation, updated README a bit
*   Switched to custom build of `url-pattern` to support named wildcards with syntax: `/*:name`

## v0.2.0

*   Added route matching and path resolution for nested routes

## v0.1.2

*   Don't completely override Link's own onClick handler

## v0.1.1

*   Call onClick handler when Link is clicked (e.g. allowing consumers to call `event.stopPropagation()`)

## v0.1.0

*   Routes with dynamic path segments now resolve to URLs correctly

## v0.0.8

*   Link now supports string values for `to` prop
*   Add enzyme config and a Link test

## v0.0.5

*   Initial release
