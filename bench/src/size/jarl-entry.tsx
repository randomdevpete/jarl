// Bundle-size entry: a minimal jarl app touching the surface the benchmark app uses.
import { paramRouteAtom, rootAtom, staticRouteAtom } from "jarl-atoms";
import { Link, Route, Switch, useNavigate, useRoute } from "jarl-react";
import { Provider, createStore } from "jotai";
import { createRoot } from "react-dom/client";

const aboutRoute = staticRouteAtom("about");
const itemsRoute = staticRouteAtom("items");
const itemRoute = paramRouteAtom("itemId", { parent: itemsRoute });

const Item = () => {
  const route = useRoute(itemRoute);
  const goAbout = useNavigate(aboutRoute);
  return <button onClick={() => goAbout({})}>{route.match ? route.values.itemId : "none"}</button>;
};

const App = () => (
  <div>
    <Link route={itemRoute} to={{ itemId: "1" }} activeClassName="active">
      Item 1
    </Link>
    <Switch fallback={<h1>Not found</h1>}>
      <Route on={rootAtom} exact>
        <h1>Home</h1>
      </Route>
      <Route on={aboutRoute}>
        <h1>About</h1>
      </Route>
      <Route on={itemRoute}>
        <Item />
      </Route>
    </Switch>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Provider store={createStore()}>
    <App />
  </Provider>,
);
