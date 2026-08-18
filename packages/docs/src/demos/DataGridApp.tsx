import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { DefaultParams, queryParamAtom, rootAtom as defaultRootAtom, RouteAtom, transformRouteAtom } from "jarl-atoms";
import { Table } from "./DataGridTable";
import { Ware, wares } from "./wares";

export const sortColumns = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price (silver)" },
  { key: "stock", label: "Stock" },
] as const;

type SortKey = (typeof sortColumns)[number]["key"];
type SortDirection = "asc" | "desc";

const defaultSort = { key: "name", direction: "asc" } as const;

/** Parses a `sort` query value like "-price" into a column key and direction; falls back to
 * name/ascending for anything missing or unrecognised. */
export const parseSort = (sort: string | undefined) => {
  if (!sort) {
    return defaultSort;
  }
  const direction: SortDirection = sort.startsWith("-") ? "desc" : "asc";
  const key = direction === "desc" ? sort.slice(1) : sort;
  return sortColumns.some((column) => column.key === key) ? { key: key as SortKey, direction } : defaultSort;
};

/** Inverse of parseSort. */
export const stringifySort = (key: SortKey, direction: SortDirection) => (direction === "desc" ? `-${key}` : key);

export const filterWares = (rows: Ware[], filter: string | undefined) => {
  if (!filter) return rows;
  const needle = filter.toLowerCase();
  return rows.filter(
    (ware) => ware.name.toLowerCase().includes(needle) || ware.category.toLowerCase().includes(needle),
  );
};

export const sortWares = (rows: Ware[], key: SortKey, direction: SortDirection) => {
  const sorted = rows
    .slice()
    .sort((a, b) =>
      typeof a[key] === "number"
        ? (a[key] as number) - (b[key] as number)
        : String(a[key]).localeCompare(String(b[key])),
    );
  return direction === "desc" ? sorted.reverse() : sorted;
};

// Only a factory because this demo harness mounts at any root - a real app declares these as
// static atoms. Memoised in the component below so they stay stable references across renders.
const createGridRoutes = (root: RouteAtom<DefaultParams>) => {
  // The raw "sort" query segment, chained off whatever root this demo is mounted on.
  const sort = queryParamAtom("sort", { parent: root });
  const parsedSort = transformRouteAtom(
    sort,
    // Down: parse the raw query value into the shape the UI actually wants.
    (values) => parseSort(values.sort),
    // Up: serialize back to the raw string queryParamAtom expects to write.
    (values) => ({ sort: stringifySort(values.key, values.direction) }),
  );
  // Chains off parsedSort, not sort - so filter's own values carry the already-parsed sort
  // alongside the filter text. Writing here re-composes the whole chain back into a URL, so
  // whichever field didn't change comes along for free via the current match.
  const filter = queryParamAtom("filter", { parent: parsedSort });
  // A plain read off the chain's tip - no useMemo in the component needed for this.
  const rows = atom((get) => {
    const values = get(filter).values ?? { ...parseSort(undefined), filter: undefined };
    return sortWares(filterWares(wares, values.filter), values.key, values.direction);
  });
  return { filter, rows };
};

// Doesn't depend on root, so it's a single static atom rather than one more thing
// createGridRoutes has to build per instance. Local and un-navigated - only reaches the chain
// (and the URL) via filter's setter on submit.
const filterInputAtom = atom("");

// State is never really undefined because the optional query params always match;
// but since this can't be confirmed with the types, use a default
const defaultFilter = { ...parseSort(undefined), filter: undefined };

/**
 * Self-contained demo: a data grid whose filter text and sort column/direction both live in the
 * URL query string (`?sort=-price&filter=axe`), so the grid's state is shareable/bookmarkable and
 * moves with back/forward navigation. Pass the route atom it is mounted on as `rootAtom`. Both
 * query params are optional, so the route always matches - no `<Route>` needed, just reading the
 * atoms directly.
 */
export const DataGridApp = ({ rootAtom = defaultRootAtom }: { rootAtom?: RouteAtom<DefaultParams> }) => {
  const routes = useMemo(() => createGridRoutes(rootAtom), [rootAtom]);
  const [filter, setFilter] = useAtom(routes.filter);
  const rows = useAtomValue(routes.rows);
  const [filterInput, setFilterInput] = useAtom(filterInputAtom);

  const currentFilter = filter.values ?? defaultFilter;

  // Keeps the input in sync with the URL when it changes some other way (back/forward, a
  // shared link) - the input is otherwise free-standing scratch state, not live-searching.
  useEffect(() => setFilterInput(currentFilter.filter ?? ""), [currentFilter.filter, setFilterInput]);

  const commitFilter = () => setFilter({ ...currentFilter, filter: filterInput || undefined });

  const toggleSort = (key: SortKey) =>
    setFilter({
      ...currentFilter,
      key,
      direction: filter.values?.key === key && filter.values?.direction === "asc" ? "desc" : "asc",
    });

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          commitFilter();
        }}
      >
        <label>
          Filter{" "}
          <input
            type="text"
            value={filterInput}
            onChange={(event) => setFilterInput(event.target.value)}
            placeholder="name or category"
          />
        </label>
        <button type="submit">Search</button>
      </form>
      <Table>
        <thead>
          <tr>
            {sortColumns.map((column) => (
              <th key={column.key}>
                <button type="button" onClick={() => toggleSort(column.key)}>
                  {column.label}
                  {currentFilter.key === column.key ? (currentFilter.direction === "asc" ? " ▲" : " ▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ware) => (
            <tr key={ware.id}>
              <td>{ware.name}</td>
              <td>{ware.category}</td>
              <td>{ware.price}</td>
              <td>{ware.stock}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={sortColumns.length}>No wares match &ldquo;{currentFilter.filter ?? ""}&rdquo;.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default DataGridApp;
