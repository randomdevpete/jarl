import jarlAtomsIntro from "../content/api-jarl-atoms.md?raw";
import jarlReactIntro from "../content/api-jarl-react.md?raw";
import jarlAtomsReference from "../content/generated/api-jarl-atoms.md?raw";
import jarlReactReference from "../content/generated/api-jarl-react.md?raw";
import styled from "@emotion/styled";
import LinkList from "../lib/LinkList";
import Markdown from "../lib/Markdown";
import { Link } from "jarl-react";
import { apiPageRoute, apiPages, ApiName } from "../router/routes";
import { theme } from "../theme";

// Hand-written orientation, then the reference generated from that package's doc comments.
const content: Record<ApiName, string> = {
  "jarl-atoms": `${jarlAtomsIntro}\n\n${jarlAtomsReference}`,
  "jarl-react": `${jarlReactIntro}\n\n${jarlReactReference}`,
};

const PackageTabs = styled.nav`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  a {
    padding: 0.3rem 0.8rem;
    border: 1px solid ${theme.border};
    border-radius: 999px;
    color: ${theme.fgMuted};
  }

  a[data-active] {
    color: ${theme.accentStrong};
    border-color: ${theme.accent};
  }
`;

export const ApiIndex = () => (
  <>
    <h1>API reference</h1>
    <LinkList>
      {apiPages.map(({ apiName, title }) => (
        <li key={apiName}>
          <Link route={apiPageRoute} to={{ apiName }}>
            {title}
          </Link>
        </li>
      ))}
    </LinkList>
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
      <PackageTabs>
        {apiPages.map(({ apiName: name, title }) => (
          <Link key={name} route={apiPageRoute} to={{ apiName: name }} exact>
            {title}
          </Link>
        ))}
      </PackageTabs>
      <Markdown source={source} />
    </>
  );
};

export default ApiIndex;
