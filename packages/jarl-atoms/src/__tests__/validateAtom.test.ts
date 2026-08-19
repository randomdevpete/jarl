import { atom, createStore } from "jotai/vanilla";
import { describe, expect, it } from "vitest";
import { locationAtom } from "../locationAtom";
import { numericRouteAtom } from "../numericRouteAtom";
import { paramRouteAtom } from "../paramRouteAtom";
import { staticRouteAtom } from "../staticRouteAtom";
import { validateAtom } from "../validateAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string) => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
};

const isValidCalendarDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const calendarRoute = () => {
  const blog = staticRouteAtom("blog");
  const year = numericRouteAtom("year", { parent: blog });
  const month = numericRouteAtom("month", { parent: year, min: 1, max: 12 });
  const day = numericRouteAtom("day", { parent: month });
  return validateAtom(day, (values) => isValidCalendarDate(values.year, values.month, values.day));
};

describe("validateAtom", () => {
  it("matches, with the wrapped route's values, when the predicate accepts", () => {
    const store = createStore();
    const date = calendarRoute();
    seed(store, "/blog/2024/02/29");

    const result = store.get(date);

    expect(result.match).toBe(true);
    expect(result.exact).toBe(true);
    expect(result.values).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it("does not match when the predicate rejects", () => {
    const store = createStore();
    const date = calendarRoute();
    // 2023 isn't a leap year, so this is the same URL shape with no calendar date behind it.
    seed(store, "/blog/2023/02/29");

    const result = store.get(date);

    expect(result.match).toBe(false);
    expect(result.exact).toBe(false);
    expect(result.values).toBeUndefined();
  });

  it("unmatches every child route below a rejected value", () => {
    const store = createStore();
    const date = calendarRoute();
    const post = paramRouteAtom("slug", { parent: date });
    seed(store, "/blog/2023/02/29/hello-world");

    expect(store.get(post).match).toBe(false);

    seed(store, "/blog/2024/02/29/hello-world");

    const result = store.get(post);
    expect(result.match).toBe(true);
    expect(result.values).toEqual({ year: 2024, month: 2, day: 29, slug: "hello-world" });
  });

  it("stays exact-aware, matching non-exactly when a child segment follows", () => {
    const store = createStore();
    const date = calendarRoute();
    seed(store, "/blog/2024/02/29/hello-world");

    const result = store.get(date);

    expect(result.match).toBe(true);
    expect(result.exact).toBe(false);
  });

  it("navigates and reverses through to the wrapped route", () => {
    const store = createStore();
    const date = calendarRoute();

    expect(store.get(date).reverse({ year: 2024, month: 2, day: 29 })).toBe("/blog/2024/2/29");

    store.set(date, { year: 2024, month: 2, day: 29 });

    expect(store.get(locationAtom).pathname).toBe("/blog/2024/2/29");
    expect(store.get(date).match).toBe(true);
  });

  it("re-evaluates when an atom the predicate reads changes", () => {
    const store = createStore();
    const openYears = atom([2024]);
    const year = numericRouteAtom("year", { parent: staticRouteAtom("blog") });
    const open = validateAtom(year, (values, get) => get(openYears).includes(values.year));
    seed(store, "/blog/2023");

    expect(store.get(open).match).toBe(false);

    store.set(openYears, [2023, 2024]);

    expect(store.get(open).match).toBe(true);
  });
});
