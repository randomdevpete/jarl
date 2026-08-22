import gettingStarted from "../content/guides/GettingStarted.md?raw";
import dataLoading from "../content/guides/DataLoading.md?raw";
import pathVariables from "../content/guides/PathVariables.md?raw";
import LinkList from "../lib/LinkList";
import Markdown from "../lib/Markdown";
import { Link } from "jarl-react";
import { docPageRoute, docPages, DocName } from "../router/routes";

const guides: Record<DocName, string> = {
  "getting-started": gettingStarted,
  "data-loading": dataLoading,
  "path-variables": pathVariables,
};

export const DocsIndex = () => (
  <>
    <h1>Docs</h1>
    <p>
      Guides for using JARL's atomic routing model - the route atoms in <code>jarl-atoms</code> and the React bindings
      in <code>jarl-react</code>.
    </p>
    <LinkList>
      {docPages.map(({ docName, title }) => (
        <li key={docName}>
          <Link route={docPageRoute} to={{ docName }}>
            {title}
          </Link>
        </li>
      ))}
    </LinkList>
  </>
);

export const DocPage = ({ docName }: { docName: DocName }) => <Markdown source={guides[docName]} />;

export default DocsIndex;
