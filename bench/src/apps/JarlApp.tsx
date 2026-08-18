import { DefaultParams, RouteAtom, paramRouteAtom, rootAtom, staticRouteAtom } from "jarl-atoms";
import { Route, Switch, useAtom } from "jarl-react";
import { Provider, createStore } from "jotai";
import { countRender } from "../renderCounter";
import { itemIds } from "../shape";
import { AboutPage, HomePage, ItemDetail, ItemsPage, NotFoundPage, Widgets } from "./sharedComponents";
import type { BenchApp } from "./types";

export const homeRoute = rootAtom;
export const aboutRoute = staticRouteAtom("about");
export const itemsRoute = staticRouteAtom("items");
export const itemRoute = paramRouteAtom("itemId", { parent: itemsRoute });

// Built on useLink rather than jarl's <Link> so both apps render the identical
// anchor markup from their router's public hook primitives.
const NavItem = <T extends DefaultParams>({
  route,
  to,
  label,
  exact,
}: {
  route: RouteAtom<T>;
  to: T;
  label: string;
  exact?: boolean;
}) => {
  countRender("nav link");
  const [state, setRoute] = useAtom(route);
  // jarl's own `active` (useLink/activeClassName) is route-level: every link to a
  // route atom lights up whatever its `to` values, so two links to different items
  // are both "active". Narrowed here to href-level by also comparing param values,
  // to match react-router's semantics and keep both apps' markup identical.
  const matched = exact ? state.exact : state.match;
  const active =
    matched && Object.entries(to).every(([key, value]) => (state.values as Record<string, unknown>)[key] === value);
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
    <NavItem route={homeRoute} to={{}} label="Home" exact />
    <NavItem route={aboutRoute} to={{}} label="About" exact />
    <NavItem route={itemsRoute} to={{}} label="Items" />
    {itemIds.map((id) => (
      <NavItem key={id} route={itemRoute} to={{ itemId: id }} label={`Item ${id}`} exact />
    ))}
  </nav>
);

const Layout = () => {
  countRender("layout");
  return (
    <div>
      <Nav />
      <Widgets />
      <main>
        <Switch fallback={<NotFoundPage />}>
          <Route on={homeRoute} exact>
            <HomePage />
          </Route>
          <Route on={aboutRoute}>
            <AboutPage />
          </Route>
          <Route on={itemRoute}>{({ itemId }) => <ItemDetail itemId={itemId} />}</Route>
          <Route on={itemsRoute} exact>
            <ItemsPage />
          </Route>
        </Switch>
      </main>
    </div>
  );
};

/** Fresh store per mount, so consecutive scenario runs can't leak location state into each other. */
export const createJarlApp = (): BenchApp => {
  const store = createStore();
  return {
    element: (
      <Provider store={store}>
        <Layout />
      </Provider>
    ),
  };
};
