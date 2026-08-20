import { createStore } from "jotai/vanilla";
import { describe, expect, it } from "vitest";
import { locationAtom } from "../locationAtom";
import { notAtom } from "../notAtom";
import { staticRouteAtom } from "../staticRouteAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string) => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
};

describe("notAtom", () => {
  it("matches when none of the given routes match", () => {
    const store = createStore();
    const about = staticRouteAtom("about");
    const users = staticRouteAtom("users");
    seed(store, "/nowhere");

    expect(store.get(notAtom(about, users))).toBe(true);
  });

  it("does not match when the only given route matches", () => {
    const store = createStore();
    const about = staticRouteAtom("about");
    seed(store, "/about");

    expect(store.get(notAtom(about))).toBe(false);
  });

  it("does not match when any of several given routes matches", () => {
    const store = createStore();
    const about = staticRouteAtom("about");
    const users = staticRouteAtom("users");
    const contact = staticRouteAtom("contact");
    seed(store, "/users");

    expect(store.get(notAtom(about, users, contact))).toBe(false);
  });

  it("checks exactness rather than a bare match", () => {
    // rootRouteAtom (and any ancestor) is `match: true` for every path beneath
    // it, so notAtom would never fire if it counted match instead of exact.
    const store = createStore();
    const about = staticRouteAtom("about");
    const team = staticRouteAtom("team", { parent: about });
    seed(store, "/about/team");

    expect(store.get(about).match).toBe(true);
    expect(store.get(about).exact).toBe(false);
    expect(store.get(notAtom(about))).toBe(true);
    expect(store.get(notAtom(about, team))).toBe(false);
  });
});
