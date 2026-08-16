import { useMemo } from "react";
import { DefaultParams, queryParamAtom, rootAtom as defaultRootAtom, RouteAtom } from "jarl-atoms";
import { Route, useNavigate } from "jarl-react";
import styled from "@emotion/styled";
import { theme } from "../theme";
import { filterWares, parseSort, sortColumns, sortWares, stringifySort, SortDirection, SortKey, wares } from "./wares";

// The demo's whole state hangs off whatever root it is given, so the app never knows the
// URL it is mounted on. `filter` chains off `sort` so writing either one round-trips
// through the same href and keeps the other.
const createGridRoutes = (root: RouteAtom<DefaultParams>) => {
  const sort = queryParamAtom("sort", { parent: root });
  const filter = queryParamAtom("filter", { parent: sort });
  return { sort, filter };
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
  const navigate = useNavigate(routes.filter);
  const { key: sortKey, direction } = parseSort(sort);
  const filterText = filter ?? "";
  const rows = useMemo(
    () => sortWares(filterWares(wares, filterText), sortKey, direction),
    [filterText, sortKey, direction],
  );

  const setFilter = (next: string) => navigate({ sort, filter: next || undefined });

  const toggleSort = (key: SortKey) => {
    const nextDirection: SortDirection = sortKey === key && direction === "asc" ? "desc" : "asc";
    navigate({ sort: stringifySort(key, nextDirection), filter });
  };

  return (
    <div>
      <label>
        Filter{" "}
        <input
          type="text"
          value={filterText}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="name or category"
        />
      </label>
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
              <td colSpan={sortColumns.length}>No wares match &ldquo;{filterText}&rdquo;.</td>
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
