import { atom, createStore } from "jotai/vanilla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asyncRouteAtom,
  followAsyncRedirects,
  followAsyncRoutes,
  hydrateAsyncRoutes,
  preloadAsyncRoutes,
} from "../asyncRouteAtom";
import { locationAtom } from "../locationAtom";
import { notAtom } from "../notAtom";
import { paramRouteAtom } from "../paramRouteAtom";
import { isRedirect, redirect } from "../redirectRouteAtom";
import { staticRouteAtom } from "../staticRouteAtom";

type Post = { slug: string; title: string };

const POSTS: Post[] = [{ slug: "hello", title: "Hello" }];

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

const blogRoute = staticRouteAtom("blog");
const slugRoute = paramRouteAtom("slug", { parent: blogRoute });

const findPost = async ({ slug }: { slug: string }) => POSTS.find((post) => post.slug === slug);

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("asyncRouteAtom data", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("is undefined when the route doesn't match, without calling the loader", async () => {
    const galleryRoute = staticRouteAtom("gallery");
    const load = vi.fn(async () => ({ items: [] }));
    const galleryData = asyncRouteAtom(galleryRoute, "gallery", load).data;
    seed(store, "/somewhere-else");

    expect(await store.get(galleryData)).toBeUndefined();
    expect(load).not.toHaveBeenCalled();
  });

  it("resolves the loader's data once the route matches", async () => {
    const galleryRoute = staticRouteAtom("gallery");
    const galleryData = asyncRouteAtom(galleryRoute, "gallery", async () => ({ items: ["a", "b"] })).data;
    seed(store, "/gallery");

    expect(await store.get(galleryData)).toEqual({ items: ["a", "b"] });
  });

  it("passes matched route values into the loader", async () => {
    const galleryRoute = staticRouteAtom("gallery");
    const load = vi.fn(async (values) => ({ values }));
    const galleryData = asyncRouteAtom(galleryRoute, "gallery", load).data;
    seed(store, "/gallery");
    await store.get(galleryData);

    expect(load).toHaveBeenCalledWith({}, expect.any(Function));
  });

  it("a loader can return a Redirect instead of data", async () => {
    const adminRoute = staticRouteAtom("admin");
    const adminData = asyncRouteAtom(adminRoute, "admin", async () => redirect("/login")).data;
    seed(store, "/admin");

    expect(await store.get(adminData)).toEqual(redirect("/login"));
  });

  it("composes: a dependent atom can await another route's data", async () => {
    const userRoute = staticRouteAtom("user");
    const userData = asyncRouteAtom(userRoute, "user", async () => ({ id: "u1" })).data;
    const userPostsData = atom(async (get) => {
      const user = await get(userData);
      if (!user || isRedirect(user)) return undefined;
      return { postsFor: user.id };
    });
    seed(store, "/user");

    expect(await store.get(userPostsData)).toEqual({ postsFor: "u1" });
  });

  it("needs no settling to be read, even though the route it came from has not matched", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");

    expect(await store.get(postRoute.data)).toEqual(POSTS[0]);
    expect(store.get(postRoute).match).toBe(false);
  });
});

describe("asyncRouteAtom matching", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("doesn't match until its load has been settled", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(true);

    await preloadAsyncRoutes(store, [postRoute]);

    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(postRoute).match).toBe(true);
  });

  it("puts the loaded object on the route's values under the given name", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadAsyncRoutes(store, [postRoute]);

    const route = store.get(postRoute);
    expect(route.values).toEqual({ slug: "hello", post: { slug: "hello", title: "Hello" } });
    expect(route.exact).toBe(true);
  });

  it("doesn't match when the load finds nothing, so notAtom reports a not-found", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    const notFound = notAtom(blogRoute, postRoute);
    seed(store, "/blog/no-such-post");
    await preloadAsyncRoutes(store, [postRoute]);

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(notFound)).toBe(true);
  });

  it("is neither pending nor matched where its parent doesn't match at all", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    const load = vi.fn(findPost);
    seed(store, "/elsewhere");
    await preloadAsyncRoutes(store, [asyncRouteAtom(slugRoute, "post", load)]);

    expect(store.get(postRoute.pending)).toBe(false);
    expect(store.get(postRoute).match).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it("stops matching once a snapshot is stale for the new location", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadAsyncRoutes(store, [postRoute]);
    seed(store, "/blog/other");

    expect(store.get(postRoute).match).toBe(false);
    expect(store.get(postRoute.pending)).toBe(true);
  });

  it("reverses through its parent, ignoring the loaded object", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");
    await preloadAsyncRoutes(store, [postRoute]);

    expect(store.get(postRoute).reverse({ slug: "other", post: { slug: "other", title: "Other" } })).toBe(
      "/blog/other",
    );
  });

  it("treats a load that redirects as no match, leaving followAsyncRedirects to navigate", async () => {
    const gatedRoute = asyncRouteAtom(slugRoute, "post", async () => redirect("/login"));
    seed(store, "/blog/hello");
    await preloadAsyncRoutes(store, [gatedRoute]);

    expect(store.get(gatedRoute).match).toBe(false);
  });
});

describe("preloadAsyncRoutes", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("returns a serialisable snapshot per route, in the order given", async () => {
    const postRoute = asyncRouteAtom(slugRoute, "post", findPost);
    seed(store, "/blog/hello");

    expect(await preloadAsyncRoutes(store, [postRoute])).toEqual([
      { pathname: "/blog/hello", data: { slug: "hello", title: "Hello" } },
    ]);
  });

  it("doesn't load a route again once it is settled for this location", async () => {
    const load = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", load);
    seed(store, "/blog/hello");

    await preloadAsyncRoutes(store, [postRoute]);
    await preloadAsyncRoutes(store, [postRoute]);

    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("hydrateAsyncRoutes", () => {
  it("makes a route match from a server render's snapshot, without loading anything", () => {
    const load = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", load);
    const store = createStore();
    seed(store, "/blog/hello");

    hydrateAsyncRoutes(store, [postRoute], [{ pathname: "/blog/hello", data: POSTS[0] }]);

    expect(store.get(postRoute).values).toEqual({ slug: "hello", post: POSTS[0] });
    expect(load).not.toHaveBeenCalled();
  });
});

describe("followAsyncRoutes", () => {
  it("settles the load for each new location", async () => {
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

  it("leaves a hydrated route alone rather than loading it a second time", async () => {
    const load = vi.fn(findPost);
    const postRoute = asyncRouteAtom(slugRoute, "post", load);
    const store = createStore();
    seed(store, "/blog/hello");
    hydrateAsyncRoutes(store, [postRoute], [{ pathname: "/blog/hello", data: POSTS[0] }]);

    const unsubscribe = followAsyncRoutes(store, [postRoute]);
    await flush();

    expect(load).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("followAsyncRedirects", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("follows a redirect produced by a loader", async () => {
    const adminRoute = staticRouteAtom("admin");
    const adminData = asyncRouteAtom(adminRoute, "admin", async () => redirect("/login")).data;
    seed(store, "/admin");

    const unsubscribe = followAsyncRedirects(store, [adminData]);
    await flush();
    expect(store.get(locationAtom).pathname).toBe("/login");
    unsubscribe();
  });

  it("does not navigate when the loader returns normal data", async () => {
    const galleryRoute = staticRouteAtom("gallery");
    const galleryData = asyncRouteAtom(galleryRoute, "gallery", async () => ({ items: [] })).data;
    seed(store, "/gallery");

    const unsubscribe = followAsyncRedirects(store, [galleryData]);
    await flush();
    expect(store.get(locationAtom).pathname).toBe("/gallery");
    unsubscribe();
  });
});
