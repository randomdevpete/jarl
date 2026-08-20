import { useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { rootRouteAtom, queryParamRouteAtom, requireMatch, transformRouteAtom } from "jarl-atoms";
import { useRequiredRoute } from "jarl-react";
import { Table } from "./DataGridTable";
import { Ware, wares } from "./wares";

const sortColumns = [
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
const parseSort = (sort: string | undefined) => {
  if (!sort) {
    return defaultSort;
  }
  const direction: SortDirection = sort.startsWith("-") ? "desc" : "asc";
  const key = direction === "desc" ? sort.slice(1) : sort;
  return sortColumns.some((column) => column.key === key) ? { key: key as SortKey, direction } : defaultSort;
};

/** Inverse of parseSort. */
const stringifySort = (key: SortKey, direction: SortDirection) => (direction === "desc" ? `-${key}` : key);

const filterWares = (rows: Ware[], filter: string | undefined) => {
  if (!filter) return rows;
  const needle = filter.toLowerCase();
  return rows.filter(
    (ware) => ware.name.toLowerCase().includes(needle) || ware.category.toLowerCase().includes(needle),
  );
};

const sortWares = (rows: Ware[], key: SortKey, direction: SortDirection) => {
  const sorted = rows
    .slice()
    .sort((a, b) =>
      typeof a[key] === "number"
        ? (a[key] as number) - (b[key] as number)
        : String(a[key]).localeCompare(String(b[key])),
    );
  return direction === "desc" ? sorted.reverse() : sorted;
};

// The page this demo is mounted on, so everything below it is a plain module-level atom.
const gridRoot = rootRouteAtom({ basePath: "/demos/data-grid" });

// The raw "sort" query segment.
const sortParam = queryParamRouteAtom("sort", { parent: gridRoot });

const sortRoute = transformRouteAtom(
  sortParam,
  // Down: parse the raw query value into the shape the UI actually wants.
  (values) => parseSort(values.sort),
  // Up: serialize back to the raw string queryParamRouteAtom expects to write.
  (values) => ({ sort: stringifySort(values.key, values.direction) }),
);

// Chains off sortRoute, not sortParam - so filter's own values carry the already-parsed sort
// alongside the filter text. Writing here re-composes the whole chain back into a URL, so
// whichever field didn't change comes along for free via the current match.
const filterRoute = queryParamRouteAtom("filter", { parent: sortRoute });

// A plain read off the chain's tip - no useMemo in the component needed for this. Only the
// component below reads it, and the site only mounts that under /demos/data-grid, which is the
// guarantee `requireMatch` stands on.
const rowsAtom = atom((get) => {
  const { values } = requireMatch(get(filterRoute), "filterRoute");
  return sortWares(filterWares(wares, values.filter), values.key, values.direction);
});

// Local and un-navigated - only reaches the chain (and the URL) via filter's setter on submit.
const filterInputAtom = atom("");

/**
 * Self-contained demo: a data grid whose filter text and sort column/direction both live in the
 * URL query string (`?sort=-price&filter=axe`), so the grid's state is shareable/bookmarkable and
 * moves with back/forward navigation. Both query params are optional, so the chain matches wherever
 * its root does - no `<Route>` needed, just reading the atoms directly, with `useRequiredRoute`
 * standing in for the match the mount point already guarantees.
 */
export const DataGridApp = () => {
  const { values: currentFilter } = useRequiredRoute(filterRoute, "filterRoute");
  const setFilter = useSetAtom(filterRoute);
  const rows = useAtomValue(rowsAtom);
  const [filterInput, setFilterInput] = useAtom(filterInputAtom);

  // Keeps the input in sync with the URL when it changes some other way (back/forward, a
  // shared link) - the input is otherwise free-standing scratch state, not live-searching.
  useEffect(() => setFilterInput(currentFilter.filter ?? ""), [currentFilter.filter, setFilterInput]);

  const commitFilter = () => setFilter({ ...currentFilter, filter: filterInput || undefined });

  const toggleSort = (key: SortKey) =>
    setFilter({
      ...currentFilter,
      key,
      direction: currentFilter.key === key && currentFilter.direction === "asc" ? "desc" : "asc",
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
