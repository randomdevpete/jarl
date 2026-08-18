import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { DefaultParams, queryParamAtom, rootAtom as defaultRootAtom, RouteAtom } from "jarl-atoms";
import { Route } from "jarl-react";
import styled from "@emotion/styled";
import { theme } from "../theme";
import { filterWares, parseSort, sortColumns, sortWares, stringifySort, SortDirection, SortKey, wares } from "./wares";

// The demo's whole state hangs off whatever root it is given, so the app never knows the
// URL it is mounted on. `filter` chains off `sort` so writing either one round-trips
// through the same href and keeps the other. `rows` and `activeSort` are derived atoms reading
// off `filter`, so the grid's data and header state are plain jotai reads rather than component
// state recomputed with useMemo. `filterInput` is a separate, un-navigated atom for the
// controlled input - it only reaches the URL (via `filter`'s setter) on submit.
const createGridRoutes = (root: RouteAtom<DefaultParams>) => {
  const sort = queryParamAtom("sort", { parent: root });
  const filter = queryParamAtom("filter", { parent: sort });
  const activeSort = atom((get) => parseSort(get(filter).values?.sort));
  const rows = atom((get) => {
    const { direction, key } = get(activeSort);
    return sortWares(filterWares(wares, get(filter).values?.filter), key, direction);
  });
  const filterInput = atom("");
  return { sort, filter, activeSort, rows, filterInput };
};

type GridRoutes = ReturnType<typeof createGridRoutes>;

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

const Grid = ({
  routes,
  sort,
  filter,
}: {
  routes: GridRoutes;
  sort: string | undefined;
  filter: string | undefined;
}) => {
  const setFilterRoute = useSetAtom(routes.filter);
  const { key: sortKey, direction } = useAtomValue(routes.activeSort);
  const rows = useAtomValue(routes.rows);
  const [filterInput, setFilterInput] = useAtom(routes.filterInput);

  // Keeps the input in sync with the URL when it changes some other way (back/forward, a
  // shared link) - the input is otherwise free-standing scratch state, not live-searching.
  useEffect(() => setFilterInput(filter ?? ""), [filter, setFilterInput]);

  const commitFilter = () => setFilterRoute({ sort, filter: filterInput || undefined });

  const toggleSort = (key: SortKey) => {
    const nextDirection: SortDirection = sortKey === key && direction === "asc" ? "desc" : "asc";
    setFilterRoute({ sort: stringifySort(key, nextDirection), filter });
  };

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
              <td colSpan={sortColumns.length}>No wares match &ldquo;{filter ?? ""}&rdquo;.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

/**
 * Self-contained demo: a data grid whose filter text and sort column/direction both live in the
 * URL query string (`?sort=-price&filter=axe`), so the grid's state is shareable/bookmarkable and
 * moves with back/forward navigation. Pass the route atom it is mounted on as `rootAtom`.
 */
export const DataGridApp = ({ rootAtom = defaultRootAtom }: { rootAtom?: RouteAtom<DefaultParams> }) => {
  const routes = useMemo(() => createGridRoutes(rootAtom), [rootAtom]);
  return <Route on={routes.filter}>{({ sort, filter }) => <Grid routes={routes} sort={sort} filter={filter} />}</Route>;
};

export default DataGridApp;
