import { useEffect, useMemo } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { DefaultParams, queryParamAtom, rootAtom as defaultRootAtom, RouteAtom, transformRouteAtom } from "jarl-atoms";
import styled from "@emotion/styled";
import { theme } from "../theme";
import { filterWares, parseSort, sortColumns, sortWares, stringifySort, SortKey, wares } from "./wares";

// The demo's whole state hangs off whatever root it is given, so the app never knows the URL
// it is mounted on. `activeSort` reshapes the raw `sort` query value into `{key, direction}` and
// back via `transformRouteAtom`. `filter` chains off `activeSort` rather than `sort` directly,
// so its own values carry the already-parsed sort alongside the filter text - one atom with
// everything the grid needs, and writing it always round-trips whichever field didn't change.
// `rows` derives off that. `filterInput` is a separate, un-navigated atom for the controlled
// input - it only reaches the URL (via `filter`'s setter) on submit.
const createGridRoutes = (root: RouteAtom<DefaultParams>) => {
  const sort = queryParamAtom("sort", { parent: root });
  const activeSort = transformRouteAtom(
    sort,
    (values) => parseSort(values.sort),
    (values) => ({ sort: stringifySort(values.key, values.direction) }),
  );
  const filter = queryParamAtom("filter", { parent: activeSort });
  const rows = atom((get) => {
    const values = get(filter).values ?? { ...parseSort(undefined), filter: undefined };
    return sortWares(filterWares(wares, values.filter), values.key, values.direction);
  });
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
  const { values } = useAtomValue(routes.filter);
  const { key: sortKey, direction } = values ?? parseSort(undefined);
  const rows = useAtomValue(routes.rows);
  const [filterInput, setFilterInput] = useAtom(routes.filterInput);
  const setGrid = useSetAtom(routes.filter);

  // Keeps the input in sync with the URL when it changes some other way (back/forward, a
  // shared link) - the input is otherwise free-standing scratch state, not live-searching.
  useEffect(() => setFilterInput(values?.filter ?? ""), [values?.filter, setFilterInput]);

  const commitFilter = () => setGrid({ key: sortKey, direction, filter: filterInput || undefined });

  const toggleSort = (key: SortKey) =>
    setGrid({ key, direction: sortKey === key && direction === "asc" ? "desc" : "asc", filter: values?.filter });

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
              <td colSpan={sortColumns.length}>No wares match &ldquo;{values?.filter ?? ""}&rdquo;.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default DataGridApp;
