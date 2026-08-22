import { createStore } from "jotai/vanilla";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { asyncRouteAtom, followAsyncRoutes, hydrateAsyncRoutes, preloadRoutes } from "../asyncRouteAtom";
import { locationAtom } from "../locationAtom";
import { notAtom } from "../notAtom";
import { paramRouteAtom } from "../paramRouteAtom";
import { redirect } from "../redirectAtom";
import { staticRouteAtom } from "../staticRouteAtom";
import { unionRouteAtom } from "../unionRouteAtom";

type Post = { slug: string; title: string };

const POSTS: Post[] = [{ slug: "hello", title: "Hello" }];

const seed = (store: ReturnType<typeof createStore>, pathname: string) => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
};

const blogRoute = staticRouteAtom("blog");
const slugRoute = paramRouteAtom("slug", { parent: blogRoute });

const findPost = async ({ slug }: { slug: string }) => POSTS.find((post) => post.slug === slug);

describe("asyncRouteAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("doesn't match until its lookup has been settled", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(true);

    await preloadRoutes(store, [postRoute]);

    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(postRoute).match).toBe(true);
  });

  it("puts the looked-up object on the route's values under the given name", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadRoutes(store, [postRoute]);

    const route = store.get(postRoute);
    expect(route.values).toEqual({ slug: "hello", post: { slug: "hello", title: "Hello" } });
    expect(route.exact).toBe(true);
  });

  it("doesn't match when the lookup finds nothing, so notAtom reports a not-found", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    const notFound = notAtom(unionRouteAtom([blogRoute, postRoute]));
    seed(store, "/blog/no-such-post");
    await preloadRoutes(store, [postRoute]);

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(notFound)).toBe(true);
  });

  it("is neither pending nor matched where its parent doesn't match at all", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    const lookup = vi.fn(findPost);
    seed(store, "/elsewhere");
    await preloadRoutes(store, [asyncRouteAtom(slugRoute, "post", lookup)]);

    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(postRoute).match).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("stops matching once a snapshot is stale for the new location", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadRoutes(store, [postRoute]);
    seed(store, "/blog/other");

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(true);
  });

  it("reverses through its parent, ignoring the looked-up object", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadRoutes(store, [postRoute]);

    expect(store.get(postRoute).reverse({ slug: "other", post: { slug: "other", title: "Other" } })).toBe(
      "/blog/other",
    );
  });

  it("treats a lookup that redirects as no match, leaving followResolvedRedirects to navigate", async () => {
    const gatedRoute = asyncRouteAtom(slugRoute, "post", async () => redirect("/login"));
    seed(store, "/blog/hello");
    await preloadRoutes(store, [gatedRoute]);

    expect(store.get(gatedRoute).match).toBe(false);
  });
});

describe("preloadRoutes", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("returns a serialisable snapshot per route, in the order given", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");

    expect(await preloadRoutes(store, [postRoute])).toEqual([
      { pathname: "/blog/hello", data: { slug: "hello", title: "Hello" } },
    ]);
  });

  it("doesn't look a route up again once it is settled for this location", async () => {
    const lookup = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", lookup);
    seed(store, "/blog/hello");

    await preloadRoutes(store, [postRoute]);
    await preloadRoutes(store, [postRoute]);

    expect(lookup).toHaveBeenCalledTimes(1);
  });
});

describe("hydrateAsyncRoutes", () => {
  it("makes a route match from a server render's snapshot, without looking anything up", () => {
    const lookup = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", lookup);
    const store = createStore();
    seed(store, "/blog/hello");

    hydrateAsyncRoutes(store, [postRoute], [{ pathname: "/blog/hello", data: POSTS[0] }]);

    expect(store.get(postRoute).values).toEqual({ slug: "hello", post: POSTS[0] });
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe("followAsyncRoutes", () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("settles the lookup for each new location", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    const store = createStore();
    seed(store, "/blog/no-such-post");

    const unsubscribe = followAsyncRoutes(store, [postRoute]);
    await flush();
    expect(store.get(postRoute).match).toBe(false);

    seed(store, "/blog/hello");
    await flush();
    expect(store.get(postRoute).values).toEqual({ slug: "hello", post: POSTS[0] });

    unsubscribe();
  });

  it("leaves a hydrated route alone rather than looking it up a second time", async () => {
    const lookup = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", lookup);
    const store = createStore();
    seed(store, "/blog/hello");
    hydrateAsyncRoutes(store, [postRoute], [{ pathname: "/blog/hello", data: POSTS[0] }]);

    const unsubscribe = followAsyncRoutes(store, [postRoute]);
    await flush();

    expect(lookup).not.toHaveBeenCalled();
    unsubscribe();
  });
});
