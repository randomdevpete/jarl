import { createRootRouteAtom, paramRouteAtom } from "jarl-atoms";
import { Link, Route, Switch } from "jarl-react";
import Markdown from "../lib/Markdown";
import { changelogEntries, changelogEntryFor, fullChangelog, ChangelogEntry } from "./changelogEntries";

// The page this is mounted on, so its version route below is a plain module-level atom.
const changelogRoot = createRootRouteAtom({ basePath: "/changelog" });
const versionRoute = paramRouteAtom("version", { parent: changelogRoot });

const ChangelogNav = () => (
  <nav>
    <Link route={changelogRoot} to={{}} exact>
      All releases
    </Link>
  </nav>
);

// Just tracks version history - distinct from the History page, which documents the v1
// architecture and why v2 moved to atoms.
const ChangelogIndex = () => (
  <>
    <h1>Changelog</h1>
    <ul>
      {changelogEntries.map((entry) => (
        <li key={entry.version}>
          <Link route={versionRoute} to={{ version: entry.version }}>
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

const ChangelogNotFound = ({ version }: { version: string }) => (
  <>
    <h1>Not found</h1>
    <p>No release named &ldquo;{version}&rdquo;.</p>
    <p>
      <Link route={changelogRoot} to={{}}>
        Back to the changelog
      </Link>
    </p>
  </>
);

const ChangelogVersionPage = ({ entry }: { entry: ChangelogEntry }) => (
  <>
    <Markdown source={entry.heading} />
    {entry.body ? <Markdown source={entry.body} /> : <p>No release notes recorded for this version.</p>}
    <p>
      <Link route={changelogRoot} to={{}}>
        Back to the changelog
      </Link>
    </p>
  </>
);

/**
 * Browsable release history: an index of versions parsed out of the generated CHANGELOG.md,
 * with one route per version.
 */
export const Changelog = () => (
  <>
    <ChangelogNav />
    <Switch fallback={<ChangelogNotFound version="" />}>
      <Route on={changelogRoot} exact>
        <ChangelogIndex />
      </Route>
      <Route on={versionRoute} exact>
        {({ version }) => {
          const entry = changelogEntryFor(version);
          return entry ? <ChangelogVersionPage entry={entry} /> : <ChangelogNotFound version={version} />;
        }}
      </Route>
    </Switch>
  </>
);

export default Changelog;
