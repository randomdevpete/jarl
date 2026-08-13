import jarlAtomsIntro from "../content/api-jarl-atoms.md?raw";
import jarlReactIntro from "../content/api-jarl-react.md?raw";
import jarlAtomsReference from "../content/generated/api-jarl-atoms.md?raw";
import jarlReactReference from "../content/generated/api-jarl-react.md?raw";
import Markdown from "../lib/Markdown";
import { Link } from "jarl-react";
import { apiPageRoute, apiPages, ApiName } from "../router/routes";

// Hand-written orientation, then the reference generated from that package's doc comments.
const content: Record<ApiName, string> = {
  "jarl-atoms": `${jarlAtomsIntro}\n\n${jarlAtomsReference}`,
  "jarl-react": `${jarlReactIntro}\n\n${jarlReactReference}`,
};

export const ApiIndex = () => (
  <>
    <h1>API reference</h1>
    <ul className="doc-index">
      {apiPages.map(({ apiName, title }) => (
        <li key={apiName}>
          <Link route={apiPageRoute} to={{ apiName }}>
            {title}
          </Link>
        </li>
      ))}
    </ul>
  </>
);

export const ApiPage = ({ apiName }: { apiName: string }) => {
  const source = content[apiName as ApiName];
  if (!source) {
    return (
      <>
        <h1>Not found</h1>
        <p>
          No API reference named &ldquo;{apiName}&rdquo;. Back to{" "}
          <Link route={apiPageRoute} to={{ apiName: apiPages[0].apiName }}>
            API
          </Link>
          .
        </p>
      </>
    );
  }
  return (
    <>
      <nav className="tag-nav">
        {apiPages.map(({ apiName: name, title }) => (
          <Link key={name} route={apiPageRoute} to={{ apiName: name }} exact>
            {title}
          </Link>
        ))}
      </nav>
      <Markdown source={source} />
    </>
  );
};

export default ApiIndex;
