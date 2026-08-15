/**
 * The docs site's own route table, built from the real `jarl-atoms` package. This is
 * the "dogfooding" part of ticket 58: the site's top-level navigation, not just the
 * /demos section, is powered by the published routing atoms rather than a conventional
 * router - and, since the site is prerendered, it doubles as the SSR/SSG proof case for
 * `jarl-atoms`' server-seedable `locationAtom`.
 */
import { asyncRouteAtom, notAtom, rootAtom, staticRouteAtom, paramRouteAtom, numericRouteAtom } from "jarl-atoms";
import { blogStaticPaths } from "../demos/blogPosts";
import { articleSlugs, findArticle } from "../demos/asyncArticles";

export const homeRoute = rootAtom;

export const docsSectionRoute = staticRouteAtom("docs");
export const docPageRoute = paramRouteAtom("docName", { parent: docsSectionRoute });

export const apiSectionRoute = staticRouteAtom("api");
export const apiPageRoute = paramRouteAtom("apiName", { parent: apiSectionRoute });

export const changelogRoute = staticRouteAtom("changelog");

export const historyRoute = staticRouteAtom("history");

export const demosIndexRoute = staticRouteAtom("demos");

// Live "basic routing" demo, itself a nested tree of routes built on the same atoms -
// mirrors the shape of the old demo/source/demos/basicRouting example.
export const basicRoutingDemoRoute = staticRouteAtom("basic-routing", { parent: demosIndexRoute });
export const basicRoutingDemoPageRoute = paramRouteAtom("page", { parent: basicRoutingDemoRoute });

// Blog routing demo: a classic /blog/:year/:month/:day/:slug tree, hand-composed from
// numericRouteAtom rather than a single dedicated date primitive.
export const blogRoutingDemoRoute = staticRouteAtom("blog-routing", { parent: demosIndexRoute });
export const blogYearRoute = numericRouteAtom("year", { parent: blogRoutingDemoRoute });
export const blogMonthRoute = numericRouteAtom("month", { parent: blogYearRoute, min: 1, max: 12 });
export const blogDayRoute = numericRouteAtom("day", { parent: blogMonthRoute, min: 1, max: 31 });
export const blogPostRoute = paramRouteAtom("slug", { parent: blogDayRoute });

// Async-lookup demo: /demos/async-lookup/:slug exists only if the demo's fake database has an
// article at that slug, and the article it found rides along on the route's own values.
export const asyncLookupDemoRoute = staticRouteAtom("async-lookup", { parent: demosIndexRoute });
export const asyncLookupSlugRoute = paramRouteAtom("slug", { parent: asyncLookupDemoRoute });
export const asyncArticleRoute = asyncRouteAtom(asyncLookupSlugRoute, "article", ({ slug }) => findArticle(slug));

/** Every async route on the site: preloaded before a server render, kept live on the client. */
export const asyncRoutes = [asyncArticleRoute];

/**
 * Whether the current location has nothing behind it, which is what makes a server render's
 * *status code* right and not just its HTML. It lists `asyncArticleRoute` rather than
 * `asyncLookupSlugRoute`: an unknown slug is a genuine miss, even though the demo page still
 * renders its own not-found view for it.
 */
export const notFoundAtom = notAtom(
  homeRoute,
  docsSectionRoute,
  docPageRoute,
  apiSectionRoute,
  apiPageRoute,
  changelogRoute,
  historyRoute,
  demosIndexRoute,
  basicRoutingDemoRoute,
  basicRoutingDemoPageRoute,
  blogRoutingDemoRoute,
  blogYearRoute,
  blogMonthRoute,
  blogDayRoute,
  blogPostRoute,
  asyncLookupDemoRoute,
  asyncArticleRoute,
);

export type DocName = "getting-started" | "data-loading" | "path-variables";

export const docPages: { docName: DocName; title: string }[] = [
  { docName: "getting-started", title: "Getting Started" },
  { docName: "data-loading", title: "Data Loading" },
  { docName: "path-variables", title: "Path Variables" },
];

export type ApiName = "jarl-atoms" | "jarl-react";

export const apiPages: { apiName: ApiName; title: string }[] = [
  { apiName: "jarl-atoms", title: "jarl-atoms" },
  { apiName: "jarl-react", title: "jarl-react" },
];

/** Every concrete path the SSG build should prerender to a static HTML file. */
export const staticPaths: string[] = [
  "/",
  "/docs",
  ...docPages.map((p) => `/docs/${p.docName}`),
  "/api",
  ...apiPages.map((p) => `/api/${p.apiName}`),
  "/changelog",
  "/history",
  "/demos",
  "/demos/basic-routing",
  "/demos/basic-routing/about",
  ...blogStaticPaths(),
  "/demos/async-lookup",
  ...articleSlugs().map((slug) => `/demos/async-lookup/${slug}`),
];
