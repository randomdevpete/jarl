import { paramRouteAtom } from "./paramRouteAtom";
import { transformRouteAtom } from "./transformRouteAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

/** Options for `numericRouteAtom`: the common route options plus an inclusive numeric range. */
export type NumericRouteOptions<Parent extends DefaultParams> = RouteOptions<Parent> & {
  /** Segments below this don't match. */
  min?: number;
  /** Segments above this don't match. */
  max?: number;
};

const NUMERIC_SEGMENT = /^\d+$/;

/**
 * Binds one dynamic path segment to a named non-negative integer: `numericRouteAtom("year", {
 * parent: blog, min: 2000 })` matches `/blog/:year` and yields `{ year: 2024 }` as a number
 * rather than a string. A segment that isn't all digits, or falls outside `min`/`max`, doesn't
 * match at all - it's a plain `paramRouteAtom` with a `transformRouteAtom` layered on top, the
 * usual way to build a constrained segment from the existing primitives.
 */
export const numericRouteAtom = <T extends string, Parent extends DefaultParams>(
  name: T,
  options?: NumericRouteOptions<Parent>,
): RouteAtom<{ [key in T]: number } & Parent> => {
  const param = paramRouteAtom(name, options);
  return transformRouteAtom<{ [key in T]: string } & Parent, { [key in T]: number } & Parent>(
    param,
    (values) => {
      const raw = values[name];
      if (!NUMERIC_SEGMENT.test(raw)) return undefined;
      const num = Number(raw);
      if (options?.min !== undefined && num < options.min) return undefined;
      if (options?.max !== undefined && num > options.max) return undefined;
      return { ...values, [name]: num } as unknown as { [key in T]: number } & Parent;
    },
    (values) => ({ ...values, [name]: String(values[name]) }) as unknown as { [key in T]: string } & Parent,
  );
};
