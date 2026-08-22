import { createStore } from "jotai/vanilla";
import { describe, expect, expectTypeOf, it } from "vitest";
import { locationAtom } from "../locationAtom";
import { numericRouteAtom } from "../numericRouteAtom";
import { paramRouteAtom } from "../paramRouteAtom";
import { staticRouteAtom } from "../staticRouteAtom";
import { unionRouteAtom } from "../unionRouteAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string) => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
};

const blog = staticRouteAtom("blog");
const year = numericRouteAtom("year", { parent: blog });
const month = numericRouteAtom("month", { parent: year, min: 1, max: 12 });
const day = numericRouteAtom("day", { parent: month, min: 1, max: 31 });
const anyDate = unionRouteAtom([year, month, day]);

describe("unionRouteAtom", () => {
  it("matches wherever any of its members does", () => {
    const store = createStore();

    for (const pathname of ["/blog/2024", "/blog/2024/06", "/blog/2024/06/12"]) {
      seed(store, pathname);
      expect(store.get(anyDate).exact).toBe(true);
    }
  });

  it("does not match where no member does", () => {
    const store = createStore();
    seed(store, "/elsewhere");

    const route = store.get(anyDate);

    expect(route.match).toBe(false);
    expect(route.values).toBeUndefined();
  });

  it("binds the values of the member that matched", () => {
    const store = createStore();
    seed(store, "/blog/2024/06");

    expect(store.get(anyDate).values).toEqual({ year: 2024, month: 6 });
  });

  it("takes the exactly matching member whatever order the members are in", () => {
    const store = createStore();
    seed(store, "/blog/2024/06/12");

    // `year` and `month` match this location too, as non-exact ancestors.
    for (const route of [anyDate, unionRouteAtom([day, month, year])]) {
      expect(store.get(route).values).toEqual({ year: 2024, month: 6, day: 12 });
    }
  });

  it("falls back to the first member that matches when none matches exactly", () => {
    const store = createStore();
    seed(store, "/blog/2024/06/12/deeper");

    expect(store.get(anyDate).values).toEqual({ year: 2024 });
    expect(store.get(unionRouteAtom([day, month, year])).values).toEqual({ year: 2024, month: 6, day: 12 });
  });

  it("binds a union of its members' param types", () => {
    const store = createStore();
    seed(store, "/blog/2024");

    const { values } = store.get(anyDate);

    expectTypeOf(values).toEqualTypeOf<
      | { year: number }
      | ({ month: number } & { year: number })
      | ({ day: number } & { month: number } & { year: number })
      | undefined
    >();
  });

  it("composes as a parent, nesting under whichever member matched", () => {
    const store = createStore();
    const slug = paramRouteAtom("slug", { parent: unionRouteAtom([month, year]) });
    seed(store, "/blog/2024/06/some-post");

    expect(store.get(slug).values).toEqual({ year: 2024, month: 6, slug: "some-post" });
  });

  it("reverses and navigates through the member that matches", () => {
    const store = createStore();
    seed(store, "/blog/2024/06");

    expect(store.get(anyDate).reverse({ year: 2025, month: 3 })).toBe("/blog/2025/3");

    store.set(anyDate, { year: 2025, month: 3 });
    expect(store.get(locationAtom).pathname).toBe("/blog/2025/3");
  });

  it("reverses through the first member when nothing matches", () => {
    const store = createStore();
    seed(store, "/elsewhere");

    expect(store.get(anyDate).reverse({ year: 2024 })).toBe("/blog/2024");
  });
});
