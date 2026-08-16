import { useMemo } from "react";
import { rootAtom as defaultRootAtom, paramRouteAtom, DefaultParams, RouteAtom } from "jarl-atoms";
import { Link, Route, Switch } from "jarl-react";
import Markdown from "../lib/Markdown";
import { changelogEntries, changelogEntryFor, fullChangelog, ChangelogEntry } from "./changelogEntries";

// Owns its own route tree, same shape as BlogRoutingApp: one param route for the version,
// parented on whatever root it is mounted under.
const createChangelogRoutes = (root: RouteAtom<DefaultParams>) => ({
  root,
  version: paramRouteAtom("version", { parent: root }),
});

type ChangelogRoutes = ReturnType<typeof createChangelogRoutes>;

const ChangelogNav = ({ routes }: { routes: ChangelogRoutes }) => (
  <nav>
    <Link route={routes.root} to={{}} exact>
      All releases
    </Link>
  </nav>
);

// Just tracks version history - distinct from the History page, which documents the v1
// architecture and why v2 moved to atoms.
const ChangelogIndex = ({ routes }: { routes: ChangelogRoutes }) => (
  <>
    <h1>Changelog</h1>
    <ul>
      {changelogEntries.map((entry) => (
        <li key={entry.version}>
          <Link route={routes.version} to={{ version: entry.version }}>
            {entry.version}
          </Link>
          {entry.date && <span> &mdash; {entry.date}</span>}
        </li>
      ))}
    </ul>
    <details>
      <summary>Full changelog</summary>
      <Markdown source={fullChangelog} />
    </details>
  </>
);

const ChangelogNotFound = ({ routes, version }: { routes: ChangelogRoutes; version: string }) => (
  <>
    <h1>Not found</h1>
    <p>No release named &ldquo;{version}&rdquo;.</p>
    <p>
      <Link route={routes.root} to={{}}>
        Back to the changelog
      </Link>
    </p>
  </>
);

const ChangelogVersionPage = ({ routes, entry }: { routes: ChangelogRoutes; entry: ChangelogEntry }) => (
  <>
    <Markdown source={entry.heading} />
    {entry.body ? <Markdown source={entry.body} /> : <p>No release notes recorded for this version.</p>}
    <p>
      <Link route={routes.root} to={{}}>
        Back to the changelog
      </Link>
    </p>
  </>
);

/**
 * Browsable release history: an index of versions parsed out of the generated CHANGELOG.md,
 * with one route per version. Pass the route atom it is mounted on as `rootAtom`.
 */
export const Changelog = ({ rootAtom = defaultRootAtom }: { rootAtom?: RouteAtom<DefaultParams> }) => {
  const routes = useMemo(() => createChangelogRoutes(rootAtom), [rootAtom]);
  return (
    <>
      <ChangelogNav routes={routes} />
      <Switch fallback={<ChangelogNotFound routes={routes} version="" />}>
        <Route on={routes.root} exact>
          <ChangelogIndex routes={routes} />
        </Route>
        <Route on={routes.version} exact>
          {({ version }) => {
            const entry = changelogEntryFor(version);
            return entry ? (
              <ChangelogVersionPage routes={routes} entry={entry} />
            ) : (
              <ChangelogNotFound routes={routes} version={version} />
            );
          }}
        </Route>
      </Switch>
    </>
  );
};

export default Changelog;
