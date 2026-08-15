import { Link } from "jarl-react";
import LinkList from "../lib/LinkList";
import { basicRoutingDemoRoute, blogRoutingDemoRoute } from "../router/routes";

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
    </LinkList>
  </>
);

export default DemosIndex;
