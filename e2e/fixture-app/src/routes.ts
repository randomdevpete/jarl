/**
 * Route atom tree for the Playwright test fixture app (ticket 57).
 *
 * This composes the route atoms from packages/jarl-atoms into a tree that
 * mirrors the path structure of the old Cypress demo suites
 * (demo/cypress/integration/*.js on master), so the ported Playwright specs
 * can exercise realistic nested/param routes.
 *
 * NOTE: this file only *composes* the primitives jarl-atoms exports
 * (rootAtom, staticRouteAtom, paramRouteAtom, redirectAtom, asyncRouteAtom). It
 * does not add routing features to the library.
 */
import { atom } from "jotai/vanilla";
import { loadable } from "jotai/utils";
import { rootAtom, staticRouteAtom, paramRouteAtom, redirectAtom, asyncRouteAtom, redirect } from "jarl-atoms";

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
export const queryStringsAtom = staticRouteAtom("queryStrings");
export const queryStringsSearchAtom = staticRouteAtom("search", {
  parent: queryStringsAtom,
});

// --- Redirects (04Redirects.js) ---
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

// Unconditional: visiting /redirects/moved always bounces back to the
// landing page. Read via its `match`, not `followRedirects` - see the
// comment on `reasonSearchParams` in Redirects.tsx for why the actual
// navigation is handled there instead.
export const redirectsMovedRedirectAtom = redirectAtom("/redirects", {
  parent: redirectsMovedAtom,
});

export const isAdminAuthenticatedAtom = atom(false);

// A little JARL etymology, mirroring the flavour of the v1 demo content.
const CONTENT: Record<string, string> = {
  "about-us": "A jarl was a Norse or Danish chief, a rank of nobility above a freeman and below a king.",
};

export const redirectsAdminDataAtom = asyncRouteAtom(redirectsAdminAtom, "admin", async (_values, get) => {
  if (!get(isAdminAuthenticatedAtom)) {
    return redirect("/redirects");
  }
  return { body: "This is the super secret admin page." };
}).data;

export const redirectsContentDataAtom = asyncRouteAtom(redirectsContentSlugAtom, "content", async ({ slug }) => {
  const body = CONTENT[slug];
  if (!body) {
    return redirect("/redirects");
  }
  return { body };
}).data;

// loadable() lets the pages read these without a Suspense boundary.
export const redirectsAdminDataLoadableAtom = loadable(redirectsAdminDataAtom);
export const redirectsContentDataLoadableAtom = loadable(redirectsContentDataAtom);
