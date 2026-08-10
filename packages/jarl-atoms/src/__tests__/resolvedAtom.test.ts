import { atom, createStore } from "jotai/vanilla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locationAtom, staticRouteAtom } from "../routeAtom";
import { isRedirect, redirect } from "../redirectAtom";
import { followResolvedRedirects, resolvedAtom } from "../resolvedAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
    store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

describe("resolvedAtom", () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
    });

    it("is undefined when the route doesn't match, without calling the resolver", async () => {
        const galleryAtom = staticRouteAtom("gallery");
        const resolver = vi.fn(async () => ({ items: [] }));
        const galleryData = resolvedAtom(galleryAtom, resolver);
        seed(store, "/somewhere-else");
        const value = await store.get(galleryData);
        expect(value).toBeUndefined();
        expect(resolver).not.toHaveBeenCalled();
    });

    it("resolves the loader's data once the route matches", async () => {
        const galleryAtom = staticRouteAtom("gallery");
        const galleryData = resolvedAtom(galleryAtom, async () => ({
            items: ["a", "b"],
        }));
        seed(store, "/gallery");
        const value = await store.get(galleryData);
        expect(value).toEqual({ items: ["a", "b"] });
    });

    it("passes matched route values into the loader", async () => {
        const galleryAtom = staticRouteAtom("gallery");
        const loader = vi.fn(async (values) => ({ values }));
        const galleryData = resolvedAtom(galleryAtom, loader);
        seed(store, "/gallery");
        await store.get(galleryData);
        expect(loader).toHaveBeenCalledWith({}, expect.any(Function));
    });

    it("a resolver can return a Redirect instead of data", async () => {
        const adminAtom = staticRouteAtom("admin");
        const adminData = resolvedAtom(adminAtom, async () => redirect("/login"));
        seed(store, "/admin");
        const value = await store.get(adminData);
        expect(value).toEqual(redirect("/login"));
    });

    it("composes: a dependent resolvedAtom can await another one (v1's 'nested resolves run in series')", async () => {
        const userAtom = staticRouteAtom("user");
        const userData = resolvedAtom(userAtom, async () => ({ id: "u1" }));
        // A second resolved atom that depends on the first resolving, expressed
        // as an ordinary derived async atom - no bespoke "series" plumbing
        // needed, jotai's own async dependency graph handles the ordering.
        const userPostsData = atom(async (get) => {
            const user = await get(userData);
            // resolvedAtom resolves to the route's data, a Redirect, or undefined -
            // narrow the redirect case out before touching the data shape.
            if (!user || isRedirect(user)) return undefined;
            return { postsFor: user.id };
        });
        seed(store, "/user");
        const value = await store.get(userPostsData);
        expect(value).toEqual({ postsFor: "u1" });
    });
});

describe("followResolvedRedirects", () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it("follows a redirect produced by a resolver", async () => {
        const adminAtom = staticRouteAtom("admin");
        const adminData = resolvedAtom(adminAtom, async () => redirect("/login"));
        seed(store, "/admin");

        const unsubscribe = followResolvedRedirects(store, [adminData]);
        await flush();
        expect(store.get(locationAtom).pathname).toBe("/login");
        unsubscribe();
    });

    it("does not navigate when the resolver returns normal data", async () => {
        const galleryAtom = staticRouteAtom("gallery");
        const galleryData = resolvedAtom(galleryAtom, async () => ({
            items: [],
        }));
        seed(store, "/gallery");

        const unsubscribe = followResolvedRedirects(store, [galleryData]);
        await flush();
        expect(store.get(locationAtom).pathname).toBe("/gallery");
        unsubscribe();
    });
});
