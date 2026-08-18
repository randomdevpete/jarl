import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { DefaultParams, queryParamAtom, rootAtom as defaultRootAtom, RouteAtom, transformRouteAtom } from "jarl-atoms";
import styled from "@emotion/styled";
import { theme } from "../theme";
import { filterWares, parseSort, sortColumns, sortWares, stringifySort, SortKey, wares } from "./wares";

// Built fresh per rootAtom (memoised in the component below) since atoms are meant to be
// stable references - recreating them every render would resubscribe everything each time.
const createGridRoutes = (root: RouteAtom<DefaultParams>) => {
  // The raw "sort" query segment, chained off whatever root this demo is mounted on.
  const sort = queryParamAtom("sort", { parent: root });
  const activeSort = transformRouteAtom(
    sort,
    // Down: parse the raw query value into the shape the UI actually wants.
    (values) => parseSort(values.sort),
    // Up: serialize back to the raw string queryParamAtom expects to write.
    (values) => ({ sort: stringifySort(values.key, values.direction) }),
  );
  // Chains off activeSort, not sort - so filter's own values carry the already-parsed sort
  // alongside the filter text. Writing here re-composes the whole chain back into a URL, so
  // whichever field didn't change comes along for free via the current match.
  const filter = queryParamAtom("filter", { parent: activeSort });
  // A plain read off the chain's tip - no useMemo in the component needed for this.
  const rows = atom((get) => {
    const values = get(filter).values ?? { ...parseSort(undefined), filter: undefined };
    return sortWares(filterWares(wares, values.filter), values.key, values.direction);
  });
  // Local and un-navigated - only reaches the chain (and the URL) via filter's setter on submit.
  const filterInput = atom("");
  return { filter, rows, filterInput };
};

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    text-align: left;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid ${theme.border};
  }

  th button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
`;

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
  const { key: sortKey, direction } = filter.values ?? parseSort(undefined);
  const rows = useAtomValue(routes.rows);
  const [filterInput, setFilterInput] = useAtom(routes.filterInput);

  // Keeps the input in sync with the URL when it changes some other way (back/forward, a
  // shared link) - the input is otherwise free-standing scratch state, not live-searching.
  useEffect(() => setFilterInput(filter.values?.filter ?? ""), [filter.values?.filter, setFilterInput]);

  const commitFilter = () => setFilter({ key: sortKey, direction, filter: filterInput || undefined });

  const toggleSort = (key: SortKey) =>
    setFilter({
      key,
      direction: sortKey === key && direction === "asc" ? "desc" : "asc",
      filter: filter.values?.filter,
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
                  {sortKey === column.key ? (direction === "asc" ? " ▲" : " ▼") : ""}
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
              <td colSpan={sortColumns.length}>No wares match &ldquo;{filter.values?.filter ?? ""}&rdquo;.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default DataGridApp;
