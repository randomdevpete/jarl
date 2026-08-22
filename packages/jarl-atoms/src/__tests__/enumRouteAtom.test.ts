import { createStore } from "jotai/vanilla";
import { describe, expect, expectTypeOf, it } from "vitest";
import { enumRouteAtom } from "../enumRouteAtom";
import { locationAtom } from "../locationAtom";
import { paramRouteAtom } from "../paramRouteAtom";
import { requireMatch } from "../requireMatch";
import { staticRouteAtom } from "../staticRouteAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string) => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
};

const docs = staticRouteAtom("docs");
const guideRoute = enumRouteAtom("guide", ["getting-started", "data-loading"], { parent: docs });

describe("enumRouteAtom", () => {
  it("matches a segment in the set and binds it", () => {
    const store = createStore();
    seed(store, "/docs/data-loading");

    const route = store.get(guideRoute);

    expect(route.match).toBe(true);
    expect(route.exact).toBe(true);
    expect(route.values).toEqual({ guide: "data-loading" });
  });

  it("does not match a segment outside the set", () => {
    const store = createStore();
    seed(store, "/docs/nonsense");

    const route = store.get(guideRoute);

    expect(route.match).toBe(false);
    expect(route.values).toBeUndefined();
  });

  it("does not match its parent's own path, where there is no segment to bind", () => {
    const store = createStore();
    seed(store, "/docs");

    expect(store.get(guideRoute).match).toBe(false);
  });

  it("binds the value whatever order the set is written in", () => {
    const store = createStore();
    const reversed = enumRouteAtom("guide", ["data-loading", "getting-started"], { parent: docs });
    seed(store, "/docs/data-loading");

    expect(store.get(reversed).values).toEqual({ guide: "data-loading" });
  });

  it("types the bound value as the union of the set, not as a string", () => {
    const store = createStore();
    seed(store, "/docs/getting-started");

    const route = requireMatch(store.get(guideRoute), "guideRoute");

    expectTypeOf(route.values.guide).toEqualTypeOf<"getting-started" | "data-loading">();
    // @ts-expect-error - only the segments the route was given can be reversed, written or linked
    route.reverse({ guide: "no-such-guide" });
  });

  it("builds hrefs through reverse()", () => {
    const store = createStore();

    expect(store.get(guideRoute).reverse({ guide: "getting-started" })).toBe("/docs/getting-started");
  });

  it("navigates when written to", () => {
    const store = createStore();

    store.set(guideRoute, { guide: "data-loading" });

    expect(store.get(locationAtom).pathname).toBe("/docs/data-loading");
  });

  it("parents another route, consuming only its own segment", () => {
    const store = createStore();
    const section = paramRouteAtom("section", { parent: guideRoute });
    seed(store, "/docs/data-loading/suspense");

    const route = store.get(section);

    expect(route.match).toBe(true);
    expect(route.exact).toBe(true);
    expect(route.values).toEqual({ guide: "data-loading", section: "suspense" });
  });
});
