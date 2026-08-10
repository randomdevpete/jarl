/**
 * Route atom tree for the Playwright test fixture app (ticket 57).
 *
 * This composes the route atoms from packages/jarl-atoms into a tree that
 * mirrors the path structure of the old Cypress demo suites
 * (demo/cypress/integration/*.js on master), so the ported Playwright specs
 * can exercise realistic nested/param routes.
 *
 * NOTE: this file only *composes* the primitives jarl-atoms exports
 * (rootAtom, staticRouteAtom, paramRouteAtom). It does not add routing
 * features to the library. Ticket 56 has since implemented query strings,
 * redirects/resolve and basePath, but this fixture doesn't consume them yet,
 * so those scenarios remain `test.fixme()` in their specs - see the PR body.
 */
import { rootAtom, staticRouteAtom, paramRouteAtom } from "jarl-atoms";

// --- Shell (demo/cypress/integration/00DemosShell.js) ---
export { rootAtom };
export const changelogAtom = staticRouteAtom("changelog");
// Catches any single unmatched top-level segment, e.g. /asdfghjkl
export const shellMissingAtom = paramRouteAtom("missingPath");

// --- Basic Routing (01BasicRouting.js) ---
export const basicRoutingAtom = staticRouteAtom("basicRouting");
export const basicRoutingAboutAtom = staticRouteAtom("about", {
    parent: basicRoutingAtom,
});

// --- Advanced Routing (02AdvancedRouting.js) ---
export const advancedRoutingAtom = staticRouteAtom("advancedRouting");
export const productAtom = staticRouteAtom("product", {
    parent: advancedRoutingAtom,
});
export const productRatingsAtom = staticRouteAtom("ratings", {
    parent: productAtom,
});
export const productGalleryAtom = staticRouteAtom("gallery", {
    parent: productAtom,
});
export const productGalleryImageAtom = paramRouteAtom("imageId", {
    parent: productGalleryAtom,
});

// --- Query Strings (03QueryStrings.js) ---
// Most of this suite is test.fixme()'d - the v2 route atoms don't read or
// write query/search params in this fixture yet (`queryAtom` exists).
export const queryStringsAtom = staticRouteAtom("queryStrings");
export const queryStringsSearchAtom = staticRouteAtom("search", {
    parent: queryStringsAtom,
});

// --- Redirects (04Redirects.js) ---
// Most of this suite is test.fixme()'d - there is no redirect/resolve
// support wired up in this fixture yet (`redirectAtom` exists).
export const redirectsAtom = staticRouteAtom("redirects");
export const redirectsMovedAtom = staticRouteAtom("moved", {
    parent: redirectsAtom,
});
export const redirectsAdminAtom = staticRouteAtom("admin", {
    parent: redirectsAtom,
});
export const redirectsContentAtom = staticRouteAtom("content", {
    parent: redirectsAtom,
});
export const redirectsContentSlugAtom = paramRouteAtom("slug", {
    parent: redirectsContentAtom,
});
