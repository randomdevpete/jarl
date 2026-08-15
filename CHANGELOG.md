## [2.4.0](https://github.com/randomdevpete/jarl/compare/v2.3.0...v2.4.0) (2026-08-15)

## [2.3.0](https://github.com/randomdevpete/jarl/compare/v2.2.0...v2.3.0) (2026-08-15)

## [2.2.0](https://github.com/randomdevpete/jarl/compare/v2.1.0...v2.2.0) (2026-08-15)

## [2.1.0](https://github.com/randomdevpete/jarl/compare/v2.0.1...v2.1.0) (2026-08-14)

## [2.0.1](https://github.com/randomdevpete/jarl/compare/v2.0.0...v2.0.1) (2026-08-11)

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
