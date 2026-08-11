import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { basicRoutingAtom, basicRoutingAboutAtom } from "../routes";
import { Link } from "jarl-react";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

const Home = () => {
  useTitle("Basic Routing - Home - JARL");
  return (
    <div>
      <div data-test="header">Home</div>
      <pre data-test="code">{'import { routing } from "jarl-react";'}</pre>
    </div>
  );
};

const About = () => {
  useTitle("Basic Routing - About - JARL");
  return <div data-test="header">About</div>;
};

const NotFound = ({ missingPath }: { missingPath: string }) => {
  useTitle("Basic Routing - 404 Not Found - JARL");
  return (
    <div>
      <div data-test="header">404 Not Found</div>
      <p data-test="mordor">One does not simply navigate to {missingPath}</p>
    </div>
  );
};

// Mirrors demo/cypress/integration/01BasicRouting.js. The `showMarker` state
// lives in this persistent wrapper (not the individual pages) so it survives
// a client-side JARL navigation but not a full browser reload - that's what
// the "clicking anchor reloads page" / "clicking Link doesn't reload page"
// scenarios are checking.
const BasicRouting = () => {
  const basic = useAtomValue(basicRoutingAtom);
  const about = useAtomValue(basicRoutingAboutAtom);
  const [showMarker, setShowMarker] = useState(false);

  let content;
  if (about.match) {
    content = <About />;
  } else if (basic.exact) {
    content = <Home />;
  } else {
    content = <NotFound missingPath={basic.match ? basic.rest.path.join("/") : ""} />;
  }

  return (
    <div>
      <nav>
        <Link route={basicRoutingAtom} data-test="home-link">
          Home
        </Link>{" "}
        <Link route={basicRoutingAboutAtom} data-test="about-link">
          About
        </Link>
      </nav>
      {content}
      {showMarker ? (
        <div data-test="marker">
          This is showing because the marker was set. Navigating via JARL&rsquo;s Link component should not cause this
          state to reset, but clicking a normal anchor will.
          <br />
          <a data-test="marker-anchor" href="/basicRouting">
            Here is an anchor to test that!
          </a>
        </div>
      ) : (
        <button data-test="marker-button" onClick={() => setShowMarker(true)}>
          Marker
        </button>
      )}
    </div>
  );
};

export default BasicRouting;
