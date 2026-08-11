import { createStore } from "jotai/vanilla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locationAtom, staticRouteAtom } from "../routeAtom";
import { queryParamAtom } from "../queryAtom";
import { Redirect, followRedirects, isRedirect, redirect, redirectAtom } from "../redirectAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

describe("redirect / isRedirect", () => {
  it("wraps a target path in a Redirect marker", () => {
    const value = redirect("/elsewhere");
    expect(value).toBeInstanceOf(Redirect);
    expect(value.to).toBe("/elsewhere");
  });

  it("isRedirect distinguishes Redirect values from anything else", () => {
    expect(isRedirect(redirect("/x"))).toBe(true);
    expect(isRedirect("/x")).toBe(false);
    expect(isRedirect(undefined)).toBe(false);
    expect(isRedirect({ to: "/x" })).toBe(false);
  });
});

describe("redirectAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("matches whenever its parent matches, static target", () => {
    const movedAtom = staticRouteAtom("moved");
    const toHome = redirectAtom("/", { parent: movedAtom });
    seed(store, "/moved");
    expect(store.get(toHome).match).toBe(true);
  });

  it("does not match when its parent doesn't match", () => {
    const movedAtom = staticRouteAtom("moved");
    const toHome = redirectAtom("/", { parent: movedAtom });
    seed(store, "/somewhere-else");
    expect(store.get(toHome).match).toBe(false);
  });

  it("swallows any remaining path (exact: true, no children can match beneath it)", () => {
    const movedAtom = staticRouteAtom("moved");
    const toHome = redirectAtom("/", { parent: movedAtom });
    seed(store, "/moved/some/deep/path");
    const result = store.get(toHome);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.exact).toBe(true);
      expect(result.rest.path).toEqual([]);
    }
  });

  it("supports a dynamic target computed from other atoms", () => {
    const reasonAtom = queryParamAtom("because");
    const movedAtom = staticRouteAtom("moved");
    const toHomeWithReason = redirectAtom((get) => `/?because=${get(reasonAtom).values?.because ?? "unknown"}`, {
      parent: movedAtom,
    });
    seed(store, "/moved", "because=Permanently%20moved");
    expect(store.get(toHomeWithReason).reverse({})).toBe("/?because=Permanently moved");
  });

  it("writing performs a replace navigation to the target", () => {
    const movedAtom = staticRouteAtom("moved");
    const toHome = redirectAtom("/", { parent: movedAtom });
    seed(store, "/moved");
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    store.set(toHome, {});
    expect(store.get(locationAtom).pathname).toBe("/");
    expect(replaceSpy).toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("followRedirects", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("follows immediately if the redirect already matches when subscribed", () => {
    const banned = queryParamAtom("banned", { required: true });
    const toBannedPage = redirectAtom("/banned-page", { parent: banned });
    seed(store, "/", "banned=1");

    const unsubscribe = followRedirects(store, [toBannedPage]);
    expect(store.get(locationAtom).pathname).toBe("/banned-page");
    unsubscribe();
  });

  it("does nothing while the redirect doesn't match", () => {
    const banned = queryParamAtom("banned", { required: true });
    const toBannedPage = redirectAtom("/banned-page", { parent: banned });
    seed(store, "/");

    const unsubscribe = followRedirects(store, [toBannedPage]);
    expect(store.get(locationAtom).pathname).toBe("/");
    unsubscribe();
  });

  it("follows once the condition starts matching later", () => {
    const banned = queryParamAtom("banned", { required: true });
    const toBannedPage = redirectAtom("/banned-page", { parent: banned });
    seed(store, "/");

    const unsubscribe = followRedirects(store, [toBannedPage]);
    expect(store.get(locationAtom).pathname).toBe("/");

    seed(store, "/", "banned=1");
    expect(store.get(locationAtom).pathname).toBe("/banned-page");
    unsubscribe();
  });

  it("stops reacting once unsubscribed", () => {
    const banned = queryParamAtom("banned", { required: true });
    const toBannedPage = redirectAtom("/banned-page", { parent: banned });
    seed(store, "/");

    const unsubscribe = followRedirects(store, [toBannedPage]);
    unsubscribe();

    seed(store, "/", "banned=1");
    expect(store.get(locationAtom).pathname).toBe("/");
  });
});
