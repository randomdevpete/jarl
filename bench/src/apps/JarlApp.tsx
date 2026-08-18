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

// Built from hook primitives rather than <Link>, so both apps render identical anchor markup.
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
  // jarl's own `active` is route-level, so two links to different items both light up.
  // Narrowed to href-level here to match react-router's semantics.
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
