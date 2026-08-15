/**
 * The docs site's own route table, built from the real `jarl-atoms` package. This is
 * the "dogfooding" part of ticket 58: the site's top-level navigation, not just the
 * /demos section, is powered by the published routing atoms rather than a conventional
 * router - and, since the site is prerendered, it doubles as the SSR/SSG proof case for
 * `jarl-atoms`' server-seedable `locationAtom`.
 */
import { rootAtom, staticRouteAtom, paramRouteAtom } from "jarl-atoms";
import { blogStaticPaths } from "../demos/blogPosts";

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

// Blog routing demo: just the static mount point. The demo's own /:year/:month/:day/:slug
// tree lives inside BlogRoutingApp, parented on whatever root atom it is handed.
export const blogRoutingDemoRoute = staticRouteAtom("blog-routing", { parent: demosIndexRoute });

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
];
