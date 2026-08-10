import { createStore } from "jotai/vanilla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    DefaultParams,
    RouteReturn,
    createRootAtom,
    locationAtom,
    paramRouteAtom,
    rootAtom,
    routeAtom,
    staticRouteAtom,
    transformRouteAtom,
} from "../routeAtom";

// RouteReturn is a discriminated union on `match` — asserting it here lets
// the rest of a test access `.rest`/`.values` on the matched branch without
// every call site having to re-narrow inline.
function assertMatch<T extends DefaultParams>(
    result: RouteReturn<T>,
): asserts result is RouteReturn<T> & { match: true } {
    if (!result.match) {
        throw new Error("expected route to match, but it did not");
    }
}

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
    store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

describe("rootAtom", () => {
    it("matches the root path exactly by default", () => {
        const store = createStore();

        const result = store.get(rootAtom);

        assertMatch(result);
        expect(result.exact).toBe(true);
        expect(result.rest.path).toEqual([]);
    });

    it("normalizes a trailing slash the same as no trailing slash", () => {
        const store = createStore();
        // A route whose own segment name embeds the trailing slash, so we can
        // exercise rootAtom's normalization purely through the atoms' own
        // setters rather than reaching into window.location directly.
        const trailing = routeAtom(
            (path) => (path === "trailing" ? {} : undefined),
            () => "trailing/",
        );

        store.set(trailing, {});

        const root = store.get(rootAtom);
        assertMatch(root);
        expect(root.rest.path).toEqual(["trailing"]);

        const result = store.get(trailing);
        assertMatch(result);
        expect(result.exact).toBe(true);
    });
});

describe("staticRouteAtom", () => {
    it("matches its own segment after navigating to it", () => {
        const store = createStore();
        const about = staticRouteAtom("about");

        store.set(about, {});

        const result = store.get(about);
        assertMatch(result);
        expect(result.exact).toBe(true);
    });

    it("does not match a different static segment", () => {
        const store = createStore();
        const about = staticRouteAtom("about");
        const contact = staticRouteAtom("contact");

        store.set(about, {});

        expect(store.get(about).match).toBe(true);
        expect(store.get(contact).match).toBe(false);
    });

    it("computes hrefs via reverse() without navigating", () => {
        const store = createStore();
        const about = staticRouteAtom("about");

        expect(store.get(about).reverse({})).toBe("/about");
    });
});

describe("paramRouteAtom", () => {
    it("extracts a dynamic segment's value", () => {
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });

        store.set(user, { id: "42" });

        const result = store.get(user);
        assertMatch(result);
        expect(result.values).toEqual({ id: "42" });
        expect(result.exact).toBe(true);
    });

    it("does not match its parent's own path when no segment is present", () => {
        // Regression: the matcher used to bind the param unconditionally, so a
        // param route reported an *exact* match on "/users" itself (with the param
        // undefined) - which made a section index and its param child render at the
        // same time. See packages/docs, where /docs rendered both the guide index
        // and a "not found" guide page.
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });

        store.set(users, {});

        expect(store.get(users).exact).toBe(true);
        const result = store.get(user);
        expect(result.match).toBe(false);
        expect(result.exact).toBe(false);
        expect(result.values).toBeUndefined();
    });

    it("builds nested hrefs through parent routes", () => {
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });

        expect(store.get(user).reverse({ id: "7" })).toBe("/users/7");
    });

    it("is not exact when there is leftover path beneath it, and nested children see it", () => {
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });
        const tab = staticRouteAtom("profile", { parent: user });

        store.set(tab, { id: "42" });

        const userResult = store.get(user);
        assertMatch(userResult);
        expect(userResult.values).toEqual({ id: "42" });
        expect(userResult.exact).toBe(false);

        const tabResult = store.get(tab);
        assertMatch(tabResult);
        expect(tabResult.exact).toBe(true);
    });
});

describe("nested composition", () => {
    it("does not match children when a parent segment differs", () => {
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });
        const about = staticRouteAtom("about");

        store.set(about, {});

        expect(store.get(user).match).toBe(false);
    });
});

describe("transformRouteAtom", () => {
    it("transforms values through to the underlying route atom on read and write", () => {
        const store = createStore();
        const users = staticRouteAtom("users");
        const user = paramRouteAtom("id", { parent: users });
        const numericUser = transformRouteAtom<{ id: string }, { id: number }>(
            user,
            (values) => ({ id: Number(values.id) }),
            (values) => ({ id: String(values.id) }),
        );

        store.set(numericUser, { id: 99 });

        const result = store.get(numericUser);
        assertMatch(result);
        expect(result.values).toEqual({ id: 99 });

        // The underlying route atom still deals in the untransformed (string) form.
        const underlying = store.get(user);
        assertMatch(underlying);
        expect(underlying.values).toEqual({ id: "99" });
    });
});

describe("routeAtom", () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
    });

    it("matches a static route", () => {
        const fooAtom = staticRouteAtom("foo");
        seed(store, "/foo");
        const result = store.get(fooAtom);
        expect(result.match).toBe(true);
        if (result.match) {
            expect(result.exact).toBe(true);
        }
    });

    it("does not match a different static route", () => {
        const fooAtom = staticRouteAtom("foo");
        seed(store, "/bar");
        expect(store.get(fooAtom).match).toBe(false);
    });

    it("matches a param route and captures the value", () => {
        const idAtom = paramRouteAtom("id");
        seed(store, "/42");
        const result = store.get(idAtom);
        expect(result.match).toBe(true);
        if (result.match) {
            expect(result.values).toEqual({ id: "42" });
        }
    });

    it("navigating writes the new pathname", () => {
        const fooAtom = staticRouteAtom("foo");
        seed(store, "/");
        store.set(fooAtom, {});
        expect(store.get(locationAtom).pathname).toBe("/foo");
    });

    it("navigating via a plain route drops any unrelated existing query string", () => {
        // Regression test: the original draft called
        // `set(locationAtom, { pathname })`, and since jotai-location's base
        // atom is a plain (non-merging) atom, that silently wiped out
        // searchParams/hash on every navigation. Now it's explicit: a route
        // without composed query atoms produces no query at all.
        const fooAtom = staticRouteAtom("foo");
        seed(store, "/", "a=1&b=2");
        store.set(fooAtom, {});
        expect(store.get(locationAtom).searchParams?.toString()).toBe("");
    });

    describe("navOptions", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("defaults to a push navigation", () => {
            const fooAtom = staticRouteAtom("foo");
            seed(store, "/");
            const pushSpy = vi.spyOn(window.history, "pushState");
            const replaceSpy = vi.spyOn(window.history, "replaceState");
            store.set(fooAtom, {});
            expect(pushSpy).toHaveBeenCalled();
            expect(replaceSpy).not.toHaveBeenCalled();
        });

        it("replace: true performs a replace navigation instead", () => {
            const fooAtom = staticRouteAtom("foo");
            seed(store, "/");
            const pushSpy = vi.spyOn(window.history, "pushState");
            const replaceSpy = vi.spyOn(window.history, "replaceState");
            store.set(fooAtom, {}, { replace: true });
            expect(replaceSpy).toHaveBeenCalled();
            expect(pushSpy).not.toHaveBeenCalled();
        });
    });
});

describe("createRootAtom with basePath", () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
    });

    it("matches at the base path itself", () => {
        const appRoot = createRootAtom({ basePath: "/app" });
        seed(store, "/app");
        const result = store.get(appRoot);
        expect(result.match).toBe(true);
        if (result.match) {
            expect(result.exact).toBe(true);
        }
    });

    it("strips the base path before matching children", () => {
        const appRoot = createRootAtom({ basePath: "/app" });
        const fooAtom = staticRouteAtom("foo", { parent: appRoot });
        seed(store, "/app/foo");
        expect(store.get(fooAtom).match).toBe(true);
    });

    it("does not match locations outside of the base path", () => {
        const appRoot = createRootAtom({ basePath: "/app" });
        seed(store, "/other");
        expect(store.get(appRoot).match).toBe(false);
    });

    it("does not treat a similarly-prefixed path as inside the base path", () => {
        // "/app-other" should NOT be considered inside basePath "/app"
        const appRoot = createRootAtom({ basePath: "/app" });
        seed(store, "/app-other");
        expect(store.get(appRoot).match).toBe(false);
    });

    it("reverse()/write prepend the base path", () => {
        const appRoot = createRootAtom({ basePath: "/app" });
        const fooAtom = staticRouteAtom("foo", { parent: appRoot });
        seed(store, "/app");
        const href = store.get(fooAtom).reverse({});
        expect(href).toBe("/app/foo");
        store.set(fooAtom, {});
        expect(store.get(locationAtom).pathname).toBe("/app/foo");
    });
});
