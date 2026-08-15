import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { rootAtom, changelogAtom, shellMissingAtom } from "../routes";
import { Link } from "jarl-react";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

const Home = () => {
  useTitle("About - JARL");
  return (
    <div data-test="content">
      <h1>JARL: Atomic Routing Library</h1>
      <p>Routing for the atomic age</p>
      <p data-test="version">v{__JARL_VERSION__}</p>
    </div>
  );
};

const Changelog = () => {
  useTitle("Changelog - JARL");
  return (
    <div data-test="content">
      <h1>JARL: Version History</h1>
      <h2>v{__JARL_VERSION__}</h2>
    </div>
  );
};

const NotFound = ({ missingPath }: { missingPath: string }) => {
  useTitle("Not Found - JARL");
  return (
    <div>
      <div data-test="header">Not Found</div>
      <div data-test="body">Could not find /{missingPath}</div>
    </div>
  );
};

// Top-level "shell" of the fixture app: home/about, changelog, and the
// catch-all 404. Mirrors demo/cypress/integration/00DemosShell.js.
const Shell = () => {
  const root = useAtomValue(rootAtom);
  const changelog = useAtomValue(changelogAtom);
  const missing = useAtomValue(shellMissingAtom);

  let content;
  if (changelog.match) {
    content = <Changelog />;
  } else if (root.exact) {
    content = <Home />;
  } else if (missing.match && missing.values) {
    content = <NotFound missingPath={missing.values.missingPath} />;
  } else {
    // Deeper unmatched paths (e.g. two+ segments) aren't caught by
    // shellMissingAtom, which only matches a single top-level segment.
    content = <NotFound missingPath={root.match ? root.rest.path.join("/") : ""} />;
  }

  return (
    <div>
      <nav>
        <Link route={rootAtom} data-test="home-nav-link">
          Home
        </Link>{" "}
        <Link route={changelogAtom} data-test="changelog-nav-link">
          Changelog
        </Link>
      </nav>
      {content}
    </div>
  );
};

export default Shell;
