import { DefaultParams, RouteAtom, paramRouteAtom, rootAtom, staticRouteAtom } from "jarl-atoms";
import { Route, Switch, useAtom } from "jarl-react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import { countRender } from "../../renderCounter";
import { DeepParams, deepLinks, depths } from "../../shapeDeep";
import type { BenchApp } from "../types";
import { DeepHome, DeepNotFound, Level } from "./sharedDeepComponents";

// One route atom per level, each chained on the one above: /d1/:p1/d2/:p2/…
export const levelRoutes = depths.reduce<RouteAtom<DefaultParams>[]>((chain, depth) => {
  const parent = chain.at(-1);
  const section = staticRouteAtom(`d${depth}`, parent && { parent });
  return [...chain, paramRouteAtom(`p${depth}`, { parent: section })];
}, []);

const leafRoute = levelRoutes.at(-1)!;

const NavItem = ({ to, label }: { to: DeepParams; label: string }) => {
  countRender("nav link");
  const [state, setRoute] = useAtom(leafRoute);
  // Route-level `active` narrowed to href-level, as in JarlApp.
  const active = state.exact && depths.every((d) => (state.values as DeepParams)[`p${d}`] === to[`p${d}`]);
  return (
    <a
      href={state.reverse(to)}
      className={active ? "active" : undefined}
      onClick={(event) => {
        event.preventDefault();
        setRoute(to);
      }}
    >
      {label}
    </a>
  );
};

const Nav = () => (
  <nav>
    {deepLinks.map(({ label, params }) => (
      <NavItem key={label} to={params} label={label} />
    ))}
  </nav>
);

// Innermost first: each level's element wraps the next in a single-route Switch.
const nested = depths.reduceRight<ReactNode>(
  (children, depth) => (
    <Route on={levelRoutes[depth - 1]} exact={depth === depths.length}>
      {(values) => (
        <Level depth={depth} value={(values as DeepParams)[`p${depth}`]}>
          {children && <Switch fallback={<DeepNotFound />}>{children}</Switch>}
        </Level>
      )}
    </Route>
  ),
  null,
);

const Shell = () => {
  countRender("shell");
  return (
    <div>
      <Nav />
      <main>
        <Switch fallback={<DeepNotFound />}>
          <Route on={rootAtom} exact>
            <DeepHome />
          </Route>
          {nested}
        </Switch>
      </main>
    </div>
  );
};

export const createJarlDeepApp = (): BenchApp => ({
  element: (
    <Provider store={createStore()}>
      <Shell />
    </Provider>
  ),
});
