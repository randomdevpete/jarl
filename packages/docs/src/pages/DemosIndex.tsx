import { Link } from "jarl-react";
import LinkList from "../lib/LinkList";
import { asyncLookupDemoRoute, basicRoutingDemoRoute, blogRoutingDemoRoute, dataGridDemoRoute } from "../router/routes";

export const DemosIndex = () => (
  <>
    <h1>Live demos</h1>
    <p>
      These demos are built on the v2 draft&apos;s jotai-atoms router (vendored and adapted for this site - see the{" "}
      <Link route={basicRoutingDemoRoute} to={{}}>
        demo below
      </Link>
      , and the <a href="/history">v1 History</a> page for why v1 didn&apos;t work this way).
    </p>
    <LinkList>
      <li>
        <Link route={basicRoutingDemoRoute} to={{}}>
          Basic routing
        </Link>{" "}
        &mdash; a nested router-within-a-router built from <code>staticRouteAtom</code>/<code>paramRouteAtom</code> and
        the atoms-based <code>Link</code>/<code>Route</code> components.
      </li>
      <li>
        <Link route={blogRoutingDemoRoute} to={{}}>
          Blog routing
        </Link>{" "}
        &mdash; a classic <code>/blog/:year/:month/:day/:slug</code> tree, hand-composed from{" "}
        <code>numericRouteAtom</code> chained as parent/child, with 404s for out-of-range and non-existent dates.
      </li>
      <li>
        <Link route={dataGridDemoRoute} to={{}}>
          Data grid filter/sort
        </Link>{" "}
        &mdash; a table whose filter text and sort column live in <code>queryParamRouteAtom</code>s chained off the
        mount route, so the grid&apos;s state is shareable and moves with back/forward navigation.
      </li>
      <li>
        <Link route={asyncLookupDemoRoute} to={{}}>
          Async lookup
        </Link>{" "}
        &mdash; a route that exists only if an async database lookup finds it, built on <code>asyncRouteAtom</code>: the
        article it loads arrives on the route&apos;s own typed state, and a miss is a real 404 in the server-rendered
        response.
      </li>
    </LinkList>
  </>
);

export default DemosIndex;
